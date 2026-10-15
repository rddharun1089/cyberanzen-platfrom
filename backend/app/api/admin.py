from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import secrets
from app.db.session import get_db
from app.db.models import (
    Case, TestCase, User, AuditLog, Submission, UserRole,
    Team, TeamMembership, TeamMemberRole, TeamSolvedCase
)
from app.api.deps import get_current_admin
from app.services.git_service import scan_questions_repository, get_git_repo_info
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])

class CaseUpdateRequest(BaseModel):
    title: Optional[str] = None
    points: Optional[int] = None
    difficulty: Optional[str] = None
    publication_status: Optional[str] = None  # PUBLISHED, DRAFT, ARCHIVED
    validation_status: Optional[str] = None
    story: Optional[str] = None
    objective: Optional[str] = None
    input_contract: Optional[str] = None
    required_result: Optional[str] = None
    judge_enabled: Optional[bool] = None
    reveal_failed_tests: Optional[bool] = None
    allow_copy_paste: Optional[bool] = None

class BatchJudgeToggleRequest(BaseModel):
    domain: Optional[str] = None  # None means all domains
    judge_enabled: Optional[bool] = None
    reveal_failed_tests: Optional[bool] = None
    allow_copy_paste: Optional[bool] = None

class TestCaseCreateRequest(BaseModel):
    test_type: str  # public_sample or hidden_test
    input_data: str
    expected_output: str
    points: int = 0

