import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))
from app.main import app
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

client = TestClient(app)

def test_password_hashing():
    pwd = "SecretPasskey#2026!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong_passkey", hashed) is False

def test_jwt_token_flow():
    payload = {"sub": "investigator_007", "role": "participant"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "investigator_007"
    assert decoded["role"] == "participant"
    assert "exp" in decoded

def test_rbac_admin_protection():
    # 1. Login as standard participant
    user_res = client.post("/api/v1/auth/login", json={"username": "cadet_forensic", "password": "Investigator#2026!"})
    user_token = user_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # Standard participant tries to access Admin endpoints -> 403 FORBIDDEN
    admin_ep = client.get("/api/v1/admin/cases", headers=user_headers)
    assert admin_ep.status_code == 403

    # 2. Login as admin
    admin_res = client.post("/api/v1/auth/login", json={"username": "lead_investigator", "password": "Investigator#2026!"})
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin access -> 200 OK
    admin_ok = client.get("/api/v1/admin/cases", headers=admin_headers)
    assert admin_ok.status_code == 200
