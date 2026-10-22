import pytest
from starlette.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, UserRole, Event, DSAQuestion, EventDSAQuestion, Team, TeamMembership, EventRegistration
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
    admin = db_session.query(User).filter(User.username == "admin_event_attr_test").first()
    if not admin:
        admin = User(
            username="admin_event_attr_test",
            email="admin_attr@cyberanzen.io",
            hashed_password=hash_password("AdminPass123!"),
            role=UserRole.SUPER_ADMIN.value
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return create_access_token({"sub": admin.username})

def test_admin_question_attribution_and_event_filter(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Test DSA list with assigned_events
    res_dsa = client.get("/api/v1/admin/dsa", headers=headers)
    assert res_dsa.status_code == 200
    dsa_list = res_dsa.json()
    assert isinstance(dsa_list, list)
    if dsa_list:
        first_dsa = dsa_list[0]
        assert "assigned_events" in first_dsa
        assert "statement" in first_dsa
        assert "sample_tests" in first_dsa

    # 2. Test MCQ list with assigned_events
    res_mcq = client.get("/api/v1/admin/mcqs", headers=headers)
    assert res_mcq.status_code == 200
    mcq_list = res_mcq.json()
    assert isinstance(mcq_list, list)
    if mcq_list:
        assert "assigned_events" in mcq_list[0]

    # 3. Test CTF list with assigned_events
    res_ctf = client.get("/api/v1/admin/ctf", headers=headers)
    assert res_ctf.status_code == 200
    ctf_list = res_ctf.json()
    assert isinstance(ctf_list, list)
    if ctf_list:
        assert "assigned_events" in ctf_list[0]

def test_admin_registrations_and_team_endpoints(admin_token, db_session):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create dummy event, user, team, registration to test deletion
    ev = Event(title="Test Temp Event", slug="test-temp-event", description="Test Event Description", event_type="ctf_dsa")
    db_session.add(ev)
    db_session.commit()

    u = User(username="temp_cadet_del", email="temp_cadet_del@test.io", hashed_password="x")
    db_session.add(u)
    db_session.commit()

    team = Team(name="Temp Squad For Delete", invitation_code="DEL123456", owner_id=u.id, event_id=ev.id)
    db_session.add(team)
    db_session.commit()

    reg = EventRegistration(event_id=ev.id, user_id=u.id, team_id=team.id, selected_mode="team")
    db_session.add(reg)
    db_session.commit()

    # List registrations with event_id filter
    res_regs = client.get(f"/api/v1/admin/registrations?event_id={ev.id}", headers=headers)
    assert res_regs.status_code == 200
    regs = res_regs.json()
    assert len(regs) >= 1
    assert any(r["id"] == reg.id for r in regs)

    # Delete registration
    del_reg_res = client.delete(f"/api/v1/admin/registrations/{reg.id}", headers=headers)
    assert del_reg_res.status_code == 200
    assert del_reg_res.json()["success"] is True

    # List teams with event_id filter
    res_teams = client.get(f"/api/v1/admin/teams?event_id={ev.id}", headers=headers)
    assert res_teams.status_code == 200
    teams = res_teams.json()
    assert len(teams) >= 1

    # Delete team
    del_team_res = client.delete(f"/api/v1/admin/teams/{team.id}", headers=headers)
    assert del_team_res.status_code == 200
    assert del_team_res.json()["success"] is True

    # Cleanup
    db_session.delete(u)
    db_session.delete(ev)
    db_session.commit()

def test_admin_leaderboard_and_freeze_toggle(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch an existing event
    events_res = client.get("/api/v1/admin/events", headers=headers)
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) > 0
    event_id = events[0]["id"]

    # Get event leaderboard
    lb_res = client.get(f"/api/v1/admin/events/{event_id}/leaderboard", headers=headers)
    assert lb_res.status_code == 200
    lb_data = lb_res.json()
    assert "event_id" in lb_data
    assert "standings" in lb_data
    assert "is_frozen" in lb_data

    # Toggle freeze
    freeze_res = client.post(f"/api/v1/admin/events/{event_id}/freeze", headers=headers)
    assert freeze_res.status_code == 200
    assert "is_frozen" in freeze_res.json()
    
    # Toggle freeze back
    freeze_res2 = client.post(f"/api/v1/admin/events/{event_id}/freeze", headers=headers)
    assert freeze_res2.status_code == 200
