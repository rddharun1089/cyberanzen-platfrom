from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
from app.db.session import get_db
from app.db.models import (
    Event, EventRegistration, Team, Solve, User, EventStatus, ParticipationMode, EventType,
    DSAQuestion, CTFChallenge, MCQQuestion, EventDSAQuestion, EventCTFChallenge, EventMCQQuestion
)
from app.api.deps import get_current_user, get_optional_current_user

router = APIRouter(prefix="/events", tags=["Events & Competitions"])

class RegisterEventRequest(BaseModel):
    selected_mode: Optional[str] = "individual"

def serialize_event(e: Event, current_user: Optional[User] = None, db: Optional[Session] = None) -> dict:
    reg_count = len(e.registrations) if e.registrations else 0
    is_registered = False
    reg_id = None
    selected_mode = None

    if current_user and db:
        reg = db.query(EventRegistration).filter(
            EventRegistration.event_id == e.id,
            EventRegistration.user_id == current_user.id
        ).first()
        if reg:
            is_registered = True
            reg_id = reg.id
            selected_mode = reg.selected_mode

    return {
        "id": e.id,
        "slug": e.slug,
        "title": e.title,
        "event_type": e.event_type or "dsa",
        "short_description": e.short_description or e.description[:120] if e.description else "",
        "description": e.description,
        "banner_url": e.banner_url,
        "rules": e.rules or "",
        "organizer": e.organizer or "CyberAnzen Organization",
        "category": e.category or "General",
        "difficulty": e.difficulty or "Intermediate",
        "timezone": e.timezone or "UTC",
        "eligibility": e.eligibility or "Open to all verified operatives",
        "visibility": e.visibility or "public",
        "capacity": e.capacity,
        "contact_info": e.contact_info or "support@cyberanzen.io",
        "status": e.status,
        "participation_mode": e.participation_mode,
        "team_size_min": e.team_size_min,
        "team_size_max": e.team_size_max,
        # Team policies
        "team_allow_create": e.team_allow_create,
        "team_allow_join_code": e.team_allow_join_code,
        "team_require_approval": e.team_require_approval,
        "team_allow_member_changes": e.team_allow_member_changes,
        "team_lock_on_start": e.team_lock_on_start,
        "team_allow_ownership_transfer": e.team_allow_ownership_transfer,
        "team_allow_delete_empty": e.team_allow_delete_empty,
        "team_show_members_leaderboard": e.team_show_members_leaderboard,
        # Leaderboard & visibility
        "leaderboard_type": e.leaderboard_type or "individual",
        "leaderboard_visible": e.leaderboard_visible,
        "leaderboard_frozen": e.leaderboard_frozen,
        "scores_visible_during_event": e.scores_visible_during_event,
        "auto_publish_results": e.auto_publish_results,
        "show_solve_times": e.show_solve_times,
        "show_solve_counts": e.show_solve_counts,
        "anonymize_participants": e.anonymize_participants,
        # Dates & constraints
        "start_time": e.start_time,
        "end_time": e.end_time,
        "registration_open": e.registration_open,
        "registration_close": e.registration_close,
        "registration_count": reg_count,
        "clipboard_policy": e.clipboard_policy,
        "scoring_policy": e.scoring_policy,
        "allowed_languages": json.loads(e.allowed_languages) if e.allowed_languages else [],
        # Current user status
        "is_registered": is_registered,
        "registration_id": reg_id,
        "user_selected_mode": selected_mode
    }

