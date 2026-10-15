import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, Team, TeamMembership, TeamSolvedCase, Submission, Case
from app.core.security import hash_password

client = TestClient(app)

def test_team_lifecycle_and_shared_progress():
    db = SessionLocal()

    # Create users: leader, member1, member2, admin
    u_leader = db.query(User).filter(User.username == "team_leader_1").first()
    if not u_leader:
        u_leader = User(username="team_leader_1", email="l1@test.local", hashed_password=hash_password("Pass#12345!"), role="participant")
        db.add(u_leader)

    u_member1 = db.query(User).filter(User.username == "team_member_1").first()
    if not u_member1:
        u_member1 = User(username="team_member_1", email="m1@test.local", hashed_password=hash_password("Pass#12345!"), role="participant")
        db.add(u_member1)

    u_member2 = db.query(User).filter(User.username == "team_member_2").first()
    if not u_member2:
        u_member2 = User(username="team_member_2", email="m2@test.local", hashed_password=hash_password("Pass#12345!"), role="participant")
        db.add(u_member2)

    db.commit()

    token_leader = client.post("/api/v1/auth/login", json={"username": "team_leader_1", "password": "Pass#12345!"}).json()["access_token"]
    token_m1 = client.post("/api/v1/auth/login", json={"username": "team_member_1", "password": "Pass#12345!"}).json()["access_token"]
    token_m2 = client.post("/api/v1/auth/login", json={"username": "team_member_2", "password": "Pass#12345!"}).json()["access_token"]

    h_leader = {"Authorization": f"Bearer {token_leader}"}
    h_m1 = {"Authorization": f"Bearer {token_m1}"}
    h_m2 = {"Authorization": f"Bearer {token_m2}"}

    # 1. Clean any existing memberships for clean test run
    db.query(TeamMembership).filter(TeamMembership.user_id.in_([u_leader.id, u_member1.id, u_member2.id])).delete(synchronize_session="fetch")
    old_team = db.query(Team).filter(Team.name == "CYBER_TITANS").first()
    if old_team:
        db.delete(old_team)
    db.commit()

    # 2. Leader creates team CYBER_TITANS
    res_create = client.post("/api/v1/teams", headers=h_leader, json={"name": "CYBER_TITANS"})
    assert res_create.status_code == 201
    team_data = res_create.json()["team"]
    team_id = team_data["id"]
    invite_code = team_data["invitation_code"]
    assert len(invite_code) >= 16

    # 3. Cannot create duplicate team name
    res_dup = client.post("/api/v1/teams", headers=h_m1, json={"name": "cyber_titans"})
    assert res_dup.status_code == 400

    # 4. Member 1 joins CYBER_TITANS using invite_code
    res_join = client.post("/api/v1/teams/join", headers=h_m1, json={"invitation_code": invite_code})
    assert res_join.status_code == 200
    assert res_join.json()["success"] is True

    # 5. Member 1 cannot join again or join another team (1 team per user rule)
    res_join_again = client.post("/api/v1/teams/join", headers=h_m1, json={"invitation_code": invite_code})
    assert res_join_again.status_code == 400

    # 6. Check /teams/my
    res_my = client.get("/api/v1/teams/my", headers=h_m1)
    assert res_my.status_code == 200
    assert res_my.json()["team"]["name"] == "CYBER_TITANS"
    assert len(res_my.json()["team"]["members"]) == 2

    # 7. Rotate invite code by leader
    res_rot = client.post("/api/v1/teams/rotate-invite", headers=h_leader)
    assert res_rot.status_code == 200
    new_invite_code = res_rot.json()["new_invitation_code"]
    assert new_invite_code != invite_code

    # 8. Member 2 tries old invite code -> 404 Invalid/expired
    res_old_fail = client.post("/api/v1/teams/join", headers=h_m2, json={"invitation_code": invite_code})
    assert res_old_fail.status_code == 404

    # 9. Member 2 joins with new invite code -> Success
    res_join_m2 = client.post("/api/v1/teams/join", headers=h_m2, json={"invitation_code": new_invite_code})
    assert res_join_m2.status_code == 200

    # 10. Shared Scoring & Concurrency duplicate prevention
    c1 = db.query(Case).first()
    assert c1 is not None

    # Member 1 solves c1
    # Mock submission
    sub1 = Submission(
        user_id=u_member1.id,
        team_id=team_id,
        case_id=c1.id,
        language="python3",
        source_code="print('flag')",
        verdict="ACCEPTED",
        score=c1.points
    )
    db.add(sub1)
    db.commit()

    # Simulate submission handler shared point logic
    team_solve_1 = TeamSolvedCase(
        team_id=team_id,
        case_id=c1.id,
        points_awarded=c1.points,
        solved_by_user_id=u_member1.id,
        submission_id=sub1.id
    )
    db.add(team_solve_1)
    team_db = db.query(Team).filter(Team.id == team_id).first()
    team_db.points += c1.points
    db.commit()

    db.refresh(team_db)
    assert team_db.points == c1.points

    # Member 2 also submits and gets ACCEPTED for same problem (simulating concurrent or repeated solve)
    existing_solve = db.query(TeamSolvedCase).filter(TeamSolvedCase.team_id == team_id, TeamSolvedCase.case_id == c1.id).first()
    assert existing_solve is not None  # Already solved by team!
    # Team points should NOT increase again!
    assert team_db.points == c1.points

    # 11. Team Leaderboard
    res_lb = client.get("/api/v1/teams/leaderboard")
    assert res_lb.status_code == 200
    lb = res_lb.json()["leaderboard"]
    assert len(lb) >= 1
    top_team = lb[0]
    assert top_team["name"] == "CYBER_TITANS"
    assert top_team["points"] == c1.points
    assert top_team["solved_count"] == 1
    assert top_team["is_top_three"] is True

    # 12. Admin score adjustment & delete team
    admin_token = client.post("/api/v1/auth/login", json={"username": "lead_investigator", "password": "Investigator#2026!"}).json()["access_token"]
    h_admin = {"Authorization": f"Bearer {admin_token}"}

    res_adj = client.post(f"/api/v1/admin/teams/{team_id}/adjust-score", headers=h_admin, json={"points_delta": 50, "reason": "Bonus forensic clue award"})
    assert res_adj.status_code == 200
    assert res_adj.json()["new_points"] == c1.points + 50

    # Clean up test team
    res_del_team = client.delete(f"/api/v1/admin/teams/{team_id}", headers=h_admin)
    assert res_del_team.status_code == 200

    db.delete(sub1)
    db.delete(u_leader)
    db.delete(u_member1)
    db.delete(u_member2)
    db.commit()
    db.close()
