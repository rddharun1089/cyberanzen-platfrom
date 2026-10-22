import json
import secrets
import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.db.models import (
    User, UserRole, DSAQuestion, DSATestCase, MCQQuestion, CTFChallenge,
    DynamicTemplate, DockerLabInstance, AuditLog, SecurityIncident, Team,
    TeamMembership, TeamMemberRole, TeamSolvedCase, Submission, Solve, ChallengeStatus, FlagType, LabStatus,
    Event, EventStatus, EventType, ParticipationMode, EventDSAQuestion, EventCTFChallenge, EventMCQQuestion,
    EventRegistration, QuestionImportJob, DynamicFlag, MCQAttempt
)
from app.api.deps import get_current_admin, get_current_super_admin, get_current_event_admin
from app.judge.worker import evaluate_submission
from app.services.dynamic_generator import DynamicGeneratorService
from app.services.lab_service import DockerLabService
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/admin", tags=["Administration Control Center"])

# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================

class DSACreateRequest(BaseModel):
    title: str
    slug: Optional[str] = None
    statement: str
    input_spec: str
    output_spec: str
    constraints: Optional[str] = ""
    difficulty: Optional[str] = "Beginner"
    category: Optional[str] = "Data Structures & Algorithms"
    tags: Optional[List[str]] = []
    points: Optional[int] = 100
    time_limit_ms: Optional[int] = 2000
    memory_limit_mb: Optional[int] = 256
    supported_languages: Optional[List[str]] = ["python3", "cpp", "c"]
    starter_py: Optional[str] = ""
    starter_cpp: Optional[str] = ""
    starter_c: Optional[str] = ""
    reference_solution: Optional[str] = ""
    status: Optional[str] = "published"
    allow_copy_paste: Optional[bool] = False

class DSATestCaseRequest(BaseModel):
    test_type: str  # public_sample | hidden_test
    input_data: str
    expected_output: str
    points: Optional[int] = 0

class MCQCreateRequest(BaseModel):
    title: str
    prompt: str
    question_type: Optional[str] = "single_choice"
    difficulty: Optional[str] = "Beginner"
    category: Optional[str] = "Cybersecurity"
    tags: Optional[List[str]] = []
    options: List[Dict[str, Any]]  # [{"id": 1, "text": "...", "is_correct": true, "explanation": "..."}]
    points_positive: Optional[int] = 10
    points_negative: Optional[int] = 0
    time_limit_sec: Optional[int] = 60
    explanation: Optional[str] = ""
    status: Optional[str] = "published"

class CTFCreateRequest(BaseModel):
    title: str
    slug: Optional[str] = None
    description: str
    category: Optional[str] = "web"
    difficulty: Optional[str] = "Beginner"
    points: Optional[int] = 100
    flag_type: Optional[str] = "static"
    static_flag: Optional[str] = None
    hints: Optional[List[Dict[str, Any]]] = []
    files: Optional[List[Dict[str, Any]]] = []
    has_docker_lab: Optional[bool] = False
    docker_image: Optional[str] = None
    lab_timeout_min: Optional[int] = 60
    lab_port_exposed: Optional[int] = 80
    status: Optional[str] = "published"

class DynamicTemplateRequest(BaseModel):
    name: str
    category: Optional[str] = "DSA"
    statement_template: str
    parameter_schema: Dict[str, Any]
    generator_script: str
    reference_solution: str

class GenerateInstanceRequest(BaseModel):
    seed: int

class DeleteUserConfirmation(BaseModel):
    confirm_username: str

class RoleUpdateRequest(BaseModel):
    role: str

class BatchAntiCheatRequest(BaseModel):
    category: Optional[str] = None
    allow_copy_paste: bool

class EventCreateRequest(BaseModel):
    title: str
    slug: Optional[str] = None
    event_type: str = "dsa"  # dsa | ctf | mcq
    short_description: Optional[str] = ""
    description: str
    banner_url: Optional[str] = ""
    rules: Optional[str] = ""
    organizer: Optional[str] = "CyberAnzen Organization"
    category: Optional[str] = "General"
    difficulty: Optional[str] = "Intermediate"
    timezone: Optional[str] = "UTC"
    eligibility: Optional[str] = "Open to all verified operatives"
    visibility: Optional[str] = "public"
    capacity: Optional[int] = None
    contact_info: Optional[str] = "support@cyberanzen.io"
    status: Optional[str] = "draft"
    participation_mode: Optional[str] = "team"
    team_size_min: Optional[int] = 1
    team_size_max: Optional[int] = 4
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    registration_open: Optional[bool] = True
    registration_close: Optional[datetime] = None
    clipboard_policy: Optional[str] = "restricted"
    scoring_policy: Optional[str] = "standard"
    allowed_languages: Optional[List[str]] = ["python3", "cpp", "c"]
    # Team policies
    team_allow_create: Optional[bool] = True
    team_allow_join_code: Optional[bool] = True
    team_require_approval: Optional[bool] = False
    team_allow_member_changes: Optional[bool] = True
    team_lock_on_start: Optional[bool] = True
    team_allow_ownership_transfer: Optional[bool] = True
    team_allow_delete_empty: Optional[bool] = True
    team_show_members_leaderboard: Optional[bool] = True
    # Leaderboard & visibility
    leaderboard_type: Optional[str] = "individual"
    leaderboard_visible: Optional[bool] = True
    leaderboard_frozen: Optional[bool] = False
    scores_visible_during_event: Optional[bool] = True
    auto_publish_results: Optional[bool] = True
    show_solve_times: Optional[bool] = True
    show_solve_counts: Optional[bool] = True
    anonymize_participants: Optional[bool] = False
    # Initial question assignment
    question_ids: Optional[List[int]] = []

