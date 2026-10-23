from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
import hashlib
import random
from app.db.session import get_db
from app.db.models import (
    Event, EventRegistration, Team, Solve, User, EventStatus, ParticipationMode, EventType,
    DSAQuestion, CTFChallenge, MCQQuestion, EventDSAQuestion, EventCTFChallenge, EventMCQQuestion,
    Submission, DSATestCase, EventActivityLog
)
from app.api.deps import get_current_user, get_optional_current_user

router = APIRouter(prefix="/events", tags=["Events & Competitions"])

class RegisterEventRequest(BaseModel):
    selected_mode: Optional[str] = "individual"

class LogActivityRequest(BaseModel):
    action: str  # EVENT_ENTERED, PROBLEM_VIEWED, RUN_SAMPLE, SUBMIT_CODE, SOLVED, TAB_SWITCH, SECURITY_ALERT, EVENT_COMPLETED
    entity_type: Optional[str] = "event"  # dsa_question, ctf_challenge, mcq, event, workspace
    entity_id: Optional[str] = None
    entity_title: Optional[str] = None
    status: Optional[str] = "INFO"  # INFO, SUCCESS, WARNING, ERROR, ACCEPTED, WRONG_ANSWER
    details: Optional[str] = None

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
        # Question navigation & experience settings
        "question_navigation_policy": e.question_navigation_policy or "free",
        "question_order_mode": e.question_order_mode or "fixed",
        "show_progress": e.show_progress,
        "enable_mentor": getattr(e, "enable_mentor", True),
        "mark_solved_immediately": e.mark_solved_immediately,
        "revisit_solved_questions": e.revisit_solved_questions,
        "result_publication_time": e.result_publication_time,
        "competition_template_id": e.competition_template_id,
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

def resolve_event(db: Session, event_id: object) -> Optional[Event]:
    if not event_id:
        return None
    raw_id = str(event_id).strip()
    if raw_id.isdigit():
        ev = db.query(Event).filter(Event.id == int(raw_id)).first()
        if ev:
            return ev

    # Exact slug match
    ev = db.query(Event).filter(Event.slug == raw_id).first()
    if ev:
        return ev

    # Normalization & alias resolution (e.g. demo-event1, demo-event-1, demoevent1, demo1 -> demo-1)
    cleaned = raw_id.lower().replace("_", "-")
    for alias in ("demo-event-1", "demo-event1", "demoevent1", "demo1"):
        cleaned = cleaned.replace(alias, "demo-1")
    ev = db.query(Event).filter(Event.slug == cleaned).first()
    if ev:
        return ev

    # Substring / title match fallback
    return db.query(Event).filter(Event.title.ilike(f"%{raw_id.replace('-', ' ')}%")).first()

