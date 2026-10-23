import pytest
from starlette.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, Event, DSAQuestion, EventDSAQuestion
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()

def get_admin_headers():
    token = create_access_token({"sub": "admin", "role": "super_admin"})
    return {"Authorization": f"Bearer {token}"}

def test_dsa_controls_matrix_and_event_policies(db: Session):
    headers = get_admin_headers()

    # 1. Fetch DSA controls matrix
    res = client.get("/api/v1/admin/dsa-controls-matrix", headers=headers)
    assert res.status_code == 200
    matrix = res.json()
    assert isinstance(matrix, list)
    assert len(matrix) >= 1

    demo_event = next((ev for ev in matrix if ev["title"] == "demo 1" or ev["event_id"] == 9), matrix[0])
    ev_id = demo_event["event_id"]
    assert "clipboard_policy" in demo_event
    assert "allow_copy_paste" in demo_event
    assert "enable_mentor" in demo_event
    assert "questions" in demo_event
    assert len(demo_event["questions"]) >= 1

    # 2. Toggle event-level copy-paste to allowed
    res = client.patch(
        f"/api/v1/admin/events/{ev_id}/dsa-controls",
        json={"allow_copy_paste": True, "enable_mentor": True},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["allow_copy_paste"] is True
    assert data["clipboard_policy"] == "allowed"
    assert data["enable_mentor"] is True

    # 3. Toggle event-level copy-paste to restricted and bulk propagate to questions
    res = client.patch(
        f"/api/v1/admin/events/{ev_id}/dsa-controls",
        json={"allow_copy_paste": False, "enable_mentor": True, "apply_to_questions": True},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["allow_copy_paste"] is False
    assert data["clipboard_policy"] == "restricted"
    assert data["affected_questions"] >= 1

def test_question_wise_dsa_controls(db: Session):
    headers = get_admin_headers()

    # Pick first question in demo 1
    q = db.query(DSAQuestion).first()
    assert q is not None
    q_id = q.id

    # 1. Update question copy-paste ON and mentor ON
    res = client.patch(
        f"/api/v1/admin/dsa/{q_id}/controls",
        json={"allow_copy_paste": True, "enable_mentor": True},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["allow_copy_paste"] is True
    assert data["enable_mentor"] is True

    # 2. Update question copy-paste OFF and mentor OFF
    res = client.patch(
        f"/api/v1/admin/dsa/{q_id}/controls",
        json={"allow_copy_paste": False, "enable_mentor": False},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["allow_copy_paste"] is False
    assert data["enable_mentor"] is False

    # 3. Verify public question endpoint returns updated enable_mentor
    res = client.get(f"/api/v1/questions/{q_id}")
    assert res.status_code == 200
    q_detail = res.json()
    assert q_detail["allow_copy_paste"] is False
    assert q_detail["enable_mentor"] is False

    # 4. Verify mentor guidance is rejected with 403 when question mentor is disabled
    user_token = create_access_token({"sub": "admin", "role": "super_admin"})
    user_headers = {"Authorization": f"Bearer {user_token}"}
    res = client.post(
        f"/api/v1/questions/{q_id}/mentor-guidance",
        json={"verdict": "WRONG_ANSWER", "source_code": "def solve(): pass", "language": "python3"},
        headers=user_headers
    )
    assert res.status_code == 403
    assert "disabled" in res.json()["detail"].lower()

    # Re-enable mentor for question to restore good state
    client.patch(
        f"/api/v1/admin/dsa/{q_id}/controls",
        json={"allow_copy_paste": False, "enable_mentor": True},
        headers=headers
    )
