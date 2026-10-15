import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, AuditLog, Team, TeamMembership, TeamSolvedCase, Case
from app.core.security import hash_password

client = TestClient(app)

def test_user_deletion_security_and_cascade():
    db = SessionLocal()

    # 1. Ensure test users exist
    # Admin 1
    admin1 = db.query(User).filter(User.username == "admin_test_1").first()
    if not admin1:
        admin1 = User(
            username="admin_test_1",
            email="admin1@test.local",
            hashed_password=hash_password("Pass#12345!"),
            role="admin",
            is_active=True
        )
        db.add(admin1)

    # Admin 2 (backup admin so admin1 is not the sole admin)
    admin2 = db.query(User).filter(User.username == "admin_test_2").first()
    if not admin2:
        admin2 = User(
            username="admin_test_2",
            email="admin2@test.local",
            hashed_password=hash_password("Pass#12345!"),
            role="admin",
            is_active=True
        )
        db.add(admin2)

    # Victim user to delete
    victim = db.query(User).filter(User.username == "victim_cadet").first()
    if not victim:
        victim = User(
            username="victim_cadet",
            email="victim@test.local",
            hashed_password=hash_password("Pass#12345!"),
            role="participant",
            is_active=True
        )
        db.add(victim)

    # Teammate of victim
    teammate = db.query(User).filter(User.username == "teammate_cadet").first()
    if not teammate:
        teammate = User(
            username="teammate_cadet",
            email="teammate@test.local",
            hashed_password=hash_password("Pass#12345!"),
            role="participant",
            is_active=True
        )
        db.add(teammate)

    db.commit()
    db.refresh(admin1)
    db.refresh(admin2)
    db.refresh(victim)
    db.refresh(teammate)

    # Create a shared team where victim is OWNER and teammate is MEMBER
    old_team = db.query(Team).filter(Team.name == "Victim_Squad").first()
    if old_team:
        db.delete(old_team)
        db.commit()

    test_team = Team(
        name="Victim_Squad",
        invitation_code="victim_invite_123",
        owner_id=victim.id,
        points=100,
        max_members=4
    )
    db.add(test_team)
    db.flush()

    mem_victim = TeamMembership(team_id=test_team.id, user_id=victim.id, role="OWNER")
    mem_teammate = TeamMembership(team_id=test_team.id, user_id=teammate.id, role="MEMBER")
    db.add(mem_victim)
    db.add(mem_teammate)

    # Add a solved case credited to victim
    c1 = db.query(Case).first()
    if c1:
        solved = TeamSolvedCase(
            team_id=test_team.id,
            case_id=c1.id,
            points_awarded=c1.points,
            solved_by_user_id=victim.id
        )
        db.add(solved)

    db.commit()

    victim_id = victim.id
    admin1_id = admin1.id

    # Get tokens
    admin1_token = client.post("/api/v1/auth/login", json={"username": "admin_test_1", "password": "Pass#12345!"}).json()["access_token"]
    victim_token = client.post("/api/v1/auth/login", json={"username": "victim_cadet", "password": "Pass#12345!"}).json()["access_token"]

    admin1_headers = {"Authorization": f"Bearer {admin1_token}"}
    victim_headers = {"Authorization": f"Bearer {victim_token}"}

    # CHECK 1: Regular participant cannot delete another user (403 Forbidden)
    res_unauth = client.delete(f"/api/v1/admin/users/{victim_id}", headers=victim_headers, params={"confirm_username": "victim_cadet"})
    assert res_unauth.status_code == 403

    # CHECK 2: Admin cannot delete their own active account (400 Bad Request)
    res_self = client.delete(f"/api/v1/admin/users/{admin1_id}", headers=admin1_headers, params={"confirm_username": "admin_test_1"})
    assert res_self.status_code == 400
    assert "self-deletion is strictly prohibited" in res_self.json()["detail"]

    # CHECK 3: Incorrect username confirmation rejected (400 Bad Request)
    res_mismatch = client.delete(f"/api/v1/admin/users/{victim_id}", headers=admin1_headers, params={"confirm_username": "wrong_name"})
    assert res_mismatch.status_code == 400
    assert "mismatch" in res_mismatch.json()["detail"].lower()

    # CHECK 4: Successful deletion of victim user
    res_del = client.delete(f"/api/v1/admin/users/{victim_id}", headers=admin1_headers, params={"confirm_username": "victim_cadet"})
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True

    # CHECK 5: Deleted user can no longer authenticate
    res_login_after = client.post("/api/v1/auth/login", json={"username": "victim_cadet", "password": "Pass#12345!"})
    assert res_login_after.status_code == 401

    # CHECK 6: Old token of deleted user is immediately rejected
    res_token_revoked = client.get("/api/v1/auth/me", headers=victim_headers)
    assert res_token_revoked.status_code in (401, 404)

    # CHECK 7: Teammate promoted to OWNER of the team, team points and solved cases preserved
    db.expire_all()
    updated_team = db.query(Team).filter(Team.id == test_team.id).first()
    assert updated_team is not None
    assert updated_team.owner_id == teammate.id
    assert updated_team.points == 100

    # Solved case still exists, but solved_by_user_id is None (anonymized)
    updated_solved = db.query(TeamSolvedCase).filter(TeamSolvedCase.team_id == test_team.id).first()
    assert updated_solved is not None
    assert updated_solved.solved_by_user_id is None

    # CHECK 8: Audit log was created
    audit = db.query(AuditLog).filter(AuditLog.action == "DELETE_USER", AuditLog.target_id == str(victim_id)).order_by(AuditLog.id.desc()).first()
    assert audit is not None
    assert audit.user_id == admin1_id

    # Clean up test entities
    db.delete(updated_team)
    db.delete(admin1)
    db.delete(admin2)
    db.delete(teammate)
    db.commit()
    db.close()