@router.get("/{event_id}")
def get_event_detail(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    event = resolve_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event competition not found.")

    return serialize_event(event, current_user, db)

@router.post("/{event_id}/register")
def register_for_event(
    event_id: str,
    req: Optional[RegisterEventRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = resolve_event(db, event_id)
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
    event = resolve_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event competition not found.")

    ev_type = (event.event_type or "ctf").lower()
    part_mode = (event.participation_mode or "individual").lower()
    is_team_mode = part_mode in ("team", "mixed", "any")

    has_dsa = "dsa" in ev_type or ev_type in ("combined", "all")
    has_ctf = "ctf" in ev_type or ev_type in ("combined", "all")
    has_mcq = "mcq" in ev_type or ev_type in ("combined", "all")

    # Dynamic navigation resolver based on event type and mode
    tabs = [{"id": "overview", "label": "Overview", "icon": "info"}]

    if has_ctf:
        tabs.append({"id": "challenges", "label": "CTF Challenges", "icon": "flag"})
        tabs.append({"id": "labs", "label": "Live Labs", "icon": "cpu"})

    if has_dsa:
        tabs.append({"id": "problems", "label": "DSA Problems", "icon": "code"})

    if has_mcq:
        tabs.append({"id": "quizzes", "label": "Quizzes & MCQs", "icon": "help-circle"})

    if has_dsa or has_ctf:
        tabs.append({"id": "submissions", "label": "My Submissions", "icon": "file-text"})

    if has_mcq and not (has_dsa or has_ctf):
        tabs.append({"id": "attempts", "label": "Attempt History", "icon": "history"})
        tabs.append({"id": "results", "label": "Results", "icon": "check-circle"})

    if is_team_mode:
        tabs.append({"id": "squad", "label": "My Squad", "icon": "users"})

    tabs.append({"id": "progress", "label": "My Progress", "icon": "bar-chart-2"})

    if event.leaderboard_visible:
        tabs.append({"id": "leaderboard", "label": "Leaderboard", "icon": "trophy"})

    tabs.append({"id": "rules", "label": "Rules & Eligibility", "icon": "shield"})

    return {
        "event_id": event.id,
        "event_slug": event.slug,
        "title": event.title,
        "event_type": ev_type,
        "has_dsa": has_dsa,
        "has_ctf": has_ctf,
        "has_mcq": has_mcq,
        "participation_mode": part_mode,
        "team_size_max": event.team_size_max,
        "banner_url": event.banner_url,
        "tabs": tabs,
        "clipboard_policy": event.clipboard_policy,
        "allow_copy_paste": event.clipboard_policy in ("allow", "allowed"),
        "scoring_policy": event.scoring_policy,
        "allowed_languages": json.loads(event.allowed_languages) if event.allowed_languages else ["python3", "cpp", "c"],
        "question_navigation_policy": event.question_navigation_policy or "free",
        "question_order_mode": event.question_order_mode or "fixed",
        "show_progress": event.show_progress,
        "enable_mentor": getattr(event, "enable_mentor", True),
        "mark_solved_immediately": event.mark_solved_immediately,
        "revisit_solved_questions": event.revisit_solved_questions,
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
    event = resolve_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    # 1. Fetch solved question IDs for current user/team in this event
    solved_qids = set()
    if current_user:
        user_solves = db.query(Solve.challenge_id).filter(
            Solve.event_id == event.id,
            Solve.challenge_type == "dsa",
            Solve.user_id == current_user.id
        ).all()
        solved_qids = {int(s[0]) for s in user_solves if str(s[0]).isdigit()}

    # 2. Fetch assigned DSA questions via EventDSAQuestion or fallback
    assigned = db.query(EventDSAQuestion).filter(
        EventDSAQuestion.event_id == event.id
    ).order_by(EventDSAQuestion.order_index.asc()).all()

    raw_questions = []
    if assigned:
        for a in assigned:
            q = a.question
            if q and q.status == "published":
                samples = db.query(DSATestCase).filter(
                    DSATestCase.question_id == q.id,
                    DSATestCase.test_type == "public_sample"
                ).order_by(DSATestCase.test_index.asc()).all()

                raw_questions.append({
                    "id": q.id,
                    "slug": q.slug,
                    "title": q.title,
                    "statement": q.statement,
                    "input_spec": q.input_spec,
                    "output_spec": q.output_spec,
                    "constraints": q.constraints,
                    "difficulty": q.difficulty,
                    "category": q.category,
                    "points": a.points_override if a.points_override is not None else q.points,
                    "time_limit_ms": q.time_limit_ms,
                    "memory_limit_mb": q.memory_limit_mb,
                    "supported_languages": json.loads(q.supported_languages) if q.supported_languages else ["python3", "cpp", "c"],
                    "starter_code": {
                        "python3": q.starter_py or "# Write Python 3 solution here\n",
                        "cpp": q.starter_cpp or "// Write C++ solution here\n",
                        "c": q.starter_c or "/* Write C solution here */\n"
                    },
                    "sample_tests": [
                        {"id": s.id, "input": s.input_data, "output": s.expected_output}
                        for s in samples
                    ],
                    "order_index": a.order_index,
                    "allow_copy_paste": bool(q.allow_copy_paste),
                    "enable_mentor": bool(getattr(q, "enable_mentor", True))
                })
    else:
        direct_q = db.query(DSAQuestion).filter(DSAQuestion.event_id == event.id, DSAQuestion.status == "published").all()
        for idx, q in enumerate(direct_q):
            samples = db.query(DSATestCase).filter(
                DSATestCase.question_id == q.id,
                DSATestCase.test_type == "public_sample"
            ).order_by(DSATestCase.test_index.asc()).all()
            raw_questions.append({
                "id": q.id,
                "slug": q.slug,
                "title": q.title,
                "statement": q.statement,
                "input_spec": q.input_spec,
                "output_spec": q.output_spec,
                "constraints": q.constraints,
                "difficulty": q.difficulty,
                "category": q.category,
                "points": q.points,
                "time_limit_ms": q.time_limit_ms,
                "memory_limit_mb": q.memory_limit_mb,
                "supported_languages": json.loads(q.supported_languages) if q.supported_languages else ["python3", "cpp", "c"],
                "starter_code": {
                    "python3": q.starter_py or "# Write Python 3 solution here\n",
                    "cpp": q.starter_cpp or "// Write C++ solution here\n",
                    "c": q.starter_c or "/* Write C solution here */\n"
                },
                "sample_tests": [
                    {"id": s.id, "input": s.input_data, "output": s.expected_output}
                    for s in samples
                ],
                "order_index": idx,
                "allow_copy_paste": bool(q.allow_copy_paste),
                "enable_mentor": bool(getattr(q, "enable_mentor", True))
            })

    # 3. Deterministic Stable Randomization per participant or team if configured
    if event.question_order_mode == "random_participant" and current_user:
        seed = int(hashlib.sha256(f"ev_{event.id}_user_{current_user.id}".encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        rng.shuffle(raw_questions)
    elif event.question_order_mode == "random_team" and current_user and current_user.team_membership:
        seed = int(hashlib.sha256(f"ev_{event.id}_team_{current_user.team_membership.team_id}".encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        rng.shuffle(raw_questions)

    # 4. Navigation policy resolution (Free vs Sequential vs Unlock)
    questions = []
    nav_policy = event.question_navigation_policy or "free"

    for idx, q in enumerate(raw_questions):
        q_copy = dict(q)
        q_copy["display_number"] = f"Q{idx + 1}"
        is_solved = q["id"] in solved_qids

        if is_solved:
            q_copy["status"] = "solved"
            q_copy["is_locked"] = not event.revisit_solved_questions
            q_copy["lock_reason"] = "Challenge completed (revisiting locked by event rules)" if q_copy["is_locked"] else ""
        else:
            if nav_policy == "sequential":
                if idx == 0:
                    q_copy["status"] = "current"
                    q_copy["is_locked"] = False
                    q_copy["lock_reason"] = ""
                else:
                    prev_solved = raw_questions[idx - 1]["id"] in solved_qids
                    if prev_solved:
                        q_copy["status"] = "available"
                        q_copy["is_locked"] = False
                        q_copy["lock_reason"] = ""
                    else:
                        q_copy["status"] = "locked"
                        q_copy["is_locked"] = True
                        q_copy["lock_reason"] = f"Locked: Solve Q{idx} ({raw_questions[idx - 1]['title']}) first."
            else:
                q_copy["status"] = "available"
                q_copy["is_locked"] = False
                q_copy["lock_reason"] = ""

        questions.append(q_copy)

    return questions

@router.get("/{event_id}/challenges")
def get_event_ctf_challenges(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    event = resolve_event(db, event_id)
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
    event = resolve_event(db, event_id)
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
def get_event_leaderboard(event_id: str, db: Session = Depends(get_db)):
    event = resolve_event(db, event_id)
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

@router.get("/{event_id}/submissions")
def get_event_submissions(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = resolve_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    subs = db.query(Submission).filter(
        Submission.event_id == event.id,
        Submission.user_id == current_user.id
    ).order_by(Submission.created_at.desc()).all()

    results = []
    for s in subs:
        q = db.query(DSAQuestion).filter(DSAQuestion.id == int(s.target_id)).first() if s.target_id and s.target_id.isdigit() else None
        results.append({
            "id": s.id,
            "target_id": s.target_id,
            "question_title": q.title if q else f"Target #{s.target_id}",
            "language": s.language,
            "verdict": s.verdict,
            "execution_time_ms": s.execution_time_ms,
            "memory_kb": s.memory_used_kb,
            "points_awarded": s.score,
            "created_at": s.created_at
        })
    return results

# ==============================================================================
# PARTICIPANT AUDIT TRAIL & EVENT USER JOURNEY LOGGING
# ==============================================================================

@router.post("/{event_id}/activity")
def log_event_activity(
    event_id: str,
    req: LogActivityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = resolve_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    now = datetime.now(timezone.utc)

    # Dedup consecutive duplicate views within 10 seconds to avoid flooding
    if req.action in ("PROBLEM_VIEWED", "EVENT_ENTERED", "TAB_SWITCH"):
        recent = db.query(EventActivityLog).filter(
            EventActivityLog.event_id == event.id,
            EventActivityLog.user_id == current_user.id,
            EventActivityLog.action == req.action,
            EventActivityLog.entity_id == (str(req.entity_id) if req.entity_id else None)
        ).order_by(EventActivityLog.id.desc()).first()
        if recent and recent.created_at:
            recent_time = recent.created_at.replace(tzinfo=timezone.utc) if recent.created_at.tzinfo is None else recent.created_at
            if (now - recent_time).total_seconds() < 10:
                return {"status": "DEDUPED", "id": recent.id, "message": "Recent duplicate activity suppressed."}

    activity = EventActivityLog(
        event_id=event.id,
        user_id=current_user.id,
        username=current_user.username,
        action=req.action,
        entity_type=req.entity_type,
        entity_id=str(req.entity_id) if req.entity_id else None,
        entity_title=req.entity_title,
        status=req.status or "INFO",
        details=req.details,
        created_at=now
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    return {"status": "LOGGED", "id": activity.id, "created_at": activity.created_at}

@router.get("/{event_id}/my-activity")
def get_my_event_activity(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = resolve_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    logs = db.query(EventActivityLog).filter(
        EventActivityLog.event_id == event.id,
        EventActivityLog.user_id == current_user.id
    ).order_by(EventActivityLog.created_at.asc()).all()

    first_log = logs[0] if logs else None
    start_time = first_log.created_at if first_log else None

    def calc_elapsed(t1, t0):
        if not t1 or not t0: return 0
        t1_u = t1.replace(tzinfo=timezone.utc) if t1.tzinfo is None else t1
        t0_u = t0.replace(tzinfo=timezone.utc) if t0.tzinfo is None else t0
        return int((t1_u - t0_u).total_seconds())

    return [
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "entity_title": l.entity_title,
            "status": l.status,
            "details": l.details,
            "timestamp": l.created_at.isoformat(),
            "time_display": l.created_at.strftime("%H:%M:%S"),
            "elapsed_seconds": calc_elapsed(l.created_at, start_time)
        }
        for l in logs
    ]

@router.get("/{event_id}/participant-activity")
def get_participant_activity_admin(
    event_id: str,
    user_id: Optional[int] = Query(None),
    limit: int = Query(250),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_admin = getattr(current_user, "role", "").lower() in ("super_admin", "admin", "event_admin", "auditor")
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only platform administrators and auditors can inspect participant audit logs.")

    event = resolve_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    q = db.query(EventActivityLog).filter(EventActivityLog.event_id == event.id)
    if user_id:
        q = q.filter(EventActivityLog.user_id == user_id)

    logs = q.order_by(EventActivityLog.created_at.desc()).limit(limit).all()

    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "username": l.username,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "entity_title": l.entity_title,
            "status": l.status,
            "details": l.details,
            "timestamp": l.created_at.isoformat(),
            "time_display": l.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for l in logs
    ]

@router.post("/{event_id}/complete")
def complete_event_session(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = resolve_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    solves = db.query(Solve).filter(
        Solve.event_id == event.id,
        Solve.user_id == current_user.id
    ).all()

    solves_count = len(solves)
    points_earned = sum(s.points_awarded for s in solves)

    log = EventActivityLog(
        event_id=event.id,
        user_id=current_user.id,
        username=current_user.username,
        action="EVENT_COMPLETED",
        entity_type="event",
        entity_id=str(event.id),
        entity_title=event.title,
        status="SUCCESS",
        details=f"Candidate finished tournament session. Total challenges solved: {solves_count}. Points earned: {points_earned}.",
        created_at=datetime.now(timezone.utc)
    )
    db.add(log)
    db.commit()

    return {
        "status": "COMPLETED",
        "event_id": event.id,
        "solves_count": solves_count,
        "points_earned": points_earned,
        "completed_at": log.created_at
    }

