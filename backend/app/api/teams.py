import secrets
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Team, TeamMembership, TeamMemberRole, User, AuditLog, Event, ParticipationMode, EventRegistration
from app.api.deps import get_current_user

router = APIRouter(prefix="/teams", tags=["Squad & Team Operations"])

class CreateTeamRequest(BaseModel):
    name: str
    event_id: Optional[int] = None
    max_members: Optional[int] = 4

class JoinTeamRequest(BaseModel):
    invitation_code: str

@router.get("/me")
def get_my_team(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if not membership or not membership.team or not membership.team.is_active:
        return {"has_team": False, "team": None}

    team = membership.team
    members = [
        {
            "user_id": m.user_id,
            "username": m.user.username if m.user else "Unknown",
            "role": m.role,
            "points": m.user.points if m.user else 0,
            "joined_at": m.joined_at
        }
        for m in team.memberships
    ]

    solved = [
        {
            "challenge_type": s.challenge_type,
            "challenge_id": s.challenge_id,
            "points_awarded": s.points_awarded,
            "solved_at": s.solved_at
        }
        for s in team.solves
    ]

    return {
        "has_team": True,
        "team": {
            "id": team.id,
            "name": team.name,
            "invitation_code": team.invitation_code,
            "owner_id": team.owner_id,
            "points": team.points,
            "max_members": team.max_members,
            "members": members,
            "my_role": membership.role,
            "solved_challenges": solved,
            "created_at": team.created_at
        }
    }

@router.post("")
def create_team(req: CreateTeamRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify user does not already belong to an active team
    existing_mem = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if existing_mem and existing_mem.team and existing_mem.team.is_active:
        raise HTTPException(
            status_code=400,
            detail=f"You are already enlisted in squad '{existing_mem.team.name}'. Leave your current squad first."
        )

    clean_name = req.name.strip()
    if len(clean_name) < 3 or len(clean_name) > 50:
        raise HTTPException(status_code=400, detail="Squad name must be between 3 and 50 characters.")

    # Event mode verification
    max_capacity = max(2, min(8, req.max_members or 4))
    if req.event_id:
        event = db.query(Event).filter(Event.id == req.event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Target event not found.")
        if event.participation_mode == ParticipationMode.INDIVIDUAL.value:
            raise HTTPException(status_code=400, detail="Solo competition mode does not permit squad creation.")
        if not event.team_allow_create:
            raise HTTPException(status_code=400, detail="Squad creation is restricted by tournament directors.")
        max_capacity = event.team_size_max

    existing_name = db.query(Team).filter(Team.name.ilike(clean_name), Team.is_active == True).first()
    if existing_name:
        raise HTTPException(status_code=400, detail="Squad name is already claimed. Choose a unique squad name.")

    invite_code = secrets.token_urlsafe(16)
    new_team = Team(
        name=clean_name,
        invitation_code=invite_code,
        owner_id=current_user.id,
        event_id=req.event_id,
        points=0,
        max_members=max_capacity,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    membership = TeamMembership(
        team_id=new_team.id,
        user_id=current_user.id,
        role=TeamMemberRole.OWNER.value,
        joined_at=datetime.now(timezone.utc)
    )
    db.add(membership)

    if req.event_id:
        reg = db.query(EventRegistration).filter(
            EventRegistration.event_id == req.event_id,
            EventRegistration.user_id == current_user.id
        ).first()
        if reg:
            reg.team_id = new_team.id
            reg.selected_mode = "team"
        else:
            db.add(EventRegistration(
                event_id=req.event_id,
                user_id=current_user.id,
                team_id=new_team.id,
                selected_mode="team"
            ))

    db.commit()

    return {
        "success": True,
        "team_id": new_team.id,
        "name": new_team.name,
        "invitation_code": new_team.invitation_code,
        "role": TeamMemberRole.OWNER.value
    }

@router.post("/join")
def join_team(req: JoinTeamRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_mem = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if existing_mem and existing_mem.team and existing_mem.team.is_active:
        raise HTTPException(
            status_code=400,
            detail=f"You are already enlisted in squad '{existing_mem.team.name}'."
        )

    clean_code = req.invitation_code.strip()
    team = db.query(Team).filter(Team.invitation_code == clean_code, Team.is_active == True).first()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid or revoked squad invitation token.")

    if team.is_locked:
        raise HTTPException(status_code=400, detail="Squad roster is locked for competition.")

    effective_max = team.max_members
    if team.event:
        if not team.event.team_allow_join_code:
            raise HTTPException(status_code=400, detail="Enlistment via invitation token is disabled for this tournament.")
        if team.event.team_size_max:
            effective_max = min(effective_max, team.event.team_size_max)

    current_member_count = db.query(TeamMembership).filter(TeamMembership.team_id == team.id).count()
    if current_member_count >= effective_max:
        raise HTTPException(
            status_code=400,
            detail=f"Squad '{team.name}' has reached its maximum operative capacity ({effective_max})."
        )

    membership = TeamMembership(
        team_id=team.id,
        user_id=current_user.id,
        role=TeamMemberRole.MEMBER.value,
        joined_at=datetime.now(timezone.utc)
    )
    db.add(membership)

    if team.event_id:
        reg = db.query(EventRegistration).filter(
            EventRegistration.event_id == team.event_id,
            EventRegistration.user_id == current_user.id
        ).first()
        if reg:
            reg.team_id = team.id
            reg.selected_mode = "team"
        else:
            db.add(EventRegistration(
                event_id=team.event_id,
                user_id=current_user.id,
                team_id=team.id,
                selected_mode="team"
            ))

    db.commit()

    return {
        "success": True,
        "message": f"Successfully joined squad '{team.name}'.",
        "team_id": team.id,
        "team_name": team.name,
        "role": TeamMemberRole.MEMBER.value
    }

@router.post("/leave")
def leave_team(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="You are not enlisted in any squad.")

    team = membership.team
    if team.is_locked:
        raise HTTPException(status_code=400, detail="Roster is locked while event is actively running.")

    if membership.role == TeamMemberRole.OWNER.value:
        other_members = db.query(TeamMembership).filter(
            TeamMembership.team_id == team.id,
            TeamMembership.user_id != current_user.id
        ).order_by(TeamMembership.joined_at.asc()).all()

        if other_members:
            # Transfer ownership to next operative
            new_owner = other_members[0]
            new_owner.role = TeamMemberRole.OWNER.value
            team.owner_id = new_owner.user_id
            db.delete(membership)
        else:
            # Squad is now empty, delete
            db.delete(membership)
            db.delete(team)
    else:
        db.delete(membership)

    db.commit()
    return {"success": True, "message": "Successfully left squad."}

@router.post("/rotate-invite")
def rotate_invitation_code(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if not membership or membership.role != TeamMemberRole.OWNER.value:
        raise HTTPException(status_code=403, detail="Only squad owners can rotate the invitation token.")

    team = membership.team
    new_code = secrets.token_urlsafe(16)
    team.invitation_code = new_code
    db.commit()

    return {"success": True, "new_invitation_code": new_code}