@router.get("")
def list_events(
    status: Optional[str] = Query(None, description="Filter by status (active, upcoming, completed, draft)"),
    event_type: Optional[str] = Query(None, description="Filter by event type (dsa, ctf, mcq)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(Event)
    is_admin = current_user and getattr(current_user, "role", "").lower() in ("super_admin", "admin", "event_admin")

    if not is_admin:
        # Exclude draft events from general participants
        query = query.filter(Event.status != EventStatus.DRAFT.value)
        # Exclude restricted/unlisted unless registered
        query = query.filter(Event.visibility.in_(["public", "unlisted"]))

    if status:
        query = query.filter(Event.status == status)
    if event_type:
        query = query.filter(Event.event_type == event_type)

    events = query.order_by(Event.start_time.asc().nulls_last()).all()
    return [serialize_event(e, current_user, db) for e in events]

@router.get("/{event_id}")
def get_event_detail(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    if event_id.isdigit():
        event = db.query(Event).filter(Event.id == int(event_id)).first()
    else:
        event = db.query(Event).filter(Event.slug == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event competition not found.")

    return serialize_event(event, current_user, db)

@router.post("/{event_id}/register")
def register_for_event(
    event_id: int,
    req: Optional[RegisterEventRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event competition not found.")

    if not event.registration_open or event.status == EventStatus.ARCHIVED.value:
        raise HTTPException(status_code=400, detail="Event registration is currently closed.")

    # Check capacity limit
    current_reg_count = db.query(EventRegistration).filter(EventRegistration.event_id == event.id).count()
    if event.capacity and current_reg_count >= event.capacity:
        raise HTTPException(status_code=400, detail="Event has reached maximum participant capacity.")

    # Check existing registration
    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.user_id == current_user.id
    ).first()

    if existing:
        return {"success": True, "message": "Already registered for this competition.", "registration_id": existing.id}

    # Participation mode validation
    mode_to_record = "individual"
    if event.participation_mode == ParticipationMode.TEAM.value:
        mode_to_record = "team"
    elif event.participation_mode == ParticipationMode.MIXED.value:
        mode_to_record = (req.selected_mode if req and req.selected_mode in ("individual", "team") else "individual")

    team_id = current_user.team_membership.team_id if current_user.team_membership else None
    reg = EventRegistration(
        event_id=event.id,
        user_id=current_user.id,
        team_id=team_id,
        selected_mode=mode_to_record,
        registered_at=datetime.now(timezone.utc)
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)

    return {
        "success": True,
        "message": f"Successfully enlisted into '{event.title}'.",
        "registration_id": reg.id,
        "participation_mode": event.participation_mode,
        "selected_mode": reg.selected_mode
    }

@router.delete("/{event_id}/register")
def unregister_from_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()
    if not reg:
        raise HTTPException(status_code=400, detail="You are not registered for this competition.")

    db.delete(reg)
    db.commit()
    return {"success": True, "message": "Successfully withdrawn from event registration."}

# ==============================================================================
# DYNAMIC NAVIGATION & WORKSPACE CONFIG RESOLVER
# ==============================================================================

@router.get("/{event_id}/workspace-config")
def get_event_workspace_config(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Centralized event configuration and dynamic navigation resolver.
    Returns module flags and navigation tabs tailored strictly to event settings.
    """
    if event_id.isdigit():
        event = db.query(Event).filter(Event.id == int(event_id)).first()
    else:
        event = db.query(Event).filter(Event.slug == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event competition not found.")

    ev_type = (event.event_type or "dsa").lower()
    part_mode = (event.participation_mode or "individual").lower()
    is_team_mode = part_mode in ("team", "mixed")

    # Dynamic navigation resolver based on event type and mode
    tabs = [{"id": "overview", "label": "Overview", "icon": "info"}]

    if ev_type == "dsa":
        tabs.extend([
            {"id": "problems", "label": "Problems", "icon": "code"},
            {"id": "submissions", "label": "My Submissions", "icon": "file-text"},
            {"id": "progress", "label": "My Progress", "icon": "bar-chart-2"}
        ])
    elif ev_type == "ctf":
        tabs.extend([
            {"id": "challenges", "label": "Challenges", "icon": "flag"},
            {"id": "labs", "label": "Live Labs", "icon": "cpu"},
            {"id": "submissions", "label": "My Submissions", "icon": "file-text"}
        ])
        if is_team_mode:
            tabs.append({"id": "squad", "label": "My Squad", "icon": "users"})
    elif ev_type == "mcq":
        tabs.extend([
            {"id": "quizzes", "label": "Available Quizzes", "icon": "help-circle"},
            {"id": "attempts", "label": "Attempt History", "icon": "history"},
            {"id": "results", "label": "Results", "icon": "check-circle"}
        ])

    if event.leaderboard_visible:
        tabs.append({"id": "leaderboard", "label": "Leaderboard", "icon": "trophy"})

    tabs.append({"id": "rules", "label": "Rules & Eligibility", "icon": "shield"})

    return {
        "event_id": event.id,
        "event_slug": event.slug,
        "title": event.title,
        "event_type": ev_type,
        "participation_mode": part_mode,
        "team_size_max": event.team_size_max,
        "tabs": tabs,
        "clipboard_policy": event.clipboard_policy,
        "scoring_policy": event.scoring_policy,
        "allowed_languages": json.loads(event.allowed_languages) if event.allowed_languages else ["python3", "cpp", "c"],
        "leaderboard_visible": event.leaderboard_visible,
        "leaderboard_frozen": event.leaderboard_frozen,
        "scores_visible": event.scores_visible_during_event,
        "status": event.status
    }

# ==============================================================================
# EVENT CONTENT RETRIEVAL (ASSIGNED QUESTIONS ONLY)
# ==============================================================================

@router.get("/{event_id}/questions")
def get_event_dsa_questions(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    if event_id.isdigit():
        event = db.query(Event).filter(Event.id == int(event_id)).first()
    else:
        event = db.query(Event).filter(Event.slug == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    # Fetch assigned DSA questions via EventDSAQuestion or fallback to event_id match
    assigned = db.query(EventDSAQuestion).filter(EventDSAQuestion.event_id == event.id).order_by(EventDSAQuestion.order_index.asc()).all()
    if assigned:
        questions = []
        for a in assigned:
            q = a.question
            if q and q.status == "published":
                questions.append({
                    "id": q.id,
                    "slug": q.slug,
                    "title": q.title,
                    "difficulty": q.difficulty,
                    "category": q.category,
                    "points": a.points_override if a.points_override is not None else q.points,
                    "time_limit_ms": q.time_limit_ms,
                    "memory_limit_mb": q.memory_limit_mb,
                    "supported_languages": json.loads(q.supported_languages) if q.supported_languages else ["python3", "cpp", "c"],
                    "order_index": a.order_index,
                    "release_time": a.release_time
                })
        return questions

    # Fallback to direct event_id association
    direct_q = db.query(DSAQuestion).filter(DSAQuestion.event_id == event.id, DSAQuestion.status == "published").all()
    return [
        {
            "id": q.id,
            "slug": q.slug,
            "title": q.title,
            "difficulty": q.difficulty,
            "category": q.category,
            "points": q.points,
            "time_limit_ms": q.time_limit_ms,
            "memory_limit_mb": q.memory_limit_mb,
            "supported_languages": json.loads(q.supported_languages) if q.supported_languages else ["python3", "cpp", "c"]
        }
        for q in direct_q
    ]

@router.get("/{event_id}/challenges")
def get_event_ctf_challenges(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    if event_id.isdigit():
        event = db.query(Event).filter(Event.id == int(event_id)).first()
    else:
        event = db.query(Event).filter(Event.slug == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    assigned = db.query(EventCTFChallenge).filter(EventCTFChallenge.event_id == event.id).order_by(EventCTFChallenge.order_index.asc()).all()
    if assigned:
        challenges = []
        for a in assigned:
            c = a.challenge
            if c and c.status == "published":
                challenges.append({
                    "id": c.id,
                    "slug": c.slug,
                    "title": c.title,
                    "category": c.category,
                    "difficulty": c.difficulty,
                    "points": a.points_override if a.points_override is not None else c.points,
                    "has_docker_lab": c.has_docker_lab,
                    "order_index": a.order_index,
                    "release_time": a.release_time
                })
        return challenges

    direct_c = db.query(CTFChallenge).filter(CTFChallenge.event_id == event.id, CTFChallenge.status == "published").all()
    return [
        {
            "id": c.id,
            "slug": c.slug,
            "title": c.title,
            "category": c.category,
            "difficulty": c.difficulty,
            "points": c.points,
            "has_docker_lab": c.has_docker_lab
        }
        for c in direct_c
    ]

@router.get("/{event_id}/mcqs")
def get_event_mcqs(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    if event_id.isdigit():
        event = db.query(Event).filter(Event.id == int(event_id)).first()
    else:
        event = db.query(Event).filter(Event.slug == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    assigned = db.query(EventMCQQuestion).filter(EventMCQQuestion.event_id == event.id).order_by(EventMCQQuestion.order_index.asc()).all()
    if assigned:
        mcqs = []
        for a in assigned:
            m = a.mcq
            if m and m.status == "published":
                raw_options = json.loads(m.options) if m.options else []
                # Strip is_correct for participants
                sanitized_options = [{"id": opt["id"], "text": opt["text"]} for opt in raw_options]
                mcqs.append({
                    "id": m.id,
                    "title": m.title,
                    "prompt": m.prompt,
                    "question_type": m.question_type,
                    "difficulty": m.difficulty,
                    "category": m.category,
                    "points_positive": a.points_override if a.points_override is not None else m.points_positive,
                    "points_negative": m.points_negative,
                    "time_limit_sec": m.time_limit_sec,
                    "options": sanitized_options
                })
        return mcqs

    direct_m = db.query(MCQQuestion).filter(MCQQuestion.event_id == event.id, MCQQuestion.status == "published").all()
    res = []
    for m in direct_m:
        raw_options = json.loads(m.options) if m.options else []
        sanitized_options = [{"id": opt["id"], "text": opt["text"]} for opt in raw_options]
        res.append({
            "id": m.id,
            "title": m.title,
            "prompt": m.prompt,
            "question_type": m.question_type,
            "difficulty": m.difficulty,
            "category": m.category,
            "points_positive": m.points_positive,
            "points_negative": m.points_negative,
            "time_limit_sec": m.time_limit_sec,
            "options": sanitized_options
        })
    return res

# ==============================================================================
# EVENT LEADERBOARD
# ==============================================================================

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
