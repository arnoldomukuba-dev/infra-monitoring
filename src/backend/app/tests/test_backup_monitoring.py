import pytest
from fastapi.testclient import TestClient
from app.main import app

from app.tests.test_rbac_auth import ensure_default_users, get_token_for

client = TestClient(app)


def test_backup_monitoring_flow():
    ensure_default_users()
    admin_token = get_token_for("admin", "Admin#2026SecPass!")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create a server node
    server_res = client.post(
        "/servers/",
        json={
            "name": "Backup Test Server Node",
            "host": "10.0.0.99",
            "os": "Ubuntu 22.04 LTS",
            "description": "Node for testing backup monitoring flow",
        },
        headers=headers,
    )
    assert server_res.status_code == 201, server_res.text
    server_id = server_res.json()["id"]

    # 2. Create a SUCCESS backup record
    b1_res = client.post(
        "/backups/",
        json={
            "server_id": server_id,
            "backup_name": "Daily PostgreSQL Dump",
            "backup_type": "DATABASE",
            "source": "/var/lib/postgresql/data",
            "destination": "s3://odri-vault/db_backups/",
            "status": "SUCCESS",
            "size": "4.2 GB",
            "duration": "18m 30s",
        },
        headers=headers,
    )
    assert b1_res.status_code == 201, b1_res.text
    b1_id = b1_res.json()["id"]
    assert b1_res.json()["status"] == "SUCCESS"

    # 3. Create a FAILED backup record (Must generate CRITICAL Alert)
    b2_res = client.post(
        "/backups/",
        json={
            "server_id": server_id,
            "backup_name": "Nightly System Image",
            "backup_type": "FULL",
            "source": "/",
            "destination": "s3://odri-vault/system_images/",
            "status": "FAILED",
            "size": "45.0 GB",
            "duration": "02m 10s",
            "error_message": "S3 Vault authentication payload rejected",
        },
        headers=headers,
    )
    assert b2_res.status_code == 201, b2_res.text
    b2_id = b2_res.json()["id"]
    assert b2_res.json()["status"] == "FAILED"

    # 4. Confirm CRITICAL Alert was generated in PostgreSQL for Failed Backup
    alert_res = client.get("/alerts/?severity=CRITICAL&status=ACTIVE", headers=headers)
    assert alert_res.status_code == 200, alert_res.text
    alerts = alert_res.json()
    failed_backup_alerts = [a for a in alerts if a["alert_type"] == "BACKUP" and "Nightly System Image" in a["message"]]
    assert len(failed_backup_alerts) > 0, f"Expected CRITICAL backup alert in {alerts}"

    # 5. Check Backup Statistics Endpoint
    sum_res = client.get("/backups/dashboard/summary", headers=headers)
    assert sum_res.status_code == 200, sum_res.text
    summary = sum_res.json()
    assert summary["total_backups"] >= 2
    assert summary["failed_backups"] >= 1

    # 6. Test GET /backups/ with server_id filter
    list_res = client.get(f"/backups/?server_id={server_id}", headers=headers)
    assert list_res.status_code == 200, list_res.text
    node_backups = list_res.json()
    assert len(node_backups) == 2

    # 7. Update backup status
    put_res = client.put(f"/backups/{b2_id}", json={"status": "SUCCESS", "error_message": None}, headers=headers)
    assert put_res.status_code == 200, put_res.text
    assert put_res.json()["status"] == "SUCCESS"

    # 8. Delete test backups and server node
    client.delete(f"/backups/{b1_id}", headers=headers)
    client.delete(f"/backups/{b2_id}", headers=headers)
    client.delete(f"/servers/{server_id}", headers=headers)