class EventAssignQuestionsRequest(BaseModel):
    question_ids: List[int]
    points_overrides: Optional[Dict[str, int]] = {}

class EventStatusUpdateRequest(BaseModel):
    status: str

# ==============================================================================
# 0. EVENT BUILDER & LIFECYCLE MANAGEMENT
# ==============================================================================

@router.get("/events")
def admin_list_events(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_event_admin)
):
    events = db.query(Event).order_by(Event.id.desc()).all()
    result = []
    for e in events:
        q_count = 0
        if e.event_type == "dsa":
            q_count = len(e.dsa_questions) if e.dsa_questions else db.query(DSAQuestion).filter(DSAQuestion.event_id == e.id).count()
        elif e.event_type == "ctf":
            q_count = len(e.ctf_challenges) if e.ctf_challenges else db.query(CTFChallenge).filter(CTFChallenge.event_id == e.id).count()
        elif e.event_type == "mcq":
            q_count = len(e.mcq_questions) if e.mcq_questions else db.query(MCQQuestion).filter(MCQQuestion.event_id == e.id).count()

        reg_count = len(e.registrations) if e.registrations else 0
        team_count = len(e.teams) if e.teams else 0

        result.append({
            "id": e.id,
            "slug": e.slug,
            "title": e.title,
            "event_type": e.event_type,
            "status": e.status,
            "participation_mode": e.participation_mode,
            "team_size_max": e.team_size_max,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "registration_open": e.registration_open,
            "question_count": q_count,
            "registration_count": reg_count,
            "team_count": team_count,
            "visibility": e.visibility,
            "created_at": e.created_at
        })
    return result

@router.post("/events")
def admin_create_event(
    req: EventCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_event_admin)
):
    # Validate date range if both provided
    if req.start_time and req.end_time and req.start_time >= req.end_time:
        raise HTTPException(status_code=400, detail="Event start time must precede end time.")

    slug = req.slug or req.title.lower().replace(" ", "-").replace("/", "-")
    existing = db.query(Event).filter(Event.slug == slug).first()
    if existing:
        slug = f"{slug}-{secrets.token_hex(3)}"

    new_event = Event(
        slug=slug,
        title=req.title.strip(),
        event_type=req.event_type.lower(),
        short_description=req.short_description or "",
        description=req.description,
        banner_url=req.banner_url or "",
        rules=req.rules or "",
        organizer=req.organizer or "CyberAnzen Organization",
        category=req.category or "General",
        difficulty=req.difficulty or "Intermediate",
        timezone=req.timezone or "UTC",
        eligibility=req.eligibility or "Open to all verified operatives",
        visibility=req.visibility or "public",
        capacity=req.capacity,
        contact_info=req.contact_info or "support@cyberanzen.io",
        status=req.status or EventStatus.DRAFT.value,
        participation_mode=req.participation_mode or ParticipationMode.TEAM.value,
        team_size_min=max(1, req.team_size_min or 1),
        team_size_max=max(1, min(10, req.team_size_max or 4)),
        team_allow_create=req.team_allow_create if req.team_allow_create is not None else True,
        team_allow_join_code=req.team_allow_join_code if req.team_allow_join_code is not None else True,
        team_require_approval=req.team_require_approval or False,
        team_allow_member_changes=req.team_allow_member_changes if req.team_allow_member_changes is not None else True,
        team_lock_on_start=req.team_lock_on_start if req.team_lock_on_start is not None else True,
        team_allow_ownership_transfer=req.team_allow_ownership_transfer if req.team_allow_ownership_transfer is not None else True,
        team_allow_delete_empty=req.team_allow_delete_empty if req.team_allow_delete_empty is not None else True,
        team_show_members_leaderboard=req.team_show_members_leaderboard if req.team_show_members_leaderboard is not None else True,
        leaderboard_type=req.leaderboard_type or "individual",
        leaderboard_visible=req.leaderboard_visible if req.leaderboard_visible is not None else True,
        leaderboard_frozen=req.leaderboard_frozen or False,
        scores_visible_during_event=req.scores_visible_during_event if req.scores_visible_during_event is not None else True,
        auto_publish_results=req.auto_publish_results if req.auto_publish_results is not None else True,
        show_solve_times=req.show_solve_times if req.show_solve_times is not None else True,
        show_solve_counts=req.show_solve_counts if req.show_solve_counts is not None else True,
        anonymize_participants=req.anonymize_participants or False,
        start_time=req.start_time,
        end_time=req.end_time,
        registration_open=req.registration_open if req.registration_open is not None else True,
        registration_close=req.registration_close,
        clipboard_policy=req.clipboard_policy or "restricted",
        scoring_policy=req.scoring_policy or "standard",
        allowed_languages=json.dumps(req.allowed_languages or ["python3", "cpp", "c"]),
        created_by_id=admin.id
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    # Initial question assignments if provided
    if req.question_ids:
        for idx, qid in enumerate(req.question_ids):
            if new_event.event_type == "dsa":
                db.add(EventDSAQuestion(event_id=new_event.id, question_id=qid, order_index=idx))
            elif new_event.event_type == "ctf":
                db.add(EventCTFChallenge(event_id=new_event.id, challenge_id=qid, order_index=idx))
            elif new_event.event_type == "mcq":
                db.add(EventMCQQuestion(event_id=new_event.id, mcq_id=qid, order_index=idx))
        db.commit()

    db.add(AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="CREATE_EVENT",
        entity_type="EVENT",
        entity_id=str(new_event.id),
        details=json.dumps({"title": new_event.title, "event_type": new_event.event_type, "status": new_event.status})
    ))
    db.commit()

    return {"success": True, "id": new_event.id, "event_id": new_event.id, "slug": new_event.slug, "status": new_event.status}

