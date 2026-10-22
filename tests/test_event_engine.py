import pytest
from starlette.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app.main import app
from app.db.session import SessionLocal
from app.db.models import (
    User, UserRole, Event, EventStatus, EventType, ParticipationMode,
    DSAQuestion, DSATestCase, CTFChallenge, MCQQuestion, Team, TeamMembership,
    EventRegistration
)
from app.core.security import create_access_token, hash_password

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    cadet = session.query(User).filter(User.username == "cadet_forensic").first()
    if not cadet:
        cadet = User(
            username="cadet_forensic",
            email="cadet_forensic@cyberanzen.io",
            hashed_password=hash_password("Pass#12345!"),
            role=UserRole.PARTICIPANT.value,
            points=0
        )
        session.add(cadet)
        session.commit()
    yield session
    # Cleanup cadet created for this test module
    session.query(User).filter(User.username == "cadet_forensic").delete()
    session.commit()
    session.close()

def get_auth_headers(username: str, role: str) -> dict:
    token = create_access_token({"sub": username, "role": role})
    return {"Authorization": f"Bearer {token}"}

def test_admin_create_events_and_validation(db: Session):
    admin_headers = get_auth_headers("admin", UserRole.SUPER_ADMIN.value)
    part_headers = get_auth_headers("cadet_forensic", UserRole.PARTICIPANT.value)

    # 1. Non-admin cannot create events (403)
    unauth_res = client.post("/api/v1/admin/events", json={
        "title": "Unauthorized Cyber Cup",
        "description": "Exploit attempt",
        "event_type": "ctf"
    }, headers=part_headers)
    assert unauth_res.status_code == 403

    # 2. Invalid date range rejected (400)
    now = datetime.now(timezone.utc)
    bad_date_res = client.post("/api/v1/admin/events", json={
        "title": "Time Paradox Tournament",
        "description": "Invalid dates",
        "event_type": "dsa",
        "start_time": (now + timedelta(days=2)).isoformat(),
        "end_time": (now + timedelta(days=1)).isoformat()
    }, headers=admin_headers)
    assert bad_date_res.status_code == 400
    assert "start time must precede" in bad_date_res.json()["detail"].lower()

    # 3. Create Valid DSA Solo Event
    dsa_res = client.post("/api/v1/admin/events", json={
        "title": "National Algorithmic Championship",
        "slug": "algo-championship-2026",
        "event_type": "dsa",
        "short_description": "Premier national competitive programming battle.",
        "description": "Solve hard algorithmic and data structure problems.",
        "difficulty": "Advanced",
        "participation_mode": "individual",
        "team_size_max": 1,
        "capacity": 50,
        "status": "published",
        "start_time": (now + timedelta(hours=1)).isoformat(),
        "end_time": (now + timedelta(hours=5)).isoformat()
    }, headers=admin_headers)
    assert dsa_res.status_code == 200
    dsa_event_id = dsa_res.json()["event_id"]

    # 4. Create Valid CTF Team Event (Max team size: 3)
    ctf_res = client.post("/api/v1/admin/events", json={
        "title": "CyberAnzen Defense CTF",
        "slug": "defense-ctf-2026",
        "event_type": "ctf",
        "short_description": "Team defensive and offensive CTF.",
        "description": "Capture the flags across web, forensics, and binary targets.",
        "difficulty": "Expert",
        "participation_mode": "team",
        "team_size_min": 2,
        "team_size_max": 3,
        "team_allow_create": True,
        "team_allow_join_code": True,
        "status": "registration_open",
        "start_time": (now + timedelta(days=1)).isoformat(),
        "end_time": (now + timedelta(days=2)).isoformat()
    }, headers=admin_headers)
    assert ctf_res.status_code == 200
    ctf_event_id = ctf_res.json()["event_id"]

    # 5. Create Valid MCQ Quiz Event
    mcq_res = client.post("/api/v1/admin/events", json={
        "title": "Cyber Security Fundamentals Quiz",
        "slug": "sec-fundamentals-quiz",
        "event_type": "mcq",
        "short_description": "Timed multiple-choice assessment.",
        "description": "Assess networking, Linux, and cryptography knowledge.",
        "difficulty": "Beginner",
        "participation_mode": "individual",
        "status": "published"
    }, headers=admin_headers)
    assert mcq_res.status_code == 200

