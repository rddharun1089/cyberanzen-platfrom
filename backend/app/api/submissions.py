import json
import time
from collections import defaultdict
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Submission, User, DSAQuestion, DSATestCase, Verdict
from app.api.deps import get_current_user
from app.judge.worker import evaluate_submission
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/submissions", tags=["Submissions & Evaluation"])

MAX_SOURCE_CODE_BYTES = 65536
USER_LAST_RUN = defaultdict(float)

def check_cooldown(user_id: int):
    now = time.time()
    last = USER_LAST_RUN[user_id]
    if now - last < 0.2:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Execution cooldown in effect."
        )
    USER_LAST_RUN[user_id] = now

class LegacyRunSampleRequest(BaseModel):
    case_id: str
    language: str
    source_code: str

class LegacySubmitRequest(BaseModel):
    case_id: str
    language: str
    source_code: str

@router.get("")
def list_submissions(
    submission_type: Optional[str] = Query(None),
    verdict: Optional[str] = Query(None),
    target_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Submission).filter(Submission.user_id == current_user.id)
    if submission_type:
        query = query.filter(Submission.submission_type == submission_type)
    if verdict:
        query = query.filter(Submission.verdict == verdict)
    if target_id:
        query = query.filter(Submission.target_id == target_id)

    subs = query.order_by(Submission.id.desc()).limit(100).all()
    return [
        {
            "id": s.id,
            "submission_type": s.submission_type,
            "target_id": s.target_id,
            "language": s.language,
            "verdict": s.verdict,
            "score": s.score,
            "execution_time_ms": s.execution_time_ms,
            "created_at": s.created_at
        }
        for s in subs
    ]

@router.get("/{submission_id}")
def get_submission_detail(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    if sub.user_id != current_user.id and not UserRole.has_admin_privileges(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to inspect this submission.")

    return {
        "id": sub.id,
        "submission_type": sub.submission_type,
        "target_id": sub.target_id,
        "language": sub.language,
        "source_code": sub.source_code,
        "verdict": sub.verdict,
        "score": sub.score,
        "execution_time_ms": sub.execution_time_ms,
        "compile_log": sub.compile_log,
        "test_results": json.loads(sub.test_results) if sub.test_results else [],
        "created_at": sub.created_at
    }

# Backward compatibility routes for existing tests
@router.post("/run-sample")
def legacy_run_sample(req: LegacyRunSampleRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_cooldown(current_user.id)
    q = db.query(DSAQuestion).filter(
        (DSAQuestion.id == int(req.case_id)) if req.case_id.isdigit() else (DSAQuestion.slug == req.case_id)
    ).first()

    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    samples = db.query(DSATestCase).filter(
        DSATestCase.question_id == q.id,
        DSATestCase.test_type == "public_sample"
    ).all()

    test_dicts = [
        {"id": f"sample_{s.id}", "type": "public_sample", "input": s.input_data, "output": s.expected_output, "points": 0}
        for s in samples
    ]

    return evaluate_submission(
        language=req.language,
        source_code=req.source_code,
        test_cases=test_dicts,
        time_limit_ms=q.time_limit_ms,
        memory_limit_mb=q.memory_limit_mb,
        is_sample_run=True,
        reveal_failed_tests=bool(q.reveal_failed_tests)
    )

@router.post("/submit")
def legacy_submit(req: LegacySubmitRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_cooldown(current_user.id)
    q = db.query(DSAQuestion).filter(
        (DSAQuestion.id == int(req.case_id)) if req.case_id.isdigit() else (DSAQuestion.slug == req.case_id)
    ).first()

    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    all_tests = db.query(DSATestCase).filter(DSATestCase.question_id == q.id).all()
    test_dicts = [
        {"id": f"test_{t.id}", "type": t.test_type, "input": t.input_data, "output": t.expected_output, "points": t.points}
        for t in all_tests
    ]

    eval_res = evaluate_submission(
        language=req.language,
        source_code=req.source_code,
        test_cases=test_dicts,
        time_limit_ms=q.time_limit_ms,
        memory_limit_mb=q.memory_limit_mb,
        is_sample_run=False,
        reveal_failed_tests=bool(q.reveal_failed_tests)
    )

    verdict_str = eval_res["verdict"]
    awarded_points = q.points if verdict_str == Verdict.ACCEPTED.value else 0

    sub = Submission(
        user_id=current_user.id,
        team_id=current_user.team_membership.team_id if current_user.team_membership else None,
        submission_type="dsa",
        target_id=str(q.id),
        case_id=q.slug,
        language=req.language,
        source_code=req.source_code,
        verdict=verdict_str,
        execution_time_ms=eval_res["execution_time_ms"],
        compile_log=eval_res.get("compile_log", ""),
        score=awarded_points,
        test_results=json.dumps(eval_res.get("test_results", [])),
        is_sample_run=False
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    if verdict_str == Verdict.ACCEPTED.value:
        ScoringService.record_solve(
            db=db,
            user=current_user,
            challenge_type="dsa",
            challenge_id=str(q.id),
            base_points=q.points,
            submission=sub
        )

    return {
        "submission_id": sub.id,
        "verdict": sub.verdict,
        "score": sub.score,
        "execution_time_ms": sub.execution_time_ms,
        "compile_log": sub.compile_log,
        "test_results": eval_res["test_results"]
    }