@router.get("/events/{event_id}")
def admin_get_event(
    event_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_event_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    assigned_questions = []
    ev_type = (event.event_type or "").lower()
    has_dsa = "dsa" in ev_type or ev_type in ("combined", "all")
    has_ctf = "ctf" in ev_type or ev_type in ("combined", "all")
    has_mcq = "mcq" in ev_type or ev_type in ("combined", "all")

    if has_dsa:
        assigned = db.query(EventDSAQuestion).filter(EventDSAQuestion.event_id == event.id).order_by(EventDSAQuestion.order_index.asc()).all()
        for a in assigned:
            if a.question:
                assigned_questions.append({
                    "id": a.question.id,
                    "title": a.question.title,
                    "domain": "DSA",
                    "difficulty": a.question.difficulty,
                    "points": a.points_override or a.question.points,
                    "order_index": a.order_index
                })
    if has_ctf:
        assigned = db.query(EventCTFChallenge).filter(EventCTFChallenge.event_id == event.id).order_by(EventCTFChallenge.order_index.asc()).all()
        for a in assigned:
            if a.challenge:
                assigned_questions.append({
                    "id": a.challenge.id,
                    "title": a.challenge.title,
                    "domain": "CTF",
                    "category": a.challenge.category,
                    "points": a.points_override or a.challenge.points,
                    "order_index": a.order_index
                })
    if has_mcq:
        assigned = db.query(EventMCQQuestion).filter(EventMCQQuestion.event_id == event.id).order_by(EventMCQQuestion.order_index.asc()).all()
        for a in assigned:
            if a.mcq:
                assigned_questions.append({
                    "id": a.mcq.id,
                    "title": a.mcq.title,
                    "domain": "MCQ",
                    "category": a.mcq.category,
                    "points": a.points_override or a.mcq.points_positive,
                    "order_index": a.order_index
                })

    return {
        "id": event.id,
        "slug": event.slug,
        "title": event.title,
        "event_type": event.event_type,
        "short_description": event.short_description,
        "description": event.description,
        "banner_url": event.banner_url,
        "rules": event.rules,
        "organizer": event.organizer,
        "category": event.category,
        "difficulty": event.difficulty,
        "timezone": event.timezone,
        "eligibility": event.eligibility,
        "visibility": event.visibility,
        "capacity": event.capacity,
        "contact_info": event.contact_info,
        "status": event.status,
        "participation_mode": event.participation_mode,
        "team_size_min": event.team_size_min,
        "team_size_max": event.team_size_max,
        "team_allow_create": event.team_allow_create,
        "team_allow_join_code": event.team_allow_join_code,
        "team_require_approval": event.team_require_approval,
        "team_allow_member_changes": event.team_allow_member_changes,
        "team_lock_on_start": event.team_lock_on_start,
        "team_allow_ownership_transfer": event.team_allow_ownership_transfer,
        "team_allow_delete_empty": event.team_allow_delete_empty,
        "team_show_members_leaderboard": event.team_show_members_leaderboard,
        "leaderboard_type": event.leaderboard_type,
        "leaderboard_visible": event.leaderboard_visible,
        "leaderboard_frozen": event.leaderboard_frozen,
        "scores_visible_during_event": event.scores_visible_during_event,
        "auto_publish_results": event.auto_publish_results,
        "show_solve_times": event.show_solve_times,
        "show_solve_counts": event.show_solve_counts,
        "anonymize_participants": event.anonymize_participants,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "registration_open": event.registration_open,
        "registration_close": event.registration_close,
        "clipboard_policy": event.clipboard_policy,
        "scoring_policy": event.scoring_policy,
        "allowed_languages": json.loads(event.allowed_languages) if event.allowed_languages else ["python3", "cpp", "c"],
        "assigned_questions": assigned_questions,
        "registration_count": len(event.registrations) if event.registrations else 0,
        "team_count": len(event.teams) if event.teams else 0
    }

@router.post("/events/{event_id}/assign-questions")
def admin_assign_event_questions(
    event_id: int,
    req: EventAssignQuestionsRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_event_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    # Remove prior assignments and assign to appropriate domain(s)
    ev_type = (event.event_type or "").lower()
    has_dsa = "dsa" in ev_type or ev_type in ("combined", "all")
    has_ctf = "ctf" in ev_type or ev_type in ("combined", "all")
    has_mcq = "mcq" in ev_type or ev_type in ("combined", "all")

    if has_dsa:
        db.query(EventDSAQuestion).filter(EventDSAQuestion.event_id == event.id).delete()
        for idx, qid in enumerate(req.question_ids):
            if db.query(DSAQuestion).filter(DSAQuestion.id == qid).first():
                override = req.points_overrides.get(str(qid))
                db.add(EventDSAQuestion(event_id=event.id, question_id=qid, points_override=override, order_index=idx))

    if has_ctf:
        db.query(EventCTFChallenge).filter(EventCTFChallenge.event_id == event.id).delete()
        for idx, cid in enumerate(req.question_ids):
            if db.query(CTFChallenge).filter(CTFChallenge.id == cid).first():
                override = req.points_overrides.get(str(cid))
                db.add(EventCTFChallenge(event_id=event.id, challenge_id=cid, points_override=override, order_index=idx))

    if has_mcq:
        db.query(EventMCQQuestion).filter(EventMCQQuestion.event_id == event.id).delete()
        for idx, mid in enumerate(req.question_ids):
            if db.query(MCQQuestion).filter(MCQQuestion.id == mid).first():
                override = req.points_overrides.get(str(mid))
                db.add(EventMCQQuestion(event_id=event.id, mcq_id=mid, points_override=override, order_index=idx))

    db.add(AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="ASSIGN_EVENT_QUESTIONS",
        entity_type="EVENT",
        entity_id=str(event.id),
        details=json.dumps({"question_ids": req.question_ids, "event_type": event.event_type})
    ))
    db.commit()

    return {"success": True, "message": f"Successfully assigned {len(req.question_ids)} questions to event.", "event_id": event.id}

@router.post("/events/{event_id}/status")
def admin_update_event_status(
    event_id: int,
    req: EventStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_event_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    valid_statuses = [
        EventStatus.DRAFT.value, EventStatus.PUBLISHED.value,
        EventStatus.REGISTRATION_OPEN.value, EventStatus.LIVE.value,
        EventStatus.ENDED.value, EventStatus.RESULTS_PUBLISHED.value,
        EventStatus.ARCHIVED.value, EventStatus.ACTIVE.value, EventStatus.COMPLETED.value
    ]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid event status '{req.status}'. Permitted: {valid_statuses}")

    old_status = event.status
    event.status = req.status
    if req.status in (EventStatus.REGISTRATION_OPEN.value, EventStatus.LIVE.value, EventStatus.ACTIVE.value):
        event.registration_open = True
    elif req.status in (EventStatus.ENDED.value, EventStatus.ARCHIVED.value):
        event.registration_open = False

    db.add(AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="UPDATE_EVENT_STATUS",
        entity_type="EVENT",
        entity_id=str(event.id),
        details=json.dumps({"old_status": old_status, "new_status": req.status})
    ))
    db.commit()

    return {"success": True, "event_id": event.id, "new_status": event.status}

@router.delete("/events/{event_id}")
def admin_delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_super_admin)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    event_title = event.title
    db.delete(event)
    db.add(AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="DELETE_EVENT",
        entity_type="EVENT",
        entity_id=str(event_id),
        details=json.dumps({"deleted_title": event_title})
    ))
    db.commit()

    return {"success": True, "message": f"Event '{event_title}' permanently deleted."}

