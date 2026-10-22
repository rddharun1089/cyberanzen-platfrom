from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
from app.db.session import get_db
from app.db.models import (
    Event, EventRegistration, Team, Solve, User, EventStatus, ParticipationMode
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/events", tags=["Events & Competitions"])

@router.get("")
def list_events(
    status: Optional[str] = Query(None, description="Filter by status (active, upcoming, completed)"),
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if status:
        query = query.filter(Event.status == status)
    else:
        # Exclude draft events from general participants
        query = query.filter(Event.status != EventStatus.DRAFT.value)

    events = query.order_by(Event.start_time.asc()).all()
    return [
        {
            "id": e.id,
            "slug": e.slug,
            "title": e.title,
            "description": e.description,
            "banner_url": e.banner_url,
            "status": e.status,
            "participation_mode": e.participation_mode,
            "team_size_min": e.team_size_min,
            "team_size_max": e.team_size_max,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "registration_open": e.registration_open,
            "clipboard_policy": e.clipboard_policy,
            "scoring_policy": e.scoring_policy,
            "allowed_languages": json.loads(e.allowed_languages) if e.allowed_languages else []
        }
        for e in events
    ]

@router.get("/{event_id}")
def get_event_detail(event_id: str, db: Session = Depends(get_db)):
    if event_id.isdigit():
        event = db.query(Event).filter(Event.id == int(event_id)).first()
    else:
        event = db.query(Event).filter(Event.slug == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event competition not found.")

    reg_count = db.query(EventRegistration).filter(EventRegistration.event_id == event.id).count()

    return {
        "id": event.id,
        "slug": event.slug,
        "title": event.title,
        "description": event.description,
        "banner_url": event.banner_url,
        "rules": event.rules,
        "status": event.status,
        "participation_mode": event.participation_mode,
        "team_size_min": event.team_size_min,
        "team_size_max": event.team_size_max,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "registration_open": event.registration_open,
        "registration_count": reg_count,
        "clipboard_policy": event.clipboard_policy,
        "scoring_policy": event.scoring_policy,
        "allowed_languages": json.loads(event.allowed_languages) if event.allowed_languages else [],
        "leaderboard_visible": event.leaderboard_visible,
        "leaderboard_frozen": event.leaderboard_frozen
    }

@router.post("/{event_id}/register")
def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event competition not found.")

    if not event.registration_open:
        raise HTTPException(status_code=400, detail="Event registration is currently closed.")

    # Check existing registration
    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.user_id == current_user.id
    ).first()

    if existing:
        return {"success": True, "message": "Already registered for this competition.", "registration_id": existing.id}

    team_id = current_user.team_membership.team_id if current_user.team_membership else None
    reg = EventRegistration(
        event_id=event.id,
        user_id=current_user.id,
        team_id=team_id,
        registered_at=datetime.now(timezone.utc)
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)

    return {
        "success": True,
        "message": f"Successfully enlisted into '{event.title}'.",
        "registration_id": reg.id,
        "participation_mode": event.participation_mode
    }

@router.get("/{event_id}/leaderboard")
def get_event_leaderboard(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event competition not found.")

    if not event.leaderboard_visible:
        return {
            "is_frozen": True,
            "message": "Event leaderboard is currently confidential.",
            "standings": []
        }

    # If team mode, return team standings
    if event.participation_mode == ParticipationMode.TEAM.value:
        teams = db.query(Team).filter(Team.event_id == event.id, Team.is_active == True).order_by(
            Team.points.desc(), Team.updated_at.asc()
        ).all()

        return {
            "mode": "team",
            "is_frozen": event.leaderboard_frozen,
            "standings": [
                {
                    "rank": idx + 1,
                    "team_id": t.id,
                    "team_name": t.name,
                    "points": t.points,
                    "solved_count": len(t.solves),
                    "last_solve_time": t.updated_at
                }
                for idx, t in enumerate(teams)
            ]
        }
    else:
        # Individual or mixed standings
        regs = db.query(EventRegistration).filter(EventRegistration.event_id == event.id).all()
        user_ids = [r.user_id for r in regs]
        users = db.query(User).filter(User.id.in_(user_ids)).order_by(User.points.desc()).all()

        return {
            "mode": "individual",
            "is_frozen": event.leaderboard_frozen,
            "standings": [
                {
                    "rank": idx + 1,
                    "user_id": u.id,
                    "username": u.username,
                    "points": u.points,
                    "solved_count": len(u.solves)
                }
                for idx, u in enumerate(users)
            ]
        }
