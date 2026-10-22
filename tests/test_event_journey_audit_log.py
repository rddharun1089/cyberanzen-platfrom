import pytest
from starlette.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, Event, DSAQuestion, DSATestCase, EventDSAQuestion, EventActivityLog
from app.core.security import create_access_token
import json
from datetime import datetime, timezone, timedelta

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_event_journey_audit_trail_lifecycle(db_session):
    # 1. Setup Admin and Operative
    admin = db_session.query(User).filter(User.username == "admin_audit_test").first()
    if not admin:
        admin = User(username="admin_audit_test", email="admin_audit@cyberanzen.io", hashed_password="x", role="admin")
        db_session.add(admin)
        db_session.commit()

    candidate = db_session.query(User).filter(User.username == "operative_audit_test").first()
    if not candidate:
        candidate = User(username="operative_audit_test", email="cand_audit@cyberanzen.io", hashed_password="x", role="user")
        db_session.add(candidate)
        db_session.commit()

    admin_token = create_access_token({"sub": admin.username, "role": admin.role})
    cand_token = create_access_token({"sub": candidate.username, "role": candidate.role})

    # 2. Create Test Event
    event = db_session.query(Event).filter(Event.slug == "journey-test-event").first()
    if not event:
        now = datetime.now(timezone.utc)
        event = Event(
            slug="journey-test-event",
            title="Journey Audit Test Tournament",
            event_type="dsa",
            description="Testing user journey tracking from entering to completion.",
            status="active",
            visibility="public",
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(days=2),
            registration_open=True,
            show_progress=True
        )
        db_session.add(event)
        db_session.commit()

    headers_cand = {"Authorization": f"Bearer {cand_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    # 3. Log Event Entrance
    res_enter = client.post(
        f"/api/v1/events/{event.id}/activity",
        headers=headers_cand,
        json={
            "action": "EVENT_ENTERED",
            "entity_type": "event",
            "entity_title": event.title,
            "details": "Operative entered tournament arena workspace."
        }
    )
    assert res_enter.status_code == 200
    assert res_enter.json()["status"] == "LOGGED"

    # 4. Log Problem Viewing
    res_view = client.post(
        f"/api/v1/events/{event.id}/activity",
        headers=headers_cand,
        json={
            "action": "PROBLEM_VIEWED",
            "entity_type": "dsa_question",
            "entity_id": "101",
            "entity_title": "Network Flow Target",
            "details": "Operative inspected problem specifications."
        }
    )
    assert res_view.status_code == 200

    # 5. Log Sample Run
    res_sample = client.post(
        f"/api/v1/events/{event.id}/activity",
        headers=headers_cand,
        json={
            "action": "RUN_SAMPLE",
            "entity_type": "dsa_question",
            "entity_id": "101",
            "entity_title": "Network Flow Target",
            "status": "ACCEPTED",
            "details": "Tested Python 3 solution against 2 public samples in 18ms."
        }
    )
    assert res_sample.status_code == 200

    # 6. Candidate inspects own activity trail
    res_my_act = client.get(f"/api/v1/events/{event.id}/my-activity", headers=headers_cand)
    assert res_my_act.status_code == 200
    my_logs = res_my_act.json()
    assert len(my_logs) >= 3
    actions = [l["action"] for l in my_logs]
    assert "EVENT_ENTERED" in actions
    assert "PROBLEM_VIEWED" in actions
    assert "RUN_SAMPLE" in actions

    # 7. Non-admin attempting to view participant audit trail is denied (403)
    res_forbidden = client.get(f"/api/v1/events/{event.id}/participant-activity", headers=headers_cand)
    assert res_forbidden.status_code == 403

    # 8. Admin successfully inspects participant audit trail
    res_admin_act = client.get(f"/api/v1/events/{event.id}/participant-activity?user_id={candidate.id}", headers=headers_admin)
    assert res_admin_act.status_code == 200
    admin_logs = res_admin_act.json()
    assert len(admin_logs) >= 3
    assert admin_logs[0]["username"] == "operative_audit_test"

    # 9. Candidate finalizes & completes event session
    res_comp = client.post(f"/api/v1/events/{event.id}/complete", headers=headers_cand)
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == "COMPLETED"

    # 10. Verify EVENT_COMPLETED is in the candidate's trail
    res_after_comp = client.get(f"/api/v1/events/{event.id}/my-activity", headers=headers_cand)
    actions_after = [l["action"] for l in res_after_comp.json()]
    assert "EVENT_COMPLETED" in actions_after