def test_event_question_assignment_and_filtering(db: Session):
    admin_headers = get_auth_headers("admin", UserRole.SUPER_ADMIN.value)

    # 1. Author a dedicated DSA Question
    q_res = client.post("/api/v1/admin/dsa", json={
        "title": "Packet Reassembly Optimizer",
        "statement": "Reassemble out-of-order network packets.",
        "input_spec": "N packets with seq and payload.",
        "output_spec": "Combined payload string.",
        "points": 150
    }, headers=admin_headers)
    q_id = q_res.json()["question_id"]

    # Add sample test case
    client.post(f"/api/v1/admin/dsa/{q_id}/test-cases", json={
        "test_type": "public_sample",
        "input_data": "3\n2 B\n1 A\n3 C",
        "expected_output": "ABC"
    }, headers=admin_headers)

    # 2. Get event
    event = db.query(Event).filter(Event.slug == "algo-championship-2026").first()
    assert event is not None

    # 3. Assign question to event with points override (200 pts)
    assign_res = client.post(f"/api/v1/admin/events/{event.id}/assign-questions", json={
        "question_ids": [q_id],
        "points_overrides": {str(q_id): 200}
    }, headers=admin_headers)
    assert assign_res.status_code == 200
    assert assign_res.json()["success"] is True

    # 4. Fetch event questions via event API
    ev_q_res = client.get(f"/api/v1/events/{event.id}/questions")
    assert ev_q_res.status_code == 200
    q_list = ev_q_res.json()
    assert len(q_list) == 1
    assert q_list[0]["id"] == q_id
    assert q_list[0]["points"] == 200  # Points override respected!

def test_dynamic_navigation_resolver(db: Session):
    # 1. Test DSA solo event navigation
    dsa_event = db.query(Event).filter(Event.slug == "algo-championship-2026").first()
    nav_res = client.get(f"/api/v1/events/{dsa_event.id}/workspace-config")
    assert nav_res.status_code == 200
    dsa_tabs = [t["id"] for t in nav_res.json()["tabs"]]
    assert "problems" in dsa_tabs
    assert "submissions" in dsa_tabs
    assert "progress" in dsa_tabs
    assert "squad" not in dsa_tabs  # Solo event must NOT show squad controls!
    assert "challenges" not in dsa_tabs

    # 2. Test CTF team event navigation
    ctf_event = db.query(Event).filter(Event.slug == "defense-ctf-2026").first()
    nav_ctf = client.get(f"/api/v1/events/{ctf_event.id}/workspace-config")
    assert nav_ctf.status_code == 200
    ctf_tabs = [t["id"] for t in nav_ctf.json()["tabs"]]
    assert "challenges" in ctf_tabs
    assert "labs" in ctf_tabs
    assert "squad" in ctf_tabs  # Team CTF must show squad controls!
    assert "problems" not in ctf_tabs

def test_team_size_enforcement(db: Session):
    ctf_event = db.query(Event).filter(Event.slug == "defense-ctf-2026").first()
    assert ctf_event.team_size_max == 3

    # Clean existing squad users and team
    db.query(Team).filter(Team.name == "Ghost Operatives CTF").delete()
    db.query(User).filter(User.username.in_(["ctf_lead", "ctf_m1", "ctf_m2", "ctf_m3"])).delete()
    db.commit()

    for u in ["ctf_lead", "ctf_m1", "ctf_m2", "ctf_m3"]:
        client.post("/api/v1/auth/register", json={
            "username": u,
            "email": f"{u}@cyberanzen.io",
            "password": "Password#2026!"
        })

    h_lead = get_auth_headers("ctf_lead", UserRole.PARTICIPANT.value)
    h_m1 = get_auth_headers("ctf_m1", UserRole.PARTICIPANT.value)
    h_m2 = get_auth_headers("ctf_m2", UserRole.PARTICIPANT.value)
    h_m3 = get_auth_headers("ctf_m3", UserRole.PARTICIPANT.value)

    # 1. Leader creates squad tied to event
    squad_res = client.post("/api/v1/teams", json={
        "name": "Ghost Operatives CTF",
        "event_id": ctf_event.id,
        "max_members": 4  # Request 4, but event cap is 3!
    }, headers=h_lead)
    assert squad_res.status_code in (200, 201)
    invite_code = squad_res.json()["invitation_code"]

    # 2. Member 1 joins (Member count = 2)
    j1 = client.post("/api/v1/teams/join", json={"invitation_code": invite_code}, headers=h_m1)
    assert j1.status_code == 200

    # 3. Member 2 joins (Member count = 3, reaching max 3)
    j2 = client.post("/api/v1/teams/join", json={"invitation_code": invite_code}, headers=h_m2)
    assert j2.status_code == 200

    # 4. Member 3 attempts to join -> MUST BE REJECTED (400 Overcapacity)
    j3 = client.post("/api/v1/teams/join", json={"invitation_code": invite_code}, headers=h_m3)
    assert j3.status_code == 400
    assert "maximum operative capacity" in j3.json()["detail"].lower()
