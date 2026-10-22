import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import MCQQuestion, MCQAttempt, User, ChallengeStatus
from app.api.deps import get_current_user
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/mcqs", tags=["MCQ Quiz Engine"])

class SubmitMCQRequest(BaseModel):
    selected_option_ids: List[int]
    time_taken_sec: Optional[int] = 0

@router.get("")
def list_mcqs(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MCQQuestion).filter(MCQQuestion.status == ChallengeStatus.PUBLISHED.value)
    if category:
        query = query.filter(MCQQuestion.category == category)
    if difficulty:
        query = query.filter(MCQQuestion.difficulty == difficulty)

    mcqs = query.order_by(MCQQuestion.id.asc()).all()

    # Sanitized options: REMOVE is_correct and explanations for participants!
    results = []
    for m in mcqs:
        raw_options = json.loads(m.options) if m.options else []
        sanitized_opts = [
            {"id": opt.get("id"), "text": opt.get("text")}
            for opt in raw_options
        ]
        results.append({
            "id": m.id,
            "title": m.title,
            "prompt": m.prompt,
            "question_type": m.question_type,
            "difficulty": m.difficulty,
            "category": m.category,
            "points_positive": m.points_positive,
            "points_negative": m.points_negative,
            "time_limit_sec": m.time_limit_sec,
            "options": sanitized_opts
        })
    return results

@router.get("/{mcq_id}")
def get_mcq_detail(mcq_id: int, db: Session = Depends(get_db)):
    m = db.query(MCQQuestion).filter(
        MCQQuestion.id == mcq_id,
        MCQQuestion.status == ChallengeStatus.PUBLISHED.value
    ).first()

    if not m:
        raise HTTPException(status_code=404, detail="MCQ not found.")

    raw_options = json.loads(m.options) if m.options else []
    sanitized_opts = [
        {"id": opt.get("id"), "text": opt.get("text")}
        for opt in raw_options
    ]

    return {
        "id": m.id,
        "title": m.title,
        "prompt": m.prompt,
        "question_type": m.question_type,
        "difficulty": m.difficulty,
        "category": m.category,
        "points_positive": m.points_positive,
        "points_negative": m.points_negative,
        "time_limit_sec": m.time_limit_sec,
        "options": sanitized_opts
    }

@router.post("/{mcq_id}/submit")
def submit_mcq_response(
    mcq_id: int,
    req: SubmitMCQRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    m = db.query(MCQQuestion).filter(
        MCQQuestion.id == mcq_id,
        MCQQuestion.status == ChallengeStatus.PUBLISHED.value
    ).first()

    if not m:
        raise HTTPException(status_code=404, detail="MCQ not found.")

    raw_options = json.loads(m.options) if m.options else []
    correct_ids = set([opt.get("id") for opt in raw_options if opt.get("is_correct") is True])
    user_ids = set(req.selected_option_ids)

    is_correct = (user_ids == correct_ids) and len(user_ids) > 0
    points_awarded = m.points_positive if is_correct else (-abs(m.points_negative) if m.points_negative else 0)

    # Save Attempt record
    attempt = MCQAttempt(
        user_id=current_user.id,
        mcq_id=m.id,
        selected_option_ids=json.dumps(req.selected_option_ids),
        is_correct=is_correct,
        score_awarded=points_awarded,
        time_taken_sec=req.time_taken_sec or 0,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    solve_res = None
    if is_correct:
        solve_res = ScoringService.record_solve(
            db=db,
            user=current_user,
            challenge_type="mcq",
            challenge_id=str(m.id),
            base_points=m.points_positive
        )

    return {
        "attempt_id": attempt.id,
        "is_correct": is_correct,
        "score_awarded": points_awarded,
        "explanation": m.explanation if is_correct else None,
        "solve_summary": solve_res
    }
