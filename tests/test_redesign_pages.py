import pytest
from starlette.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, UserRole, Event, DSAQuestion, Submission, EventDSAQuestion
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
    admin = db_session.query(User).filter(User.username == "admin_redesign_test").first()
    if not admin:
        admin = User(
            username="admin_redesign_test",
            email="admin_redesign@cyberanzen.io",
            hashed_password=hash_password("AdminPass123!"),
            role=UserRole.SUPER_ADMIN.value
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    return create_access_token({"sub": admin.username})

@pytest.fixture
def cadet_token(db_session):
    cadet = db_session.query(User).filter(User.username == "cadet_redesign_test").first()
    if not cadet:
        cadet = User(
            username="cadet_redesign_test",
            email="cadet_redesign@cyberanzen.io",
            hashed_password=hash_password("CadetPass123!"),
            role=UserRole.PARTICIPANT.value
        )
        db_session.add(cadet)
        db_session.commit()
        db_session.refresh(cadet)
    return create_access_token({"sub": cadet.username})

def test_public_site_content_api():
    """Verify GET /api/v1/content/public returns clean unauthenticated copy for Landing, About, Creator."""
    res = client.get("/api/v1/content/public")
    assert res.status_code == 200
    data = res.json()
    assert "hero" in data
    assert "about" in data
    assert "creator" in data
    assert data["hero"]["headline"] == "Think. Explore. Solve. Prove."
    assert "CyberAnzen" in data["hero"]["description"]
    assert "principles" in data["about"]
    assert len(data["about"]["principles"]) >= 4

def test_admin_site_content_governance(admin_token, cadet_token):
    """Verify normal participant cannot modify site content, but admin can update creator/hero."""
    cadet_headers = {"Authorization": f"Bearer {cadet_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Cadet attempt rejected
    unauth = client.put("/api/v1/content/admin/content", json={
        "creator": {"name": "Hacked Creator"}
    }, headers=cadet_headers)
    assert unauth.status_code == 403

    # Admin update succeeds
    update_res = client.put("/api/v1/content/admin/content", json={
        "creator": {
            "name": "CyberAnzen Lead Architect",
            "role": "Principal Systems Engineer",
            "bio": "Lead architect of CyberAnzen Arena.",
            "links": {"github": "https://github.com/rddharun1089/cyberanzen-platfrom"}
        }
    }, headers=admin_headers)
    assert update_res.status_code == 200
    assert update_res.json()["success"] is True

    # Verify public reflects update
    pub = client.get("/api/v1/content/public")
    assert pub.status_code == 200
    assert pub.json()["creator"]["name"] == "CyberAnzen Lead Architect"

def test_event_submissions_and_admin_rejudge(db_session, admin_token, cadet_token):
    """Verify user can view their event submissions and admin can trigger rejudge."""
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    cadet_headers = {"Authorization": f"Bearer {cadet_token}"}

    cadet = db_session.query(User).filter(User.username == "cadet_redesign_test").first()

    # Create dummy event and question
    event = db_session.query(Event).filter(Event.slug == "test-redesign-event").first()
    if not event:
        event = Event(
            title="Redesign Test Event",
            slug="test-redesign-event",
            description="Testing event submissions tab",
            event_type="dsa",
            status="live"
        )
        db_session.add(event)
        db_session.commit()
        db_session.refresh(event)

    q = db_session.query(DSAQuestion).filter(DSAQuestion.slug == "test-redesign-dsa").first()
    if not q:
        q = DSAQuestion(
            title="Sum Test",
            slug="test-redesign-dsa",
            statement="Print A + B",
            input_spec="Two integers",
            output_spec="Sum",
            category="Math",
            points=50,
            status="published"
        )
        db_session.add(q)
        db_session.commit()
        db_session.refresh(q)

    # Insert a dummy submission
    sub = Submission(
        user_id=cadet.id,
        target_id=str(q.id),
        event_id=event.id,
        language="python3",
        source_code="import sys\nprint(42)\n",
        verdict="ACCEPTED",
        score=50
    )
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)

    # 1. Cadet views their event submissions
    sub_res = client.get(f"/api/v1/events/{event.id}/submissions", headers=cadet_headers)
    assert sub_res.status_code == 200
    subs = sub_res.json()
    assert len(subs) >= 1
    assert subs[0]["question_title"] == "Sum Test"

    # 2. Admin views central submissions list
    admin_subs = client.get("/api/v1/admin/submissions", headers=admin_headers)
    assert admin_subs.status_code == 200
    assert admin_subs.json()["total"] >= 1

    # 3. Admin rejudges submission
    rejudge_res = client.post(f"/api/v1/admin/submissions/{sub.id}/rejudge", headers=admin_headers)
    assert rejudge_res.status_code == 200
    assert rejudge_res.json()["success"] is True

def test_admin_teams_and_settings_endpoints(admin_token):
    """Verify admin teams inspection and settings get/put."""
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Teams list
    teams_res = client.get("/api/v1/admin/teams", headers=admin_headers)
    assert teams_res.status_code == 200
    assert isinstance(teams_res.json(), list)

    # Settings get
    settings_res = client.get("/api/v1/admin/settings", headers=admin_headers)
    assert settings_res.status_code == 200

    # Settings put
    put_res = client.put("/api/v1/admin/settings/upload_policy", json={
        "max_size_mb": 50,
        "allowed_types": ["pdf", "docx", "zip", "json"]
    }, headers=admin_headers)
    assert put_res.status_code == 200
    assert put_res.json()["success"] is True
