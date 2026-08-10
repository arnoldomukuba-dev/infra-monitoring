import pytest
from fastapi.testclient import TestClient

from app.main import app

from app.tests.test_rbac_auth import ensure_default_users, get_token_for

client = TestClient(app)


def test_audit_logs_end_to_end_flow():
    ensure_default_users()
    admin_token = get_token_for("admin", "Admin#2026SecPass!")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Register a new server and verify SERVER_REGISTERED audit log entry
    server_payload = {
        "name": "Audit Test Server Node",
        "host": "192.168.10.99",
        "os": "Ubuntu 22.04 LTS",
        "description": "Node created for audit log testing",
    }
    res_srv = client.post("/servers/", json=server_payload, headers=headers)
    assert res_srv.status_code == 201
    server_data = res_srv.json()
    server_id = server_data["id"]

    # 2. Fetch logs and verify SERVER_REGISTERED is recorded
    res_logs = client.get("/logs?event_type=SERVER_REGISTERED", headers=headers)
    assert res_logs.status_code == 200
    registered_logs = res_logs.json()["logs"]
    assert len(registered_logs) > 0
    assert any(l["server_id"] == server_id for l in registered_logs)

    # 3. Push critical disk metric to trigger threshold alert & check METRIC_THRESHOLD_EXCEEDED / ALERT_CREATED
    metric_payload = {
        "cpu_usage": 45.0,
        "ram_usage": 50.0,
        "disk_usage": 96.5,
        "uptime": "2d 4h 12m",
    }
    res_metric = client.post(f"/servers/{server_id}/heartbeat", json=metric_payload, headers=headers)
    assert res_metric.status_code == 200

    res_alert_logs = client.get("/logs?event_type=ALERT_CREATED", headers=headers)
    assert res_alert_logs.status_code == 200
    alert_logs = res_alert_logs.json()["logs"]
    assert len(alert_logs) > 0

    # 4. Create successful backup & check BACKUP_SUCCEEDED log
    backup_succ = {
        "server_id": server_id,
        "backup_name": "Audit Success Backup",
        "backup_type": "FULL",
        "status": "SUCCESS",
        "size": "2.4 GB",
    }
    res_b_succ = client.post("/backups/", json=backup_succ, headers=headers)
    assert res_b_succ.status_code == 201

    res_succ_logs = client.get("/logs?event_type=BACKUP_SUCCEEDED", headers=headers)
    assert res_succ_logs.status_code == 200
    succ_logs = res_succ_logs.json()["logs"]
    assert len(succ_logs) > 0

    # 5. Create failed backup & check BACKUP_FAILED log
    backup_fail = {
        "server_id": server_id,
        "backup_name": "Audit Failed Backup",
        "backup_type": "INCREMENTAL",
        "status": "FAILED",
        "size": "0 MB",
        "error_message": "Disk I/O error during snapshot",
    }
    res_b_fail = client.post("/backups/", json=backup_fail, headers=headers)
    assert res_b_fail.status_code == 201

    res_fail_logs = client.get("/logs?event_type=BACKUP_FAILED", headers=headers)
    assert res_fail_logs.status_code == 200
    fail_logs = res_fail_logs.json()["logs"]
    assert len(fail_logs) > 0

    # 6. Fetch alert for server and test Acknowledge & Resolve audit logging
    res_alerts = client.get(f"/alerts/?server_id={server_id}", headers=headers)
    assert res_alerts.status_code == 200
    alerts = res_alerts.json()

    if len(alerts) > 0:
        target_alert_id = alerts[0]["id"]

        # Acknowledge
        ack_res = client.post(f"/alerts/{target_alert_id}/acknowledge", headers=headers)
        assert ack_res.status_code == 200
        res_ack_logs = client.get("/logs?event_type=ALERT_ACKNOWLEDGED", headers=headers)
        assert res_ack_logs.status_code == 200
        assert len(res_ack_logs.json()["logs"]) > 0

        # Resolve
        res_res = client.post(f"/alerts/{target_alert_id}/resolve", headers=headers)
        assert res_res.status_code == 200
        res_res_logs = client.get("/logs?event_type=ALERT_RESOLVED", headers=headers)
        assert res_res_logs.status_code == 200
        assert len(res_res_logs.json()["logs"]) > 0

    # 7. Test single log detail endpoint GET /logs/{id}
    first_log_id = registered_logs[0]["id"]
    res_single = client.get(f"/logs/{first_log_id}", headers=headers)
    assert res_single.status_code == 200
    assert res_single.json()["id"] == first_log_id
