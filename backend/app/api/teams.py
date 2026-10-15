import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import (
    User, Team, TeamMembership, TeamMemberRole, TeamSolvedCase, Case, AuditLog
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/teams", tags=["Team Challenges & Workspace"])

class TeamCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)

class TeamJoinRequest(BaseModel):
    invitation_code: str = Field(..., min_length=4)

class TeamTransferRequest(BaseModel):
    new_owner_id: int

@router.post("", status_code=status.HTTP_201_CREATED)
def create_team(req: TeamCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Creates a new team. The authenticated creator becomes the team OWNER.
    Enforces 1 team per participant rule.
    Generates a cryptographically secure random invitation code.
    """
    clean_name = req.name.strip()
    if len(clean_name) < 2:
        raise HTTPException(status_code=400, detail="Team name must be at least 2 characters.")

    # 1. Enforce 1 team per participant
    existing_membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if existing_membership:
        raise HTTPException(
            status_code=400,
            detail=f"You are already a member of team '{existing_membership.team.name}'. Leave your current team before creating a new one."
        )

    # 2. Check team name uniqueness
    existing_team = db.query(Team).filter(func.lower(Team.name) == clean_name.lower()).first()
    if existing_team:
        raise HTTPException(status_code=400, detail=f"Team name '{clean_name}' is already taken. Please choose another unique callsign.")

    # 3. Generate cryptographically secure token
    invite_code = secrets.token_urlsafe(16)

    team = Team(
        name=clean_name,
        invitation_code=invite_code,
        owner_id=current_user.id,
        points=0,
        max_members=4,
        is_active=True
    )
    db.add(team)
    db.flush()

    membership = TeamMembership(
        team_id=team.id,
        user_id=current_user.id,
        role=TeamMemberRole.OWNER.value,
        joined_at=datetime.now(timezone.utc)
    )
    db.add(membership)
    db.commit()
    db.refresh(team)

    return {
        "success": True,
        "team": {
            "id": team.id,
            "name": team.name,
            "invitation_code": team.invitation_code,
            "owner_id": team.owner_id,
            "points": team.points,
            "max_members": team.max_members,
            "members_count": 1,
            "role": TeamMemberRole.OWNER.value
        }
    }

@router.get("/my")
def get_my_team(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns the current user's team workspace details:
    team info, members, invitation code/link, and shared challenge progress.
    """
    membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if not membership or not membership.team or not membership.team.is_active:
        return {"team": None}

    team = membership.team
    members = [
        {
            "user_id": m.user_id,
            "username": m.user.username if m.user else "Unknown",
            "role": m.role,
            "points": m.user.points if m.user else 0,
            "joined_at": m.joined_at,
            "is_current_user": (m.user_id == current_user.id)
        }
        for m in team.memberships
    ]

    solved = [
        {
            "case_id": sc.case_id,
            "case_title": sc.case.title if sc.case else sc.case_id,
            "domain": sc.case.domain if sc.case else "Unknown",
            "points_awarded": sc.points_awarded,
            "solved_by_username": sc.solved_by.username if sc.solved_by else "Teammate",
            "solved_at": sc.solved_at
        }
        for sc in sorted(team.solved_cases, key=lambda s: s.solved_at, reverse=True)
    ]

    return {
        "team": {
            "id": team.id,
            "name": team.name,
            "invitation_code": team.invitation_code,
            "points": team.points,
            "max_members": team.max_members,
            "created_at": team.created_at,
            "updated_at": team.updated_at,
            "is_owner": (membership.role == TeamMemberRole.OWNER.value),
            "owner": {
                "id": team.owner.id if team.owner else None,
                "username": team.owner.username if team.owner else "None"
            },
            "members": members,
            "solved_cases": solved,
            "solved_count": len(solved)
        }
    }

@router.post("/join")
def join_team(req: TeamJoinRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Joins an existing team via its cryptographic invitation code.
    Validates token, capacity, and ensures 1 team per participant.
    """
    clean_code = req.invitation_code.strip()

    # 1. Check if user already in a team
    existing_membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if existing_membership:
        raise HTTPException(
            status_code=400,
            detail=f"You are already in team '{existing_membership.team.name}'. Leave your current team first."
        )

    # 2. Look up team by invitation code
    team = db.query(Team).filter(Team.invitation_code == clean_code, Team.is_active == True).first()
    if not team:
        raise HTTPException(
            status_code=404,
            detail="Invalid, expired, or revoked team invitation code."
        )

    # 3. Check capacity limit
    current_count = db.query(TeamMembership).filter(TeamMembership.team_id == team.id).count()
    if current_count >= team.max_members:
        raise HTTPException(
            status_code=400,
            detail=f"Team '{team.name}' has reached its maximum roster limit ({team.max_members} members)."
        )

    membership = TeamMembership(
        team_id=team.id,
        user_id=current_user.id,
        role=TeamMemberRole.MEMBER.value,
        joined_at=datetime.now(timezone.utc)
    )
    db.add(membership)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully joined squad '{team.name}'.",
        "team_id": team.id,
        "team_name": team.name
    }

@router.post("/leave")
def leave_team(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Allows a participant to leave their current team.
    If owner leaves and other members exist, ownership transfers to earliest joined member.
    If sole member leaves, team is deleted.
    """
    membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="You are not currently in any team.")

    team = membership.team
    team_name = team.name

    if membership.role == TeamMemberRole.OWNER.value:
        other_members = db.query(TeamMembership).filter(
            TeamMembership.team_id == team.id,
            TeamMembership.user_id != current_user.id
        ).order_by(TeamMembership.joined_at.asc()).all()

        if other_members:
            new_owner = other_members[0]
            new_owner.role = TeamMemberRole.OWNER.value
            team.owner_id = new_owner.user_id
            db.delete(membership)
        else:
            db.delete(team)
    else:
        db.delete(membership)

    db.commit()
    return {"success": True, "message": f"You have successfully departed from team '{team_name}'."}

@router.post("/rotate-invite")
def rotate_invite_code(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Regenerates the team's invitation code, revoking any previous invitation tokens.
    Only authorized team OWNER can perform this action.
    """
    membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if not membership or membership.role != TeamMemberRole.OWNER.value:
        raise HTTPException(status_code=403, detail="Only the team OWNER can rotate invitation codes.")

    team = membership.team
    new_code = secrets.token_urlsafe(16)
    team.invitation_code = new_code
    db.commit()

    return {
        "success": True,
        "message": "Team invitation token successfully rotated. Previous codes are now invalid.",
        "new_invitation_code": new_code
    }

@router.delete("/members/{user_id}")
def remove_member(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Removes a member from the team. Only the team OWNER can remove members.
    """
    membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if not membership or membership.role != TeamMemberRole.OWNER.value:
        raise HTTPException(status_code=403, detail="Only the team OWNER can remove members.")

    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Team owner cannot kick themselves. Use /leave to transfer or disband.")

    target_membership = db.query(TeamMembership).filter(
        TeamMembership.team_id == membership.team_id,
        TeamMembership.user_id == user_id
    ).first()

    if not target_membership:
        raise HTTPException(status_code=404, detail="Target user is not a member of your team.")

    target_username = target_membership.user.username if target_membership.user else str(user_id)
    db.delete(target_membership)
    db.commit()

    return {"success": True, "message": f"Removed '{target_username}' from the team."}

@router.post("/transfer-ownership")
def transfer_ownership(req: TeamTransferRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Transfers team ownership to another active member of the team.
    """
    owner_membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if not owner_membership or owner_membership.role != TeamMemberRole.OWNER.value:
        raise HTTPException(status_code=403, detail="Only the team OWNER can transfer team ownership.")

    if current_user.id == req.new_owner_id:
        raise HTTPException(status_code=400, detail="You already own this team.")

    target_membership = db.query(TeamMembership).filter(
        TeamMembership.team_id == owner_membership.team_id,
        TeamMembership.user_id == req.new_owner_id
    ).first()

    if not target_membership:
        raise HTTPException(status_code=400, detail="Target user is not a member of your team.")

    owner_membership.role = TeamMemberRole.MEMBER.value
    target_membership.role = TeamMemberRole.OWNER.value
    owner_membership.team.owner_id = req.new_owner_id
    db.commit()

    return {
        "success": True,
        "message": f"Team ownership transferred to {target_membership.user.username}."
    }

@router.get("/leaderboard")
def get_team_leaderboard(db: Session = Depends(get_db)):
    """
    Returns authoritative, live team leaderboard rankings:
    Ranked by:
    1. Total Team Points (Highest first)
    2. Challenges Completed (Highest first)
    3. Earliest last activity (Earliest solve/creation time first)
    4. Deterministic tie-breaker: Team ID ASC
    """
    teams = db.query(Team).filter(Team.is_active == True).all()

    team_stats = []
    for t in teams:
        members_count = len(t.memberships)
        solved_count = len(t.solved_cases)
        # Determine latest activity
        last_solve_time = None
        if t.solved_cases:
            last_solve_time = max(sc.solved_at for sc in t.solved_cases)
        activity_time = last_solve_time or t.created_at

        team_stats.append({
            "id": t.id,
            "name": t.name,
            "members_count": members_count,
            "solved_count": solved_count,
            "points": t.points,
            "last_activity": activity_time,
            "created_at": t.created_at
        })

    # Sort deterministically
    # 1: -points, 2: -solved_count, 3: last_activity (earliest first), 4: id asc
    team_stats.sort(key=lambda x: (
        -x["points"],
        -x["solved_count"],
        x["last_activity"],
        x["id"]
    ))

    # Assign ranks
    leaderboard = []
    for idx, t in enumerate(team_stats, start=1):
        leaderboard.append({
            "rank": idx,
            "id": t["id"],
            "name": t["name"],
            "members_count": t["members_count"],
            "solved_count": t["solved_count"],
            "points": t["points"],
            "last_activity": t["last_activity"].isoformat() if t["last_activity"] else None,
            "is_top_three": idx <= 3
        })

    return {
        "leaderboard": leaderboard,
        "total_teams": len(leaderboard)
    }
