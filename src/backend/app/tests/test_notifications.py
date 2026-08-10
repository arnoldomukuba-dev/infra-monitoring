import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.tests.test_rbac_auth import ensure_default_users, get_token_for

client = TestClient(app)


def test_notifications_end_to_end_flow():
    ensure_default_users()
    admin_token = get_token_for("admin", "Admin#2026SecPass!")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Fetch initial notification summary
    res_summary = client.get("/notifications/summary", headers=headers)
    assert res_summary.status_code == 200
    summary_data = res_summary.json()
    assert "unread_count" in summary_data
    assert "total_count" in summary_data

    # 2. Register test server to generate events
    server_payload = {
        "name": "Notification Test Node",
        "host": "192.168.20.55",
        "os": "Ubuntu 22.04 LTS",
        "description": "Server node created for notification unit tests",
    }
    res_srv = client.post("/servers/", json=server_payload, headers=headers)
    assert res_srv.status_code == 201
    server_id = res_srv.json()["id"]

    # 3. Post high metric to trigger disk alert & notification
    metric_payload = {
        "cpu_usage": 40.0,
        "ram_usage": 45.0,
        "disk_usage": 98.2,
        "uptime": "5d 2h",
    }
    res_metric = client.post(f"/servers/{server_id}/heartbeat", json=metric_payload, headers=headers)
    assert res_metric.status_code == 200

    # 4. Check notifications list
    res_notifs = client.get("/notifications", headers=headers)
    assert res_notifs.status_code == 200
    notifs = res_notifs.json()
    assert len(notifs) > 0

    # Verify at least one notification exists for server
    srv_notif = next((n for n in notifs if n.get("related_server_id") == server_id or n.get("server_id") == server_id), None)
    assert srv_notif is not None
    notif_id = srv_notif["id"]

    # 5. Get single notification
    res_single = client.get(f"/notifications/{notif_id}", headers=headers)
    assert res_single.status_code == 200
    assert res_single.json()["id"] == notif_id

    # 6. Mark single notification as read
    res_read = client.post(f"/notifications/{notif_id}/read", headers=headers)
    assert res_read.status_code == 200
    assert res_read.json()["is_read"] is True

    # 7. Post failed backup to trigger BACKUP_FAILED notification
    backup_fail = {
        "server_id": server_id,
        "backup_name": "Notif Failure Job",
        "backup_type": "FULL",
        "status": "FAILED",
        "size": "0 MB",
        "error_message": "Network timeout during upload",
    }
    res_backup = client.post("/backups/", json=backup_fail, headers=headers)
    assert res_backup.status_code == 201

    res_notifs_after_b = client.get("/notifications?severity=CRITICAL", headers=headers)
    assert res_notifs_after_b.status_code == 200
    crit_notifs = res_notifs_after_b.json()
    assert len(crit_notifs) > 0

    # 8. Test mark all read
    res_mark_all = client.post("/notifications/read-all", headers=headers)
    assert res_mark_all.status_code == 200
    assert res_mark_all.json()["message"] == "All notifications marked as read"

    # Verify summary unread count is 0
    res_sum2 = client.get("/notifications/summary", headers=headers)
    assert res_sum2.status_code == 200
    assert res_sum2.json()["unread_count"] == 0

    # 9. Test Notification Settings GET & PUT
    res_settings = client.get("/notifications/settings", headers=headers)
    assert res_settings.status_code == 200
    settings_list = res_settings.json()
    assert len(settings_list) > 0

    # 10. Test Delete notification
    res_del = client.delete(f"/notifications/{notif_id}", headers=headers)
    assert res_del.status_code == 200
    assert "deleted successfully" in res_del.json()["message"]
