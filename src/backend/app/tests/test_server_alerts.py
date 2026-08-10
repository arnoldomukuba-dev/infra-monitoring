import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.database import Base, get_db

from app.tests.test_rbac_auth import ensure_default_users, get_token_for

# Setup test client
client = TestClient(app)


def test_servers_and_alerts_flow():
    ensure_default_users()
    admin_token = get_token_for("admin", "Admin#2026SecPass!")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Health check
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

    # 2. Get list of servers
    response = client.get("/servers/", headers=headers)
    assert response.status_code == 200
    servers = response.json()
    assert isinstance(servers, list)
    assert len(servers) > 0

    server_id = servers[0]["id"]

    # 3. Get server summary
    response = client.get("/servers/summary", headers=headers)
    assert response.status_code == 200
    summary = response.json()
    assert "total_servers" in summary
    assert "critical_servers" in summary

    # 4. Trigger metric collection on server
    response = client.post(f"/servers/{server_id}/collect", headers=headers)
    assert response.status_code == 200
    metric = response.json()
    assert "cpu_usage" in metric
    assert "disk_usage" in metric

    # 5. Fetch server metrics history
    response = client.get(f"/servers/{server_id}/metrics", headers=headers)
    assert response.status_code == 200
    metrics_list = response.json()
    assert len(metrics_list) > 0

    # 6. Fetch alerts list
    response = client.get("/alerts/", headers=headers)
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)

    # 7. Fetch alerts summary
    response = client.get("/alerts/summary", headers=headers)
    assert response.status_code == 200
    alert_sum = response.json()
    assert "total_active" in alert_sum

    # 8. Test Acknowledge and Resolve if alerts exist
    if len(alerts) > 0:
        target_alert_id = alerts[0]["id"]

        # Acknowledge
        ack_res = client.post(f"/alerts/{target_alert_id}/acknowledge", headers=headers)
        assert ack_res.status_code == 200
        assert ack_res.json()["status"] == "ACKNOWLEDGED"

        # Resolve
        res_res = client.post(f"/alerts/{target_alert_id}/resolve", headers=headers)
        assert res_res.status_code == 200
        assert res_res.json()["status"] == "RESOLVED"