@router.post("/events/{event_id}/banner")
async def admin_upload_event_banner(
    event_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if event_id.isdigit():
        event = db.query(Event).filter(Event.id == int(event_id)).first()
    else:
        event = db.query(Event).filter(Event.slug == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid banner image format. Allowed: JPG, PNG, WebP.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Banner image exceeds 10MB limit.")

    ext = ".png"
    if "jpeg" in file.content_type or "jpg" in file.content_type:
        ext = ".jpg"
    elif "webp" in file.content_type:
        ext = ".webp"

    filename = f"banner_{event.id}_{secrets.token_hex(6)}{ext}"
    uploads_dir = os.path.abspath(os.path.join(settings.BASE_DIR, "uploads", "banners"))
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    frontend_dist_banners = os.path.abspath(os.path.join(settings.BASE_DIR, "frontend", "dist", "uploads", "banners"))
    if os.path.exists(os.path.join(settings.BASE_DIR, "frontend", "dist")):
        os.makedirs(frontend_dist_banners, exist_ok=True)
        with open(os.path.join(frontend_dist_banners, filename), "wb") as f:
            f.write(content)

    event.banner_url = f"/uploads/banners/{filename}"
    db.commit()

    log = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="UPDATE_EVENT_BANNER",
        entity_type="EVENT",
        entity_id=str(event.id),
        details=f"Uploaded banner for event #{event.id}: {event.banner_url}"
    )
    db.add(log)
    db.commit()

    return {"success": True, "banner_url": event.banner_url}

@router.delete("/events/{event_id}/banner")
def admin_remove_event_banner(
    event_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if event_id.isdigit():
        event = db.query(Event).filter(Event.id == int(event_id)).first()
    else:
        event = db.query(Event).filter(Event.slug == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    event.banner_url = None
    db.commit()

    log = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="REMOVE_EVENT_BANNER",
        entity_type="EVENT",
        entity_id=str(event.id),
        details=f"Removed banner for event #{event.id}"
    )
    db.add(log)
    db.commit()

    return {"success": True, "banner_url": None}

# ==============================================================================
# 1. DSA QUESTION STUDIO
# ==============================================================================

@router.post("/dsa")
def admin_create_dsa(req: DSACreateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    slug = req.slug or req.title.lower().replace(" ", "-").replace("/", "-")
    existing = db.query(DSAQuestion).filter(DSAQuestion.slug == slug).first()
    if existing:
        slug = f"{slug}-{secrets.token_hex(3)}"

    q = DSAQuestion(
        slug=slug,
        title=req.title,
        statement=req.statement,
        input_spec=req.input_spec,
        output_spec=req.output_spec,
        constraints=req.constraints,
        difficulty=req.difficulty or "Beginner",
        category=req.category or "Data Structures & Algorithms",
        tags=json.dumps(req.tags or []),
        points=req.points or 100,
        time_limit_ms=req.time_limit_ms or 2000,
        memory_limit_mb=req.memory_limit_mb or 256,
        supported_languages=json.dumps(req.supported_languages or ["python3", "cpp", "c"]),
        starter_py=req.starter_py,
        starter_cpp=req.starter_cpp,
        starter_c=req.starter_c,
        reference_solution=req.reference_solution,
        status=req.status or ChallengeStatus.PUBLISHED.value,
        allow_copy_paste=bool(req.allow_copy_paste),
        created_by_id=admin.id
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    log = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="CREATE_DSA_QUESTION",
        entity_type="DSA",
        entity_id=str(q.id),
        details=f"Created DSA question: {q.title} ({q.slug})"
    )
    db.add(log)
    db.commit()

    return {"success": True, "id": q.id, "question_id": q.id, "slug": q.slug, "title": q.title}

@router.get("/dsa")
def admin_list_dsa(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    questions = db.query(DSAQuestion).order_by(DSAQuestion.id.asc()).all()
    return [
        {
            "id": q.id,
            "slug": q.slug,
            "title": q.title,
            "category": q.category,
            "difficulty": q.difficulty,
            "points": q.points,
            "status": q.status,
            "allow_copy_paste": q.allow_copy_paste,
            "judge_enabled": q.judge_enabled,
            "test_count": len(q.test_cases)
        }
        for q in questions
    ]

@router.get("/dsa/{id}")
def admin_get_dsa_detail(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    q = db.query(DSAQuestion).filter(DSAQuestion.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    return {
        "id": q.id,
        "slug": q.slug,
        "title": q.title,
        "statement": q.statement,
        "input_spec": q.input_spec,
        "output_spec": q.output_spec,
        "constraints": q.constraints,
        "category": q.category,
        "difficulty": q.difficulty,
        "points": q.points,
        "time_limit_ms": q.time_limit_ms,
        "memory_limit_mb": q.memory_limit_mb,
        "supported_languages": json.loads(q.supported_languages) if q.supported_languages else [],
        "starter_py": q.starter_py,
        "starter_cpp": q.starter_cpp,
        "starter_c": q.starter_c,
        "reference_solution": q.reference_solution,
        "status": q.status,
        "allow_copy_paste": q.allow_copy_paste,
        "test_cases": [
            {
                "id": tc.id,
                "type": tc.test_type,
                "index": tc.test_index,
                "input": tc.input_data,
                "output": tc.expected_output,
                "points": tc.points
            }
            for tc in q.test_cases
        ]
    }

@router.post("/dsa/{id}/test-cases")
def admin_add_dsa_testcase(id: int, req: DSATestCaseRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    q = db.query(DSAQuestion).filter(DSAQuestion.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    idx = len(q.test_cases) + 1
    tc = DSATestCase(
        question_id=q.id,
        test_type=req.test_type,
        test_index=idx,
        input_data=req.input_data,
        expected_output=req.expected_output,
        points=req.points or 0
    )
    db.add(tc)
    db.commit()
    db.refresh(tc)
    return {"success": True, "test_id": tc.id, "index": tc.test_index, "type": tc.test_type}

@router.delete("/dsa/test-cases/{test_id}")
def admin_delete_dsa_testcase(test_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    tc = db.query(DSATestCase).filter(DSATestCase.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Testcase not found.")
    db.delete(tc)
    db.commit()
    return {"success": True, "deleted_test_id": test_id}

@router.delete("/dsa/{id}")
def admin_delete_dsa_question(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    q = db.query(DSAQuestion).filter(DSAQuestion.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    db.query(EventDSAQuestion).filter(EventDSAQuestion.question_id == q.id).delete()
    db.query(DSATestCase).filter(DSATestCase.question_id == q.id).delete()
    db.query(Submission).filter(Submission.target_id == str(q.id)).delete()

    title = q.title
    db.delete(q)
    db.commit()

    log = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="DELETE_DSA_QUESTION",
        entity_type="DSA",
        entity_id=str(id),
        details=f"Deleted DSA question #{id} ({title})"
    )
    db.add(log)
    db.commit()

    return {"success": True, "deleted_id": id, "title": title}

@router.post("/dsa/{id}/validate-reference")
def admin_validate_dsa_reference(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    q = db.query(DSAQuestion).filter(DSAQuestion.id == id).first()
    if not q or not q.reference_solution:
        raise HTTPException(status_code=400, detail="Question or reference solution not found.")

    all_tests = db.query(DSATestCase).filter(DSATestCase.question_id == q.id).all()
    if not all_tests:
        raise HTTPException(status_code=400, detail="No test cases to validate against.")

    test_dicts = [
        {"id": f"tc_{t.id}", "type": t.test_type, "input": t.input_data, "output": t.expected_output, "points": t.points}
        for t in all_tests
    ]

    res = evaluate_submission(
        language="python3",
        source_code=q.reference_solution,
        test_cases=test_dicts,
        time_limit_ms=q.time_limit_ms,
        memory_limit_mb=q.memory_limit_mb,
        is_sample_run=False,
        reveal_failed_tests=True
    )

    all_accepted = res["verdict"] == "ACCEPTED"
    return {
        "valid": all_accepted,
        "verdict": res["verdict"],
        "total_tests": len(all_tests),
        "results": res["test_results"]
    }

# ==============================================================================
# 2. MCQ QUESTION STUDIO
# ==============================================================================

@router.post("/mcqs")
def admin_create_mcq(req: MCQCreateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    m = MCQQuestion(
        title=req.title,
        prompt=req.prompt,
        question_type=req.question_type or "single_choice",
        difficulty=req.difficulty or "Beginner",
        category=req.category or "Cybersecurity",
        tags=json.dumps(req.tags or []),
        options=json.dumps(req.options),
        points_positive=req.points_positive or 10,
        points_negative=req.points_negative or 0,
        time_limit_sec=req.time_limit_sec or 60,
        explanation=req.explanation,
        status=req.status or ChallengeStatus.PUBLISHED.value,
        created_by_id=admin.id
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"success": True, "id": m.id, "title": m.title}

@router.get("/mcqs")
def admin_list_mcqs(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    mcqs = db.query(MCQQuestion).order_by(MCQQuestion.id.asc()).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "question_type": m.question_type,
            "category": m.category,
            "difficulty": m.difficulty,
            "points_positive": m.points_positive,
            "points_negative": m.points_negative,
            "status": m.status,
            "options": json.loads(m.options) if m.options else [],
            "explanation": m.explanation
        }
        for m in mcqs
    ]

@router.delete("/mcqs/{id}")
def admin_delete_mcq(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    m = db.query(MCQQuestion).filter(MCQQuestion.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="MCQ not found.")

    db.query(EventMCQQuestion).filter(EventMCQQuestion.mcq_id == m.id).delete()
    db.query(MCQAttempt).filter(MCQAttempt.mcq_id == m.id).delete()

    title = m.title
    db.delete(m)
    db.commit()

    log = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="DELETE_MCQ_QUESTION",
        entity_type="MCQ",
        entity_id=str(id),
        details=f"Deleted MCQ #{id} ({title})"
    )
    db.add(log)
    db.commit()

    return {"success": True, "deleted_id": id, "title": title}

# ==============================================================================
# 3. CTF CHALLENGE STUDIO
# ==============================================================================

@router.post("/ctf")
def admin_create_ctf(req: CTFCreateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    slug = req.slug or req.title.lower().replace(" ", "-").replace("/", "-")
    existing = db.query(CTFChallenge).filter(CTFChallenge.slug == slug).first()
    if existing:
        slug = f"{slug}-{secrets.token_hex(3)}"

    c = CTFChallenge(
        slug=slug,
        title=req.title,
        description=req.description,
        category=req.category or "web",
        difficulty=req.difficulty or "Beginner",
        points=req.points or 100,
        flag_type=req.flag_type or FlagType.STATIC.value,
        static_flag=req.static_flag,
        hints=json.dumps(req.hints or []),
        files=json.dumps(req.files or []),
        has_docker_lab=bool(req.has_docker_lab),
        docker_image=req.docker_image,
        lab_timeout_min=req.lab_timeout_min or 60,
        lab_port_exposed=req.lab_port_exposed or 80,
        status=req.status or ChallengeStatus.PUBLISHED.value,
        created_by_id=admin.id
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"success": True, "id": c.id, "slug": c.slug, "title": c.title}

@router.get("/ctf")
def admin_list_ctf(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    challenges = db.query(CTFChallenge).order_by(CTFChallenge.id.asc()).all()
    return [
        {
            "id": c.id,
            "slug": c.slug,
            "title": c.title,
            "category": c.category,
            "difficulty": c.difficulty,
            "points": c.points,
            "flag_type": c.flag_type,
            "static_flag": c.static_flag,
            "has_docker_lab": c.has_docker_lab,
            "docker_image": c.docker_image,
            "status": c.status
        }
        for c in challenges
    ]

@router.delete("/ctf/{id}")
def admin_delete_ctf(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    c = db.query(CTFChallenge).filter(CTFChallenge.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    db.query(EventCTFChallenge).filter(EventCTFChallenge.challenge_id == c.id).delete()
    db.query(DynamicFlag).filter(DynamicFlag.challenge_id == c.id).delete()
    db.query(DockerLabInstance).filter(DockerLabInstance.challenge_id == c.id).delete()

    title = c.title
    db.delete(c)
    db.commit()

    log = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="DELETE_CTF_CHALLENGE",
        entity_type="CTF",
        entity_id=str(id),
        details=f"Deleted CTF challenge #{id} ({title})"
    )
    db.add(log)
    db.commit()

    return {"success": True, "deleted_id": id, "title": title}

# ==============================================================================
# 4. DYNAMIC GENERATOR STUDIO
# ==============================================================================

@router.post("/dynamic-templates")
def admin_create_template(req: DynamicTemplateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    tmpl = DynamicTemplate(
        name=req.name,
        category=req.category or "DSA",
        statement_template=req.statement_template,
        parameter_schema=json.dumps(req.parameter_schema),
        generator_script=req.generator_script,
        reference_solution=req.reference_solution,
        created_by_id=admin.id
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return {"success": True, "template_id": tmpl.id, "name": tmpl.name}

@router.get("/dynamic-templates")
def admin_list_templates(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    tmpls = db.query(DynamicTemplate).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "statement_template": t.statement_template,
            "parameter_schema": json.loads(t.parameter_schema) if t.parameter_schema else {}
        }
        for t in tmpls
    ]

@router.post("/dynamic-templates/{id}/generate")
def admin_generate_from_template(id: int, req: GenerateInstanceRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    tmpl = db.query(DynamicTemplate).filter(DynamicTemplate.id == id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found.")

    res = DynamicGeneratorService.generate_instance_from_template(
        db=db,
        template=tmpl,
        seed=req.seed,
        creator_id=admin.id
    )
    return res

# ==============================================================================
# 5. DOCKER LAB MANAGER
# ==============================================================================

@router.get("/labs")
def admin_list_labs(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    instances = db.query(DockerLabInstance).order_by(DockerLabInstance.id.desc()).all()
    return [
        {
            "id": inst.id,
            "challenge_id": inst.challenge_id,
            "challenge_title": inst.challenge.title if inst.challenge else "Unknown",
            "user_id": inst.user_id,
            "username": inst.user.username if inst.user else "Unknown",
            "status": inst.status,
            "access_port": inst.access_port,
            "expires_at": inst.expires_at,
            "created_at": inst.created_at
        }
        for inst in instances
    ]

# ==============================================================================
# 6. USER & TEAM GOVERNANCE WITH SAFE DELETION
# ==============================================================================

@router.get("/users")
def admin_list_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
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
            "team": team_data,
            "submission_count": sub_count,
            "created_at": u.created_at
        })
    return results

@router.put("/users/{user_id}/role")
def admin_update_user_role(
    user_id: int,
    req: RoleUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_super_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target.role = req.role
    db.commit()
    return {"success": True, "user_id": target.id, "new_role": target.role}

@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    confirm_username: Optional[str] = None,
    req: Optional[DeleteUserConfirmation] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_super_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    conf = (req.confirm_username if req else confirm_username) or ""
    if conf.strip() != target.username:
        raise HTTPException(status_code=400, detail=f"Confirmation mismatch. Expected '{target.username}'.")

    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="Administrative self-deletion is strictly prohibited. You cannot delete your own active account.")

    if UserRole.is_admin_or_super(target.role):
        active_admins = db.query(User).filter(
            User.role.in_([UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, "super_admin", "admin"]),
            User.is_active == True,
            User.id != target.id
        ).count()
        if active_admins == 0:
            raise HTTPException(status_code=400, detail="Cannot delete the final active Super Administrator.")

    deleted_username = target.username

    # Handle team memberships and automatic ownership succession
    if target.team_membership:
        membership = target.team_membership
        team = membership.team
        if membership.role == TeamMemberRole.OWNER.value and team:
            other_members = db.query(TeamMembership).filter(
                TeamMembership.team_id == team.id,
                TeamMembership.user_id != target.id
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

    # Dissociate solved_by_user_id in TeamSolvedCase to preserve team achievements
    db.query(TeamSolvedCase).filter(TeamSolvedCase.solved_by_user_id == target.id).update(
        {"solved_by_user_id": None}, synchronize_session="fetch"
    )

    # Safe cascade cleanup
    db.delete(target)

    # Record Audit Log
    db.add(AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="DELETE_USER",
        entity_type="USER",
        entity_id=str(user_id),
        details=json.dumps({"deleted_username": deleted_username})
    ))

    db.commit()

    return {"success": True, "message": f"User '{deleted_username}' deleted permanently."}

# ==============================================================================
# 7. AUDIT LOGS & INCIDENT CONTROLS
# ==============================================================================

@router.get("/audit-logs")
def admin_get_audit_logs(
    limit: int = 100,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    logs = query.order_by(AuditLog.id.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "actor_username": l.actor_username,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "created_at": l.created_at
        }
        for l in logs
    ]

@router.get("/security-incidents")
def admin_get_incidents(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    incidents = db.query(SecurityIncident).order_by(SecurityIncident.id.desc()).limit(100).all()
    return [
        {
            "id": inc.id,
            "user_id": inc.user_id,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "resolved": inc.resolved,
            "created_at": inc.created_at
        }
        for inc in incidents
    ]

@router.post("/batch-anti-cheat")
def admin_batch_anti_cheat(
    req: BatchAntiCheatRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(DSAQuestion)
    if req.category:
        query = query.filter(DSAQuestion.category == req.category)
    questions = query.all()

    for q in questions:
        q.allow_copy_paste = req.allow_copy_paste
    db.commit()

    return {
        "success": True,
        "affected_questions": len(questions),
        "allow_copy_paste": req.allow_copy_paste
    }

# ==============================================================================
# SUBMISSIONS, TEAMS & SYSTEM SETTINGS MANAGEMENT
# ==============================================================================

@router.get("/submissions")
def admin_list_submissions(
    event_id: Optional[str] = None,
    user_id: Optional[int] = None,
    verdict: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(Submission)
    if event_id:
        query = query.filter(Submission.event_id == event_id)
    if user_id:
        query = query.filter(Submission.user_id == user_id)
    if verdict:
        query = query.filter(Submission.verdict == verdict)

    total = query.count()
    subs = query.order_by(Submission.created_at.desc()).offset(offset).limit(limit).all()

    results = []
    for s in subs:
        u = db.query(User).filter(User.id == s.user_id).first()
        q = db.query(DSAQuestion).filter(DSAQuestion.id == int(s.target_id)).first() if s.target_id and s.target_id.isdigit() else None
        results.append({
            "id": s.id,
            "user_id": s.user_id,
            "username": u.username if u else "Unknown",
            "target_id": s.target_id,
            "question_title": q.title if q else f"Target #{s.target_id}",
            "event_id": s.event_id,
            "language": s.language,
            "source_code": s.source_code,
            "verdict": s.verdict,
            "execution_time_ms": s.execution_time_ms,
            "memory_kb": s.memory_used_kb,
            "points_awarded": s.score,
            "created_at": s.created_at
        })
    return {"total": total, "submissions": results}

@router.post("/submissions/{sub_id}/rejudge")
def admin_rejudge_submission(
    sub_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    sub = db.query(Submission).filter(Submission.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    q = db.query(DSAQuestion).filter(DSAQuestion.id == int(sub.target_id)).first() if sub.target_id and sub.target_id.isdigit() else None
    if not q:
        raise HTTPException(status_code=404, detail="Question associated with submission not found.")

    test_cases = [
        {"input": tc.input_data, "output": tc.expected_output}
        for tc in q.test_cases
    ]
    if not test_cases:
        test_cases = [{"input": "", "output": ""}]

    result = evaluate_submission(
        language=sub.language,
        source_code=sub.source_code,
        test_cases=test_cases,
        time_limit_ms=q.time_limit_ms or 2000,
        memory_limit_mb=q.memory_limit_mb or 256
    )

    old_verdict = sub.verdict
    sub.verdict = result.get("verdict", "ERROR")
    sub.execution_time_ms = result.get("execution_time_ms", 0)
    sub.memory_used_kb = result.get("memory_kb", 0)
    db.commit()

    audit = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="REJUDGE_SUBMISSION",
        entity_type="SUBMISSION",
        entity_id=str(sub.id),
        details=f"Rejudged submission #{sub.id}: {old_verdict} -> {sub.verdict}"
    )
    db.add(audit)
    db.commit()

    return {"success": True, "old_verdict": old_verdict, "new_verdict": sub.verdict, "result": result}

@router.get("/teams")
def admin_list_teams(
    event_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(Team)
    if event_id:
        query = query.filter(Team.event_id == event_id)
    teams = query.order_by(Team.created_at.desc()).limit(limit).all()

    results = []
    for t in teams:
        leader = db.query(User).filter(User.id == t.owner_id).first()
        results.append({
            "id": t.id,
            "name": t.name,
            "invitation_code": t.invitation_code,
            "leader_id": t.owner_id,
            "leader_username": leader.username if leader else "Unknown",
            "event_id": t.event_id,
            "max_members": t.max_members,
            "member_count": len(t.memberships),
            "members": [
                {
                    "user_id": m.user_id,
                    "username": m.user.username if m.user else "Unknown",
                    "role": m.role
                }
                for m in t.memberships
            ],
            "created_at": t.created_at
        })
    return results

@router.get("/settings")
def admin_get_settings(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    from app.db.models import PlatformSetting
    settings = db.query(PlatformSetting).all()
    config_dict = {}
    for s in settings:
        try:
            config_dict[s.setting_key] = json.loads(s.setting_value)
        except Exception:
            config_dict[s.setting_key] = s.setting_value
    return config_dict

@router.put("/settings/{setting_key}")
def admin_update_setting(
    setting_key: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    from app.db.models import PlatformSetting
    row = db.query(PlatformSetting).filter(PlatformSetting.setting_key == setting_key).first()
    if not row:
        row = PlatformSetting(
            setting_key=setting_key,
            setting_value=json.dumps(payload),
            updated_by_id=admin.id
        )
        db.add(row)
    else:
        row.setting_value = json.dumps(payload)
        row.updated_by_id = admin.id
        row.updated_at = datetime.now(timezone.utc)
    db.commit()

    audit = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="UPDATE_SETTING",
        entity_type="SETTING",
        entity_id=setting_key,
        details=f"Updated system setting: {setting_key}"
    )
    db.add(audit)
    db.commit()
    return {"success": True, "setting_key": setting_key, "value": payload}

