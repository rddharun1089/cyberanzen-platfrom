import pytest
import json
import hashlib
import time
from starlette.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, UserRole, Event, DSAQuestion, DSATestCase, CompetitionTemplate, EventDSAQuestion, Solve
from app.core.security import hash_password, create_access_token

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def admin_token(db_session):
    admin = db_session.query(User).filter(User.username == "admin_studio_test").first()
    if not admin:
        admin = User(
            username="admin_studio_test",
            email="admin_studio@cyberanzen.io",
            hashed_password=hash_password("AdminPass123!"),
            role=UserRole.SUPER_ADMIN.value
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return create_access_token({"sub": admin.username})

@pytest.fixture
def cadet_token(db_session):
    cadet = db_session.query(User).filter(User.username == "cadet_studio_test").first()
    if not cadet:
        cadet = User(
            username="cadet_studio_test",
            email="cadet_studio@cyberanzen.io",
            hashed_password=hash_password("CadetPass123!"),
            role=UserRole.PARTICIPANT.value
        )
        db_session.add(cadet)
        db_session.commit()
        db_session.refresh(cadet)
    return create_access_token({"sub": cadet.username})


def test_competition_templates_crud(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. List templates
    res = client.get("/api/v1/admin/competition-templates", headers=headers)
    assert res.status_code == 200
    templates = res.json()
    assert len(templates) >= 5

    # 2. Create custom template
    payload = {
        "slug": "custom-forensic-sprint",
        "title": "Custom Forensic Sprint",
        "subtitle": "Time-pressured forensic challenge series",
        "description": "Deep memory and packet analysis tournament template.",
        "icon": "shield",
        "category": "CTF",
        "features": ["Pcap analysis", "Volatile memory memory dump"],
        "default_question_nav": "sequential",
        "default_scoring_policy": "standard"
    }
    res = client.post("/api/v1/admin/competition-templates", json=payload, headers=headers)
    assert res.status_code == 200
    tmpl_data = res.json()
    tmpl_id = tmpl_data["id"]
    assert tmpl_data["slug"] == "custom-forensic-sprint"

    # 3. Get single template
    res = client.get(f"/api/v1/admin/competition-templates/{tmpl_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Custom Forensic Sprint"

    # 4. Update template
    res = client.put(f"/api/v1/admin/competition-templates/{tmpl_id}", json={
        "title": "Custom Forensic Sprint v2"
    }, headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Custom Forensic Sprint v2"

    # 5. Delete template
    res = client.delete(f"/api/v1/admin/competition-templates/{tmpl_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "deleted"


def test_event_question_breakdown_and_experience_settings(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create an event
    ev_res = client.post("/api/v1/admin/events", json={
        "title": "DSA Algorithmic Cup 2026",
        "slug": "dsa-algorithmic-cup-2026",
        "description": "High performance algorithmic contest.",
        "event_type": "dsa",
        "question_navigation_policy": "sequential",
        "question_order_mode": "random_participant"
    }, headers=headers)
    assert ev_res.status_code == 200
    event_id = ev_res.json()["id"]

    # 2. Create 2 published DSA questions
    q1_res = client.post("/api/v1/admin/dsa", json={
        "title": "Reverse Array Challenge",
        "statement": "Given an array of integers, output the elements in reverse order.",
        "input_spec": "An array of numbers.",
        "output_spec": "Reversed array.",
        "points": 50,
        "difficulty": "Easy",
        "starter_py": "import sys\n# reverse solution\n",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    }, headers=headers)
    assert q1_res.status_code == 200
    q1_id = q1_res.json()["id"]

    # Add sample test case to q1
    client.post(f"/api/v1/admin/dsa/{q1_id}/testcases", json={
        "input_data": "1 2 3",
        "expected_output": "3 2 1",
        "test_type": "public_sample"
    }, headers=headers)

    # Publish q1
    client.put(f"/api/v1/admin/dsa/{q1_id}", json={"status": "published"}, headers=headers)

    q2_res = client.post("/api/v1/admin/dsa", json={
        "title": "Fibonacci Dynamic Memoization",
        "statement": "Compute the Nth Fibonacci number mod 10^9+7.",
        "input_spec": "Integer N",
        "output_spec": "F(N)",
        "points": 100,
        "difficulty": "Medium",
        "starter_py": "import sys\n# fibonacci solution\n",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    }, headers=headers)
    assert q2_res.status_code == 200
    q2_id = q2_res.json()["id"]
    client.put(f"/api/v1/admin/dsa/{q2_id}", json={"status": "published"}, headers=headers)

    # 3. Attach both questions to event
    client.post(f"/api/v1/admin/events/{event_id}/questions", json={"question_id": q1_id, "order_index": 0}, headers=headers)
    client.post(f"/api/v1/admin/events/{event_id}/questions", json={"question_id": q2_id, "order_index": 1}, headers=headers)

    # 4. Check Question Breakdown
    bd_res = client.get(f"/api/v1/admin/events/{event_id}/question-breakdown", headers=headers)
    assert bd_res.status_code == 200
    bd = bd_res.json()
    assert bd["total_questions"] == 2
    assert bd["breakdown"]["dsa"] == 2
    assert len(bd["items"]) == 2

    # 5. Reorder questions
    reorder_res = client.post(f"/api/v1/admin/events/{event_id}/questions/reorder", json={
        "domain": "dsa",
        "question_id": q2_id,
        "direction": "up"
    }, headers=headers)
    assert reorder_res.status_code == 200
    assert reorder_res.json()["status"] == "reordered"

    # 6. Update Question Experience Policy
    exp_res = client.put(f"/api/v1/admin/events/{event_id}/question-experience", json={
        "question_navigation_policy": "free",
        "question_order_mode": "fixed",
        "show_progress": True
    }, headers=headers)
    assert exp_res.status_code == 200
    assert exp_res.json()["question_navigation_policy"] == "free"


def test_dsa_event_workspace_sequential_lock_and_run_sample(admin_token, cadet_token):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    user_headers = {"Authorization": f"Bearer {cadet_token}"}

    # 1. Create a sequential event
    ev_res = client.post("/api/v1/admin/events", json={
        "title": "Strict Sequential Invitational",
        "slug": "strict-sequential-invitational",
        "description": "Must solve questions in sequential order.",
        "event_type": "dsa",
        "question_navigation_policy": "sequential",
        "question_order_mode": "fixed"
    }, headers=admin_headers)
    event_id = ev_res.json()["id"]

    # 2. Create Problem 1 & Problem 2
    p1 = client.post("/api/v1/admin/dsa", json={
        "title": "Problem Alpha",
        "statement": "Read two integers A and B, print their sum.",
        "input_spec": "Two space-separated integers A and B.",
        "output_spec": "Sum A + B",
        "points": 50,
        "difficulty": "Easy",
        "starter_py": "import sys\nline = sys.stdin.read().split()\nif line:\n    print(int(line[0]) + int(line[1]))\n",
        "status": "published"
    }, headers=admin_headers).json()

    # Add sample and hidden test case to p1
    client.post(f"/api/v1/admin/dsa/{p1['id']}/testcases", json={
        "input_data": "3 5",
        "expected_output": "8",
        "test_type": "public_sample"
    }, headers=admin_headers)
    client.post(f"/api/v1/admin/dsa/{p1['id']}/testcases", json={
        "input_data": "10 20",
        "expected_output": "30",
        "test_type": "hidden"
    }, headers=admin_headers)

    p2 = client.post("/api/v1/admin/dsa", json={
        "title": "Problem Beta",
        "statement": "Read integer N, print N squared.",
        "input_spec": "Integer N",
        "output_spec": "N^2",
        "points": 100,
        "difficulty": "Medium",
        "starter_py": "import sys\nprint(int(sys.stdin.read().strip()) ** 2)\n",
        "status": "published"
    }, headers=admin_headers).json()

    client.post(f"/api/v1/admin/dsa/{p2['id']}/testcases", json={
        "input_data": "4",
        "expected_output": "16",
        "test_type": "public_sample"
    }, headers=admin_headers)
    client.post(f"/api/v1/admin/dsa/{p2['id']}/testcases", json={
        "input_data": "7",
        "expected_output": "49",
        "test_type": "hidden"
    }, headers=admin_headers)

    # Attach to event in order: p1 then p2
    client.post(f"/api/v1/admin/events/{event_id}/questions", json={"question_id": p1["id"], "order_index": 0}, headers=admin_headers)
    client.post(f"/api/v1/admin/events/{event_id}/questions", json={"question_id": p2["id"], "order_index": 1}, headers=admin_headers)

    # 3. Contestant registers for event
    client.post(f"/api/v1/events/{event_id}/register?mode=individual", headers=user_headers)

    # 4. Fetch questions as contestant
    q_res = client.get(f"/api/v1/events/{event_id}/questions", headers=user_headers)
    assert q_res.status_code == 200
    q_list = q_res.json()
    assert len(q_list) == 2

    # Problem Alpha should be unlocked ("current")
    assert q_list[0]["id"] == p1["id"]
    assert q_list[0]["status"] == "current"
    assert q_list[0]["is_locked"] is False

    # Problem Beta MUST BE LOCKED because Alpha is not solved yet
    assert q_list[1]["id"] == p2["id"]
    assert q_list[1]["status"] == "locked"
    assert q_list[1]["is_locked"] is True
    assert "Solve Q1" in q_list[1]["lock_reason"]

    # 5. Run sample test on Problem Alpha (using existing run-sample API)
    run_res = client.post(f"/api/v1/questions/{p1['id']}/run-sample", json={
        "language": "python3",
        "source_code": "import sys\nline = sys.stdin.read().split()\nif line:\n    print(int(line[0]) + int(line[1]))\n"
    }, headers=user_headers)
    assert run_res.status_code == 200
    assert run_res.json()["verdict"] == "ACCEPTED"

    # Cooldown
    time.sleep(0.3)

    # 6. Attempt to submit to Problem Beta while locked -> MUST BE BLOCKED BY SERVER
    blocked_sub = client.post(f"/api/v1/questions/{p2['id']}/submit", json={
        "language": "python3",
        "source_code": "import sys\nprint(int(sys.stdin.read().strip()) ** 2)\n",
        "event_id": event_id
    }, headers=user_headers)
    assert blocked_sub.status_code in (400, 403)
    assert "Sequential progression lockdown" in blocked_sub.json()["detail"]

    # Cooldown
    time.sleep(0.3)

    # 7. Submit valid code to Problem Alpha -> Unlocks Alpha
    alpha_sub = client.post(f"/api/v1/questions/{p1['id']}/submit", json={
        "language": "python3",
        "source_code": "import sys\nline = sys.stdin.read().split()\nif line:\n    print(int(line[0]) + int(line[1]))\n",
        "event_id": event_id
    }, headers=user_headers)
    assert alpha_sub.status_code == 200
    assert alpha_sub.json()["verdict"] == "ACCEPTED"

    # 8. Fetch questions again -> Problem Beta is now unlocked!
    refreshed_q = client.get(f"/api/v1/events/{event_id}/questions", headers=user_headers).json()
    assert refreshed_q[0]["status"] == "solved"
    assert refreshed_q[1]["is_locked"] is False
    assert refreshed_q[1]["status"] == "available"

    # Cooldown
    time.sleep(0.3)

    # 9. Now submitting to Problem Beta succeeds!
    beta_sub = client.post(f"/api/v1/questions/{p2['id']}/submit", json={
        "language": "python3",
        "source_code": "import sys\nprint(int(sys.stdin.read().strip()) ** 2)\n",
        "event_id": event_id
    }, headers=user_headers)
    assert beta_sub.status_code == 200
    assert beta_sub.json()["verdict"] == "ACCEPTED"
