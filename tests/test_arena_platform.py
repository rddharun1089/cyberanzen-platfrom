import pytest
from starlette.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.session import SessionLocal
from app.db.models import (
    User, UserRole, DSAQuestion, DSATestCase, MCQQuestion, MCQAttempt,
    CTFChallenge, DynamicFlag, DockerLabInstance, Team, TeamMembership,
    Event, EventRegistration, ParticipationMode, Solve, AuditLog
)
from app.core.security import hash_password, create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()

def get_auth_headers(username: str, role: str) -> dict:
    token = create_access_token({"sub": username, "role": role})
    return {"Authorization": f"Bearer {token}"}

# ==============================================================================
# 1. EMPTY QUESTION BANK ON FIRST RUN & HEALTH CHECK
# ==============================================================================
def test_platform_health_and_empty_banks(db: Session):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"
    assert res.json()["mode"] == "PRODUCTION_ARENA"

    # Verify Challenge Banks start 100% clean and empty
    dsa_res = client.get("/api/v1/questions")
    assert dsa_res.status_code == 200
    assert isinstance(dsa_res.json(), list)

    mcq_res = client.get("/api/v1/mcqs")
    assert mcq_res.status_code == 200
    assert isinstance(mcq_res.json(), list)

    ctf_res = client.get("/api/v1/challenges")
    assert ctf_res.status_code == 200
    assert isinstance(ctf_res.json(), list)

# ==============================================================================
# 2. AUTHENTICATION, REGISTRATION & RBAC CLEARANCE
# ==============================================================================
def test_auth_registration_and_rbac(db: Session):
    # Setup Super Admin
    admin_user = db.query(User).filter(User.username == "arena_super_admin").first()
    if not admin_user:
        admin_user = User(
            username="arena_super_admin",
            email="superadmin@cyberanzen.io",
            hashed_password=hash_password("SuperAdmin#Pass2026!"),
            role=UserRole.SUPER_ADMIN.value,
            points=0,
            is_active=True
        )
        db.add(admin_user)
        db.commit()

    # Clean any prior cadet_test_01
    db.query(User).filter(User.username == "cadet_test_01").delete()
    db.commit()

    # Participant registration
    reg_payload = {
        "username": "cadet_test_01",
        "email": "cadet01@cyberanzen.io",
        "password": "CadetPassword2026!"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    assert "access_token" in reg_res.json()

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "username": "cadet_test_01",
        "password": "CadetPassword2026!"
    })
    assert login_res.status_code == 200
    assert login_res.json()["role"] == UserRole.PARTICIPANT.value

    # Verify RBAC: Participant cannot access admin endpoints
    cadet_headers = get_auth_headers("cadet_test_01", UserRole.PARTICIPANT.value)
    unauth_res = client.get("/api/v1/admin/dsa", headers=cadet_headers)
    assert unauth_res.status_code == 403

    # Admin CAN access admin endpoints
    admin_headers = get_auth_headers("arena_super_admin", UserRole.SUPER_ADMIN.value)
    auth_res = client.get("/api/v1/admin/dsa", headers=admin_headers)
    assert auth_res.status_code == 200

