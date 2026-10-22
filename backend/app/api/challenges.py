import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import CTFChallenge, DynamicFlag, Submission, User, ChallengeStatus, Verdict, FlagType
from app.api.deps import get_current_user
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/challenges", tags=["CTF Challenge Arena"])

class SubmitFlagRequest(BaseModel):
    flag: str

class UnlockHintRequest(BaseModel):
    hint_id: int

def get_challenge_by_id_or_slug(identifier: str, db: Session) -> CTFChallenge:
    if identifier.isdigit():
        c = db.query(CTFChallenge).filter(CTFChallenge.id == int(identifier)).first()
    else:
        c = db.query(CTFChallenge).filter(CTFChallenge.slug == identifier).first()

    if not c or c.status != ChallengeStatus.PUBLISHED.value:
        raise HTTPException(status_code=404, detail="Challenge not found in published arena.")
    return c

@router.get("")
def list_challenges(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CTFChallenge).filter(CTFChallenge.status == ChallengeStatus.PUBLISHED.value)
    if category:
        query = query.filter(CTFChallenge.category == category)
    if difficulty:
        query = query.filter(CTFChallenge.difficulty == difficulty)

    challenges = query.order_by(CTFChallenge.id.asc()).all()
    return [
        {
            "id": c.id,
            "slug": c.slug,
            "title": c.title,
            "category": c.category,
            "difficulty": c.difficulty,
            "points": c.points,
            "has_docker_lab": c.has_docker_lab,
            "dynamic_scoring": c.dynamic_scoring,
            "solved_count": len(c.dynamic_flags)  # or solves
        }
        for c in challenges
    ]

@router.get("/{identifier}")
def get_challenge_detail(identifier: str, db: Session = Depends(get_db)):
    c = get_challenge_by_id_or_slug(identifier, db)

    raw_hints = json.loads(c.hints) if c.hints else []
    # Mask hint text unless unlocked; show cost
    sanitized_hints = [
        {"id": h.get("id"), "cost": h.get("cost", 0), "hint": h.get("hint")}
        for h in raw_hints
    ]

    raw_files = json.loads(c.files) if c.files else []

    return {
        "id": c.id,
        "slug": c.slug,
        "title": c.title,
        "description": c.description,
        "category": c.category,
        "difficulty": c.difficulty,
        "points": c.points,
        "flag_type": c.flag_type,
        "has_docker_lab": c.has_docker_lab,
        "docker_image": c.docker_image if c.has_docker_lab else None,
        "lab_timeout_min": c.lab_timeout_min,
        "hints": sanitized_hints,
        "files": raw_files
    }

@router.post("/{identifier}/submit-flag")
def submit_flag(
    identifier: str,
    req: SubmitFlagRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = get_challenge_by_id_or_slug(identifier, db)
    user_flag = req.flag.strip()

    is_correct = False
    # 1. Check static flag match
    if c.flag_type == FlagType.STATIC.value:
        if c.static_flag and (user_flag == c.static_flag.strip() or user_flag.upper() == c.static_flag.strip().upper()):
            is_correct = True

    # 2. Check dynamic flag per user / team / instance
    else:
        now = datetime.now(timezone.utc)
        dyn_query = db.query(DynamicFlag).filter(
            DynamicFlag.challenge_id == c.id,
            DynamicFlag.flag_value == user_flag,
            DynamicFlag.is_solved == False
        )
        if dyn_query.first():
            is_correct = True
            dyn_flag = dyn_query.first()
            dyn_flag.is_solved = True
            db.commit()

    # Record submission
    sub = Submission(
        user_id=current_user.id,
        team_id=current_user.team_membership.team_id if current_user.team_membership else None,
        submission_type="ctf",
        target_id=str(c.id),
        case_id=c.slug,
        verdict=Verdict.ACCEPTED.value if is_correct else Verdict.WRONG_ANSWER.value,
        score=c.points if is_correct else 0,
        source_code=f"FLAG_SUBMISSION: {user_flag[:64]}",
        is_sample_run=False
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    solve_res = None
    if is_correct:
        solve_res = ScoringService.record_solve(
            db=db,
            user=current_user,
            challenge_type="ctf",
            challenge_id=str(c.id),
            base_points=c.points,
            submission=sub
        )

    return {
        "is_correct": is_correct,
        "points_awarded": c.points if is_correct else 0,
        "message": "Flag captured! Points awarded." if is_correct else "Incorrect flag. Re-examine the evidence.",
        "solve_summary": solve_res
    }
