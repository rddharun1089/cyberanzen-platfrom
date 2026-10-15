import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "HEALTHY"

def test_admin_and_user_login():
    # Admin login
    res = client.post("/api/v1/auth/login", json={"username": "lead_investigator", "password": "Investigator#2026!"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    admin_token = data["access_token"]

    # User login
    res_user = client.post("/api/v1/auth/login", json={"username": "cadet_forensic", "password": "Investigator#2026!"})
    assert res_user.status_code == 200
    assert res_user.json()["role"] == "participant"

    # Invalid login
    res_inv = client.post("/api/v1/auth/login", json={"username": "fake_user", "password": "bad_password"})
    assert res_inv.status_code == 401

def test_list_and_filter_cases():
    res = client.get("/api/v1/cases")
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) > 50  # At least all published cases

    # Filter by domain
    res_domain = client.get("/api/v1/cases?domain=Cybersecurity %26 Digital Forensics")
    assert res_domain.status_code == 200
    assert len(res_domain.json()) == 12

def test_case_detail_privacy():
    res = client.get("/api/v1/cases/CASE-01")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "CASE-01"
    assert data["title"] == "The Dead Server"
    assert "sample_tests" in data
    assert len(data["sample_tests"]) >= 1
    # Hidden test cases and reference solution must NEVER be exposed
    assert "hidden_tests" not in data
    assert "reference_solution" not in data

def test_run_sample_execution():
    login_res = client.post("/api/v1/auth/login", json={"username": "cadet_forensic", "password": "Investigator#2026!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Valid Python code for Case 01
    valid_code = """
n = int(input())
a = [input().split() for _ in range(n)]
a.sort(key=lambda x: int(x[0]))
seen = set()
for x in a:
    k = (x[0], x[1])
    if k in seen:
        print("FLAG", x[1])
        break
    seen.add(k)
else:
    print("FLAG NONE")
"""
    res = client.post("/api/v1/submissions/run-sample", json={
        "case_id": "CASE-01",
        "language": "python3",
        "source_code": valid_code
    }, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["verdict"] == "ACCEPTED"
    assert len(data["test_results"]) >= 1
    assert data["test_results"][0]["verdict"] == "ACCEPTED"

def test_submit_solution_and_evidence_unlock():
    login_res = client.post("/api/v1/auth/login", json={"username": "cadet_forensic", "password": "Investigator#2026!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    valid_code = """
n = int(input())
a = [input().split() for _ in range(n)]
a.sort(key=lambda x: int(x[0]))
seen = set()
for x in a:
    k = (x[0], x[1])
    if k in seen:
        print("FLAG", x[1])
        break
    seen.add(k)
else:
    print("FLAG NONE")
"""
    res = client.post("/api/v1/submissions/submit", json={
        "case_id": "CASE-01",
        "language": "python3",
        "source_code": valid_code
    }, headers=headers)

    assert res.status_code == 200
    data = res.json()
    assert data["verdict"] == "ACCEPTED"
    assert data["score"] == 50
    assert "unlocked_token" in data
    assert "FLAG{CASE_01_" in data["unlocked_token"]

def test_leaderboard_and_stats():
    res_lb = client.get("/api/v1/leaderboard")
    assert res_lb.status_code == 200
    assert len(res_lb.json()) >= 1

    res_stats = client.get("/api/v1/stats")
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["total_cases"] == 80
    assert stats["total_users"] >= 2

def test_evidence_graph():
    login_res = client.post("/api/v1/auth/login", json={"username": "cadet_forensic", "password": "Investigator#2026!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/evidence/graph", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_cases"] == 80
    assert len(data["nodes"]) >= 80

def test_git_sync_preview_admin():
    login_res = client.post("/api/v1/auth/login", json={"username": "lead_investigator", "password": "Investigator#2026!"})
    admin_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.post("/api/v1/admin/git/preview", json={}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "scan_summary" in data
    assert data["scan_summary"]["total_scanned"] == 80
