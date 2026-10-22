import pytest
import io
import json
from starlette.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, UserRole, Event, DSAQuestion, CTFChallenge, MCQQuestion, AuditLog
from app.core.security import hash_password, create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    # Ensure super admin exists
    admin_user = session.query(User).filter(User.username == "arena_super_admin").first()
    if not admin_user:
        admin_user = User(
            username="arena_super_admin",
            email="superadmin@cyberanzen.io",
            hashed_password=hash_password("SuperAdmin#Pass2026!"),
            role=UserRole.SUPER_ADMIN.value,
            points=0,
            is_active=True
        )
        session.add(admin_user)
        session.commit()
    yield session
    session.close()

def get_auth_headers(username: str = "arena_super_admin", role: str = UserRole.SUPER_ADMIN.value) -> dict:
    token = create_access_token({"sub": username, "role": role})
    return {"Authorization": f"Bearer {token}"}

def test_combined_event_workspace_and_tabs(db: Session):
    headers = get_auth_headers()

    # 1. Create a combined event (CTF + DSA)
    payload = {
        "title": "Combined Cyber Triathlon 2026",
        "description": "Multi-discipline hacking and algorithms",
        "event_type": "ctf_dsa",
        "participation_mode": "team",
        "team_size_max": 4,
        "status": "live",
        "visibility": "public"
    }
    create_res = client.post("/api/v1/admin/events", json=payload, headers=headers)
    assert create_res.status_code == 200
    event_data = create_res.json()
    event_id = event_data["id"]

    # 2. Query workspace-config
    cfg_res = client.get(f"/api/v1/events/{event_id}/workspace-config", headers=headers)
    assert cfg_res.status_code == 200
    cfg = cfg_res.json()
    assert cfg["has_dsa"] is True
    assert cfg["has_ctf"] is True
    tab_ids = [t["id"] for t in cfg["tabs"]]
    assert "challenges" in tab_ids
    assert "problems" in tab_ids
    assert "submissions" in tab_ids
    assert "squad" in tab_ids

def test_event_banner_upload_and_removal(db: Session):
    headers = get_auth_headers()

    # Create event
    create_res = client.post("/api/v1/admin/events", json={
        "title": "Banner Testing Event",
        "description": "Validating custom banner lifecycle",
        "event_type": "ctf",
        "status": "draft"
    }, headers=headers)
    assert create_res.status_code == 200
    event_id = create_res.json()["id"]

    # Upload mock PNG banner
    dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    files = {"file": ("banner.png", io.BytesIO(dummy_png), "image/png")}
    upload_res = client.post(f"/api/v1/admin/events/{event_id}/banner", files=files, headers=headers)
    assert upload_res.status_code == 200
    banner_url = upload_res.json()["banner_url"]
    assert banner_url.startswith("/uploads/banners/")

    # Verify event detail has banner
    detail_res = client.get(f"/api/v1/events/{event_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["banner_url"] == banner_url

    # Remove banner
    del_res = client.delete(f"/api/v1/admin/events/{event_id}/banner", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["banner_url"] is None

    # Check detail is cleared
    detail_res2 = client.get(f"/api/v1/events/{event_id}", headers=headers)
    assert detail_res2.json()["banner_url"] is None

def test_question_deletions_and_puzzles(db: Session):
    headers = get_auth_headers()

    # 1. Create a puzzle CTF challenge
    ctf_res = client.post("/api/v1/admin/ctf", json={
        "title": "The Cipher Riddle",
        "description": "Decode the visual stegano puzzle",
        "category": "puzzle",
        "difficulty": "Intermediate",
        "points": 150,
        "static_flag": "FLAG{PUZZLE_SOLVED}"
    }, headers=headers)
    assert ctf_res.status_code == 200
    ctf_id = ctf_res.json()["id"]

    # Delete CTF challenge
    del_ctf_res = client.delete(f"/api/v1/admin/ctf/{ctf_id}", headers=headers)
    assert del_ctf_res.status_code == 200
    assert del_ctf_res.json()["success"] is True

    # 2. Create DSA question with puzzle category
    dsa_res = client.post("/api/v1/admin/dsa", json={
        "title": "Knight Tour Logic Puzzle",
        "statement": "Find a valid knight traversal",
        "input_spec": "Single integer N",
        "output_spec": "Traversal matrix",
        "category": "Logic & Mathematical Puzzles",
        "difficulty": "Advanced",
        "points": 200
    }, headers=headers)
    assert dsa_res.status_code == 200
    dsa_id = dsa_res.json()["id"]

    # Delete DSA question
    del_dsa_res = client.delete(f"/api/v1/admin/dsa/{dsa_id}", headers=headers)
    assert del_dsa_res.status_code == 200
    assert del_dsa_res.json()["success"] is True

    # 3. Create MCQ question
    mcq_res = client.post("/api/v1/admin/mcqs", json={
        "title": "Cryptanalysis Logic Assessment",
        "prompt": "What is the key space for AES-128?",
        "category": "Cryptanalysis & Logic Puzzles",
        "options": [
            {"id": 1, "text": "2^128", "is_correct": True},
            {"id": 2, "text": "2^64", "is_correct": False}
        ]
    }, headers=headers)
    assert mcq_res.status_code == 200
    mcq_id = mcq_res.json()["id"]

    # Delete MCQ question
    del_mcq_res = client.delete(f"/api/v1/admin/mcqs/{mcq_id}", headers=headers)
    assert del_mcq_res.status_code == 200
    assert del_mcq_res.json()["success"] is True
