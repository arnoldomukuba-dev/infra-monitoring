import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.database import SessionLocal
from app.models.user import User

client = TestClient(app)


def get_token_for(username: str, password: str) -> str:
    res = client.post("/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def ensure_default_users():
    db: Session = SessionLocal()
    try:
        from app.core.security import get_password_hash
        default_users = [
            ("admin", "admin@odrisystems.io", "Admin#2026SecPass!", "ADMIN"),
            ("manager", "manager@odrisystems.io", "manager123", "INFRASTRUCTURE_MANAGER"),
            ("operator", "operator@odrisystems.io", "operator123", "MONITORING_OPERATOR"),
            ("readonly", "readonly@odrisystems.io", "readonly123", "READ_ONLY"),
        ]

        for uname, uemail, upass, urole in default_users:
            u_exists = db.query(User).filter(User.username == uname).first()
            if not u_exists:
                db.add(User(
                    username=uname,
                    email=uemail,
                    hashed_password=get_password_hash(upass),
                    role=urole,
                    is_admin=(urole == "ADMIN"),
                    is_active=True
                ))
            else:
                u_exists.hashed_password = get_password_hash(upass)
                u_exists.role = urole
                u_exists.is_admin = (urole == "ADMIN")
                u_exists.is_active = True
        db.commit()
    finally:
        db.close()


def test_rbac_authentication_and_authorization():
    ensure_default_users()

    # 1. Test Login for all 4 RBAC roles
    admin_token = get_token_for("admin", "Admin#2026SecPass!")
    manager_token = get_token_for("manager", "manager123")
    operator_token = get_token_for("operator", "operator123")
    readonly_token = get_token_for("readonly", "readonly123")

    assert admin_token and manager_token and operator_token and readonly_token

    # 2. Test GET /auth/me returns current user without password
    res_me = client.get("/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_me.status_code == 200
    user_me = res_me.json()
    assert user_me["username"] == "admin"
    assert user_me["role"] == "ADMIN"
    assert "password" not in user_me
    assert "hashed_password" not in user_me

    # 3. Test User Management endpoint authorization: ADMIN vs Non-ADMIN
    # ADMIN can list users
    res_users_admin = client.get("/users/", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_users_admin.status_code == 200
    users_list = res_users_admin.json()
    assert len(users_list) >= 4

    # Non-ADMIN (MANAGER, OPERATOR, READONLY) receives 403 Forbidden on /users/
    for tok, name in [(manager_token, "manager"), (operator_token, "operator"), (readonly_token, "readonly")]:
        res_user_forbidden = client.get("/users/", headers={"Authorization": f"Bearer {tok}"})
        assert res_user_forbidden.status_code == 403, f"User {name} should receive 403 on GET /users/"

    # Unauthenticated request receives 401 Unauthorized
    res_unauth = client.get("/users/")
    assert res_unauth.status_code == 401

    # 4. ADMIN creates a new user account
    new_user_payload = {
        "username": "test_operator_user",
        "email": "testop@odrisystems.io",
        "password": "Password123!",
        "role": "MONITORING_OPERATOR"
    }
    res_create = client.post("/users/", json=new_user_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_create.status_code == 201
    created_user = res_create.json()
    assert created_user["username"] == "test_operator_user"
    assert created_user["role"] == "MONITORING_OPERATOR"

    # Manager attempting to create user receives 403 Forbidden
    res_create_forbidden = client.post("/users/", json=new_user_payload, headers={"Authorization": f"Bearer {manager_token}"})
    assert res_create_forbidden.status_code == 403

    # 5. ADMIN updates the created user role
    update_payload = {"role": "INFRASTRUCTURE_MANAGER"}
    res_update = client.put(f"/users/{created_user['id']}", json=update_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_update.status_code == 200
    assert res_update.json()["role"] == "INFRASTRUCTURE_MANAGER"

    # 6. ADMIN deletes the created user
    res_del = client.delete(f"/users/{created_user['id']}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_del.status_code == 200

    # 7. Test Role Restrictions on Server Deletion
    # Create test server first
    srv_res = client.post(
        "/servers/",
        json={"name": "RBAC Test Server", "host": "10.0.0.99", "os": "Ubuntu 22.04", "description": "Test server for RBAC"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert srv_res.status_code == 201
    test_srv_id = srv_res.json()["id"]

    # READ_ONLY user attempting DELETE /servers/{id} receives 403 Forbidden
    res_del_ro = client.delete(f"/servers/{test_srv_id}", headers={"Authorization": f"Bearer {readonly_token}"})
    assert res_del_ro.status_code == 403

    # OPERATOR user attempting DELETE /servers/{id} receives 403 Forbidden
    res_del_op = client.delete(f"/servers/{test_srv_id}", headers={"Authorization": f"Bearer {operator_token}"})
    assert res_del_op.status_code == 403

    # INFRASTRUCTURE_MANAGER attempting DELETE /servers/{id} succeeds
    res_del_mgr = client.delete(f"/servers/{test_srv_id}", headers={"Authorization": f"Bearer {manager_token}"})
    assert res_del_mgr.status_code == 24 or res_del_mgr.status_code == 204

    # 8. Password Hashing Verification in Database
    db: Session = SessionLocal()
    try:
        db_admin = db.query(User).filter(User.username == "admin").first()
        assert db_admin is not None
        assert db_admin.hashed_password != "admin123"
        assert db_admin.hashed_password.startswith("$2b$") or db_admin.hashed_password.startswith("$2a$")
    finally:
        db.close()