@router.get("/cases")
def admin_list_cases(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    cases = db.query(Case).order_by(Case.number.asc()).all()
    return [
        {
            "id": c.id,
            "number": c.number,
            "title": c.title,
            "domain": c.domain,
            "points": c.points,
            "difficulty": c.difficulty,
            "publication_status": c.publication_status,
            "validation_status": c.validation_status,
            "validation_notes": c.validation_notes,
            "judge_enabled": c.judge_enabled,
            "reveal_failed_tests": c.reveal_failed_tests,
            "allow_copy_paste": c.allow_copy_paste,
            "test_count": len(c.test_cases)
        }
        for c in cases
    ]

@router.get("/solutions")
def admin_list_solutions(
    domain: Optional[str] = None,
    case_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Returns reference solutions, official answers, flag formats, and all test cases
    (both public samples and hidden tests) for admin review.
    """
    query = db.query(Case)
    if case_id:
        query = query.filter(Case.id == case_id)
    if domain:
        query = query.filter(Case.domain == domain)

    cases = query.order_by(Case.number.asc()).all()
    return [
        {
            "id": c.id,
            "number": c.number,
            "title": c.title,
            "domain": c.domain,
            "points": c.points,
            "difficulty": c.difficulty,
            "publication_status": c.publication_status,
            "validation_status": c.validation_status,
            "judge_enabled": c.judge_enabled,
            "reveal_failed_tests": c.reveal_failed_tests,
            "allow_copy_paste": c.allow_copy_paste,
            "flag_format": c.flag_format,
            "objective": c.objective,
            "input_contract": c.input_contract,
            "required_result": c.required_result,
            "reference_solution": c.reference_solution,
            "starter_py": c.starter_py,
            "starter_cpp": c.starter_cpp,
            "starter_c": c.starter_c,
            "test_cases": [
                {
                    "id": tc.id,
                    "type": tc.test_type,
                    "index": tc.test_index,
                    "input": tc.input_data,
                    "output": tc.expected_output,
                    "points": tc.points
                }
                for tc in sorted(c.test_cases, key=lambda t: (0 if t.test_type == "public_sample" else 1, t.test_index))
            ]
        }
        for c in cases
    ]

@router.post("/cases/batch-judge-toggle")
def admin_batch_judge_toggle(
    req: BatchJudgeToggleRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    query = db.query(Case)
    if req.domain:
        query = query.filter(Case.domain == req.domain)
    cases = query.all()

    for c in cases:
        if req.judge_enabled is not None:
            c.judge_enabled = req.judge_enabled
        if req.reveal_failed_tests is not None:
            c.reveal_failed_tests = req.reveal_failed_tests
        if req.allow_copy_paste is not None:
            c.allow_copy_paste = req.allow_copy_paste

    # Record Audit Log
    log = AuditLog(
        user_id=current_admin.id,
        action="BATCH_JUDGE_TOGGLE",
        target_type="DOMAIN" if req.domain else "ALL_CASES",
        target_id=req.domain or "ALL",
        details=f"Judge/clipboard toggle by {current_admin.username}: judge_enabled={req.judge_enabled}, reveal_failed={req.reveal_failed_tests}, allow_copy_paste={req.allow_copy_paste}"
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "affected_cases": len(cases),
        "domain": req.domain or "ALL",
        "judge_enabled": req.judge_enabled,
        "reveal_failed_tests": req.reveal_failed_tests,
        "allow_copy_paste": req.allow_copy_paste
    }

@router.put("/cases/{case_id}")
def admin_update_case(case_id: str, req: CaseUpdateRequest, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if req.title is not None: case.title = req.title
    if req.points is not None: case.points = req.points
    if req.difficulty is not None: case.difficulty = req.difficulty
    if req.publication_status is not None: case.publication_status = req.publication_status
    if req.validation_status is not None: case.validation_status = req.validation_status
    if req.story is not None: case.story = req.story
    if req.objective is not None: case.objective = req.objective
    if req.input_contract is not None: case.input_contract = req.input_contract
    if req.required_result is not None: case.required_result = req.required_result
    if req.judge_enabled is not None: case.judge_enabled = req.judge_enabled
    if req.reveal_failed_tests is not None: case.reveal_failed_tests = req.reveal_failed_tests
    if req.allow_copy_paste is not None: case.allow_copy_paste = req.allow_copy_paste

    # Record Audit Log
    log = AuditLog(
        user_id=current_admin.id,
        action="UPDATE_CASE",
        target_type="CASE",
        target_id=case_id,
        details=f"Updated case {case_id} by {current_admin.username}"
    )
    db.add(log)
    db.commit()
    db.refresh(case)

    return {"success": True, "case_id": case.id, "publication_status": case.publication_status}

@router.post("/cases/{case_id}/tests")
def admin_add_test(case_id: str, req: TestCaseCreateRequest, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    count = db.query(TestCase).filter(TestCase.case_id == case_id).count()
    tc = TestCase(
        case_id=case_id,
        test_type=req.test_type,
        test_index=count + 1,
        input_data=req.input_data,
        expected_output=req.expected_output,
        points=req.points
    )
    db.add(tc)

    # Record Audit Log
    log = AuditLog(
        user_id=current_admin.id,
        action="ADD_TEST_CASE",
        target_type="TEST_CASE",
        target_id=str(tc.id),
        details=f"Added {req.test_type} to {case_id}"
    )
    db.add(log)
    db.commit()
    return {"success": True, "test_id": tc.id}

@router.get("/audit-logs")
def admin_audit_logs(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "details": l.details,
            "timestamp": l.timestamp
        }
        for l in logs
    ]

@router.get("/health")
def admin_system_health(current_admin: User = Depends(get_current_admin)):
    git_info = get_git_repo_info(settings.BASE_DIR)
    return {
        "status": "HEALTHY",
        "judge_engine": "ACTIVE (C/C++/Python3 isolated worker)",
        "git": git_info,
        "database": "CONNECTED",
        "active_cases": 80
    }

class DeleteUserConfirmation(BaseModel):
    confirm_username: str

class AdminTransferOwnershipRequest(BaseModel):
    new_owner_id: int

class AdminAdjustScoreRequest(BaseModel):
    points_delta: int
    reason: str

# --- USER MANAGEMENT ---

@router.get("/users")
def admin_list_users(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    users = db.query(User).order_by(User.id.asc()).all()
    results = []
    for u in users:
        team_data = None
        if u.team_membership and u.team_membership.team:
            team_data = {
                "team_id": u.team_membership.team_id,
                "team_name": u.team_membership.team.name,
                "role": u.team_membership.role
            }
        sub_count = db.query(Submission).filter(Submission.user_id == u.id).count()
        results.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "points": u.points,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "team": team_data,
            "submission_count": sub_count,
            "is_current_admin": (u.id == current_admin.id)
        })
    return results

@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    confirm_username: Optional[str] = None,
    req: Optional[DeleteUserConfirmation] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"User ID {user_id} not found in database.")

    provided_confirm = ""
    if req and req.confirm_username:
        provided_confirm = req.confirm_username.strip()
    elif confirm_username:
        provided_confirm = confirm_username.strip()

    # 1. Explicit username verification check
    if provided_confirm != target_user.username:
        raise HTTPException(
            status_code=400,
            detail=f"Confirmation username mismatch. Expected '{target_user.username}', received '{provided_confirm}'."
        )

    # 2. Prevent administrative self-deletion
    if target_user.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="Administrative self-deletion is strictly prohibited. You cannot delete your own active account."
        )

    # 3. Prevent deletion of the final active super-admin
    if target_user.role == UserRole.ADMIN.value:
        active_admins = db.query(User).filter(
            User.role == UserRole.ADMIN.value,
            User.is_active == True,
            User.id != target_user.id
        ).count()
        if active_admins == 0:
            raise HTTPException(
                status_code=400,
                detail="Operation prohibited: Cannot delete the final active administrator. Establish another active administrator first."
            )

    deleted_username = target_user.username
    deleted_role = target_user.role

    try:
        # 4. Handle team memberships and team ownership
        if target_user.team_membership:
            membership = target_user.team_membership
            team = membership.team
            if membership.role == TeamMemberRole.OWNER.value and team:
                other_members = db.query(TeamMembership).filter(
                    TeamMembership.team_id == team.id,
                    TeamMembership.user_id != target_user.id
                ).order_by(TeamMembership.joined_at.asc()).all()
                if other_members:
                    new_owner_membership = other_members[0]
                    new_owner_membership.role = TeamMemberRole.OWNER.value
                    team.owner_id = new_owner_membership.user_id
                    db.delete(membership)
                else:
                    db.delete(team)
            else:
                db.delete(membership)

        # 5. Dissociate solved_by_user_id in TeamSolvedCase to preserve team achievements
        db.query(TeamSolvedCase).filter(TeamSolvedCase.solved_by_user_id == target_user.id).update(
            {"solved_by_user_id": None}, synchronize_session="fetch"
        )

        # 6. Record Audit Log before deletion
        log = AuditLog(
            user_id=current_admin.id,
            action="DELETE_USER",
            target_type="USER",
            target_id=str(user_id),
            details=f"Permanently deleted account ID {user_id} (callsign: {deleted_username}, role: {deleted_role}) by admin '{current_admin.username}'."
        )
        db.add(log)

        # 7. Delete target user (cascades submissions, evidence tokens, memberships)
        db.delete(target_user)
        db.commit()

        return {
            "success": True,
            "message": f"Account '{deleted_username}' (ID {user_id}) and associated credentials have been permanently deleted.",
            "deleted_user_id": user_id,
            "deleted_username": deleted_username
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

# --- ADMIN TEAM MANAGEMENT ---

@router.get("/teams")
def admin_list_teams(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    teams = db.query(Team).order_by(Team.points.desc(), Team.updated_at.asc()).all()
    results = []
    for t in teams:
        members = [
            {
                "user_id": m.user_id,
                "username": m.user.username if m.user else "Unknown",
                "role": m.role,
                "points": m.user.points if m.user else 0,
                "joined_at": m.joined_at
            }
            for m in t.memberships
        ]
        results.append({
            "id": t.id,
            "name": t.name,
            "invitation_code": t.invitation_code,
            "points": t.points,
            "max_members": t.max_members,
            "is_active": t.is_active,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
            "owner": {
                "id": t.owner.id if t.owner else None,
                "username": t.owner.username if t.owner else "None"
            },
            "members": members,
            "solved_count": len(t.solved_cases)
        })
    return results

@router.post("/teams/{team_id}/rotate-invite")
def admin_rotate_team_invite(team_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    new_code = secrets.token_urlsafe(16)
    team.invitation_code = new_code

    log = AuditLog(
        user_id=current_admin.id,
        action="ADMIN_ROTATE_TEAM_INVITE",
        target_type="TEAM",
        target_id=str(team.id),
        details=f"Admin '{current_admin.username}' rotated invitation code for team '{team.name}'."
    )
    db.add(log)
    db.commit()
    return {"success": True, "team_id": team.id, "new_invitation_code": new_code}

@router.delete("/teams/{team_id}/members/{user_id}")
def admin_remove_team_member(team_id: int, user_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    membership = db.query(TeamMembership).filter(TeamMembership.team_id == team_id, TeamMembership.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found.")

    team = membership.team
    member_username = membership.user.username if membership.user else str(user_id)

    if membership.role == TeamMemberRole.OWNER.value:
        other_members = db.query(TeamMembership).filter(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id != user_id
        ).order_by(TeamMembership.joined_at.asc()).all()
        if other_members:
            new_owner = other_members[0]
            new_owner.role = TeamMemberRole.OWNER.value
            team.owner_id = new_owner.user_id
        else:
            raise HTTPException(status_code=400, detail="Cannot remove sole member / owner. Delete the team instead.")

    db.delete(membership)
    log = AuditLog(
        user_id=current_admin.id,
        action="ADMIN_REMOVE_TEAM_MEMBER",
        target_type="TEAM",
        target_id=str(team_id),
        details=f"Admin '{current_admin.username}' removed member '{member_username}' from team '{team.name}'."
    )
    db.add(log)
    db.commit()
    return {"success": True, "message": f"Member '{member_username}' removed from team '{team.name}'."}

@router.post("/teams/{team_id}/transfer-ownership")
def admin_transfer_team_ownership(
    team_id: int,
    req: AdminTransferOwnershipRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    target_membership = db.query(TeamMembership).filter(
        TeamMembership.team_id == team_id,
        TeamMembership.user_id == req.new_owner_id
    ).first()
    if not target_membership:
        raise HTTPException(status_code=400, detail="Target user is not a member of this team.")

    # Demote old owner if exists
    old_owner_membership = db.query(TeamMembership).filter(
        TeamMembership.team_id == team_id,
        TeamMembership.role == TeamMemberRole.OWNER.value
    ).first()
    if old_owner_membership:
        old_owner_membership.role = TeamMemberRole.MEMBER.value

    target_membership.role = TeamMemberRole.OWNER.value
    team.owner_id = req.new_owner_id

    log = AuditLog(
        user_id=current_admin.id,
        action="ADMIN_TRANSFER_TEAM_OWNERSHIP",
        target_type="TEAM",
        target_id=str(team_id),
        details=f"Admin '{current_admin.username}' transferred ownership of team '{team.name}' to user ID {req.new_owner_id}."
    )
    db.add(log)
    db.commit()
    return {"success": True, "team_id": team.id, "new_owner_id": req.new_owner_id}

@router.post("/teams/{team_id}/adjust-score")
def admin_adjust_team_score(
    team_id: int,
    req: AdminAdjustScoreRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    old_points = team.points
    team.points = max(0, team.points + req.points_delta)

    log = AuditLog(
        user_id=current_admin.id,
        action="ADMIN_ADJUST_TEAM_SCORE",
        target_type="TEAM",
        target_id=str(team_id),
        details=f"Admin '{current_admin.username}' adjusted score for team '{team.name}' by {req.points_delta} pts ({old_points} -> {team.points}). Reason: {req.reason}"
    )
    db.add(log)
    db.commit()
    return {"success": True, "team_id": team.id, "old_points": old_points, "new_points": team.points}

@router.delete("/teams/{team_id}")
def admin_delete_team(team_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    team_name = team.name
    log = AuditLog(
        user_id=current_admin.id,
        action="ADMIN_DELETE_TEAM",
        target_type="TEAM",
        target_id=str(team_id),
        details=f"Admin '{current_admin.username}' deleted team '{team_name}' (ID {team_id}). Member history preserved."
    )
    db.add(log)
    db.delete(team)
    db.commit()
    return {"success": True, "message": f"Team '{team_name}' (ID {team_id}) has been permanently disbanded."}