# ==============================================================================
# 3. DSA QUESTION STUDIO, TESTCASE MANAGER & REFERENCE VALIDATION
# ==============================================================================
def test_dsa_question_studio_and_reference_validation(db: Session):
    admin_headers = get_auth_headers("arena_super_admin", UserRole.SUPER_ADMIN.value)

    # 1. Author DSA Question
    create_payload = {
        "title": "Network Log Beacon Detector",
        "statement": "Given N timestamps and source IP packets, detect the beaconing interval.",
        "input_spec": "First line N, followed by N integers representing packet timestamps.",
        "output_spec": "Print the common delta between packets.",
        "constraints": "N <= 1000",
        "difficulty": "Beginner",
        "category": "Network Forensics",
        "points": 100,
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "starter_py": "n = int(input())\nprint(10)\n",
        "reference_solution": "n = int(input())\na = [int(x) for x in input().split()]\nprint(a[1] - a[0])\n",
        "allow_copy_paste": False
    }
    res = client.post("/api/v1/admin/dsa", json=create_payload, headers=admin_headers)
    assert res.status_code == 200
    q_id = res.json()["id"]

    # 2. Add Public Sample Test Case
    client.post(f"/api/v1/admin/dsa/{q_id}/test-cases", json={
        "test_type": "public_sample",
        "input_data": "3\n10 20 30\n",
        "expected_output": "10\n",
        "points": 0
    }, headers=admin_headers)

    # 3. Add Private Hidden Test Case
    client.post(f"/api/v1/admin/dsa/{q_id}/test-cases", json={
        "test_type": "hidden_test",
        "input_data": "4\n100 150 200 250\n",
        "expected_output": "50\n",
        "points": 100
    }, headers=admin_headers)

    # 4. Validate Reference Solution in Sandbox
    val_res = client.post(f"/api/v1/admin/dsa/{q_id}/validate-reference", headers=admin_headers)
    assert val_res.status_code == 200
    assert val_res.json()["valid"] is True
    assert val_res.json()["verdict"] == "ACCEPTED"

    # 5. Verify Hidden Test Privacy: Participant detail must NOT expose hidden test or reference code!
    cadet_headers = get_auth_headers("cadet_test_01", UserRole.PARTICIPANT.value)
    detail_res = client.get(f"/api/v1/questions/{q_id}", headers=cadet_headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert "reference_solution" not in detail_data
    assert len(detail_data["sample_tests"]) == 1  # Only public sample!
    assert detail_data["sample_tests"][0]["input"] == "3\n10 20 30\n"

# ==============================================================================
# 4. MCQ QUIZ ENGINE & ATTEMPT SCORING
# ==============================================================================
def test_mcq_authoring_and_attempt(db: Session):
    admin_headers = get_auth_headers("arena_super_admin", UserRole.SUPER_ADMIN.value)

    mcq_payload = {
        "title": "Linux Privilege Boundaries",
        "prompt": "Which file specifies the mapping between users and permitted sudo capabilities?",
        "question_type": "single_choice",
        "difficulty": "Beginner",
        "category": "Linux Security",
        "points_positive": 20,
        "points_negative": 5,
        "time_limit_sec": 45,
        "explanation": "/etc/sudoers defines administrative rights and sudo parameters.",
        "options": [
            {"id": 1, "text": "/etc/shadow", "is_correct": False, "explanation": ""},
            {"id": 2, "text": "/etc/sudoers", "is_correct": True, "explanation": ""},
            {"id": 3, "text": "/etc/passwd", "is_correct": False, "explanation": ""}
        ]
    }
    res = client.post("/api/v1/admin/mcqs", json=mcq_payload, headers=admin_headers)
    assert res.status_code == 200
    mcq_id = res.json()["id"]

    # Verify participant view strips correct answer flag
    cadet_headers = get_auth_headers("cadet_test_01", UserRole.PARTICIPANT.value)
    cadet_view = client.get(f"/api/v1/mcqs/{mcq_id}", headers=cadet_headers)
    assert cadet_view.status_code == 200
    for opt in cadet_view.json()["options"]:
        assert "is_correct" not in opt

    # Submit correct option
    submit_res = client.post(f"/api/v1/mcqs/{mcq_id}/submit", json={
        "selected_option_ids": [2],
        "time_taken_sec": 12
    }, headers=cadet_headers)
    assert submit_res.status_code == 200
    assert submit_res.json()["is_correct"] is True
    assert submit_res.json()["score_awarded"] == 20

# ==============================================================================
# 5. CTF CHALLENGE STUDIO, STATIC & DYNAMIC FLAG VALIDATION
# ==============================================================================
def test_ctf_challenge_authoring_and_flag_submission(db: Session):
    admin_headers = get_auth_headers("arena_super_admin", UserRole.SUPER_ADMIN.value)

    # 1. Author CTF Challenge
    ctf_payload = {
        "title": "Subverting Insecure Deserialization",
        "description": "Analyze the cookie payload to bypass role checks.",
        "category": "web",
        "difficulty": "Intermediate",
        "points": 150,
        "flag_type": "static",
        "static_flag": "FLAG{ARENA_COOKIE_DESERIALIZED_SUCCESS}",
        "has_docker_lab": True,
        "docker_image": "alpine:latest",
        "lab_timeout_min": 30,
        "lab_port_exposed": 80
    }
    res = client.post("/api/v1/admin/ctf", json=ctf_payload, headers=admin_headers)
    assert res.status_code == 200
    ctf_id = res.json()["id"]

    # 2. Verify Participant view hides static flag
    cadet_headers = get_auth_headers("cadet_test_01", UserRole.PARTICIPANT.value)
    part_view = client.get(f"/api/v1/challenges/{ctf_id}", headers=cadet_headers)
    assert part_view.status_code == 200
    assert "static_flag" not in part_view.json()

    # 3. Submit Incorrect Flag
    wrong_sub = client.post(f"/api/v1/challenges/{ctf_id}/submit-flag", json={
        "flag": "FLAG{WRONG_GUESS}"
    }, headers=cadet_headers)
    assert wrong_sub.status_code == 200
    assert wrong_sub.json()["is_correct"] is False

    # 4. Submit Authentic Flag
    correct_sub = client.post(f"/api/v1/challenges/{ctf_id}/submit-flag", json={
        "flag": "FLAG{ARENA_COOKIE_DESERIALIZED_SUCCESS}"
    }, headers=cadet_headers)
    assert correct_sub.status_code == 200
    assert correct_sub.json()["is_correct"] is True
    assert correct_sub.json()["points_awarded"] == 150

# ==============================================================================
# 6. DOCKER LAB LIFECYCLE MANAGEMENT
# ==============================================================================
def test_docker_lab_lifecycle(db: Session):
    cadet_headers = get_auth_headers("cadet_test_01", UserRole.PARTICIPANT.value)

    # Launch Lab for CTF challenge
    ctf = db.query(CTFChallenge).filter(CTFChallenge.has_docker_lab == True).first()
    assert ctf is not None

    launch_res = client.post(f"/api/v1/labs/challenges/{ctf.id}/launch", headers=cadet_headers)
    assert launch_res.status_code == 200
    inst_data = launch_res.json()
    assert inst_data["success"] is True
    assert inst_data["access_port"] >= 20000
    inst_id = inst_data["instance_id"]

    # Inspect status
    stat_res = client.get(f"/api/v1/labs/instances/{inst_id}/status", headers=cadet_headers)
    assert stat_res.status_code == 200
    assert stat_res.json()["instance_id"] == inst_id

    # Stop Lab
    stop_res = client.post(f"/api/v1/labs/instances/{inst_id}/stop", headers=cadet_headers)
    assert stop_res.status_code == 200
    assert stop_res.json()["success"] is True

# ==============================================================================
# 7. SQUAD COLLABORATION & DEDUPLICATED ATOMIC SCORING
# ==============================================================================
def test_squad_lifecycle_and_non_duplicate_scoring(db: Session):
    # Clean any prior squad cadets and team
    db.query(TeamMembership).delete()
    db.query(Team).filter(Team.name == "Shadow Phantoms").delete()
    db.query(User).filter(User.username.in_(["squad_cadet_2", "squad_cadet_3"])).delete()
    db.commit()

    # Register 2 squad members
    for i in [2, 3]:
        client.post("/api/v1/auth/register", json={
            "username": f"squad_cadet_{i}",
            "email": f"squad{i}@cyberanzen.io",
            "password": "SquadPassword2026!"
        })

    owner_headers = get_auth_headers("squad_cadet_2", UserRole.PARTICIPANT.value)
    member_headers = get_auth_headers("squad_cadet_3", UserRole.PARTICIPANT.value)

    # 1. Create Squad
    create_res = client.post("/api/v1/teams", json={"name": "Shadow Phantoms", "max_members": 4}, headers=owner_headers)
    assert create_res.status_code == 200
    invite_code = create_res.json()["invitation_code"]

    # 2. Member joins via invite code
    join_res = client.post("/api/v1/teams/join", json={"invitation_code": invite_code}, headers=member_headers)
    assert join_res.status_code == 200

    # 3. Attempt double enrollment (should be rejected)
    dup_join = client.post("/api/v1/teams/join", json={"invitation_code": invite_code}, headers=member_headers)
    assert dup_join.status_code == 400

    # 4. Solves and atomic points deduplication
    ctf = db.query(CTFChallenge).first()
    assert ctf is not None

    # First member solves challenge
    sub1 = client.post(f"/api/v1/challenges/{ctf.id}/submit-flag", json={"flag": ctf.static_flag}, headers=owner_headers)
    assert sub1.status_code == 200
    assert sub1.json()["points_awarded"] == ctf.points

    # Second teammate submits same flag: points awarded must be 0 (no duplicate team score)
    sub2 = client.post(f"/api/v1/challenges/{ctf.id}/submit-flag", json={"flag": ctf.static_flag}, headers=member_headers)
    assert sub2.status_code == 200
    assert sub2.json()["solve_summary"]["team_points_awarded"] == 0

# ==============================================================================
# 8. SAFE USER DELETION WITH SUPER ADMIN PROTECTION
# ==============================================================================
def test_user_deletion_safeguards(db: Session):
    super_admin_headers = get_auth_headers("arena_super_admin", UserRole.SUPER_ADMIN.value)

    target_user = db.query(User).filter(User.username == "cadet_test_01").first()
    assert target_user is not None

    # Mismatch confirmation must fail
    fail_res = client.delete(
        f"/api/v1/admin/users/{target_user.id}",
        params={"confirm_username": "wrong_username"},
        headers=super_admin_headers
    )
    assert fail_res.status_code == 400

    # Accurate confirmation succeeds
    ok_res = client.delete(
        f"/api/v1/admin/users/{target_user.id}",
        params={"confirm_username": "cadet_test_01"},
        headers=super_admin_headers
    )
    assert ok_res.status_code == 200
    assert ok_res.json()["success"] is True

    # Super admin self-deletion must be prohibited
    super_admin = db.query(User).filter(User.username == "arena_super_admin").first()
    self_res = client.delete(
        f"/api/v1/admin/users/{super_admin.id}",
        params={"confirm_username": "arena_super_admin"},
        headers=super_admin_headers
    )
    assert self_res.status_code == 400
