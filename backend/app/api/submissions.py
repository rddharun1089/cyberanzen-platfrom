from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db
from app.db.models import (
    Case, TestCase, Submission, User, EvidenceToken, Verdict,
    Team, TeamMembership, TeamSolvedCase
)
from app.api.deps import get_current_user
from app.judge.worker import evaluate_submission
from app.services.evidence_engine import compute_evidence_token

import time
from collections import defaultdict

MAX_SOURCE_CODE_BYTES = 65536  # 64 KB limit
USER_LAST_SAMPLE = defaultdict(float)
USER_LAST_SUBMIT = defaultdict(float)

def check_sample_cooldown_and_size(user_id: int, source_code: str):
    if len(source_code.encode("utf-8")) > MAX_SOURCE_CODE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Source code exceeds maximum permitted size of 64KB."
        )
    now = time.time()
    last = USER_LAST_SAMPLE[user_id]
    if now - last < 0.2:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Execution cooldown in effect. Please wait before running samples again."
        )
    USER_LAST_SAMPLE[user_id] = now

def check_submit_cooldown_and_size(user_id: int, source_code: str):
    if len(source_code.encode("utf-8")) > MAX_SOURCE_CODE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Source code exceeds maximum permitted size of 64KB."
        )
    now = time.time()
    last = USER_LAST_SUBMIT[user_id]
    if now - last < 0.2:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Submission cooldown in effect. Please wait before submitting again."
        )
    USER_LAST_SUBMIT[user_id] = now

router = APIRouter(prefix="/submissions", tags=["Coding Workspace & Submissions"])

class RunSampleRequest(BaseModel):
    case_id: str
    language: str  # python3, cpp, c
    source_code: str

class SubmitSolutionRequest(BaseModel):
    case_id: str
    language: str
    source_code: str

@router.post("/run-sample")
def run_sample_tests(req: RunSampleRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_sample_cooldown_and_size(current_user.id, req.source_code)
    case = db.query(Case).filter(Case.id == req.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case dossier not found")

    if not case.judge_enabled:
        raise HTTPException(status_code=403, detail=f"Judge worker execution is disabled by administrator for {case.id} ({case.title})")

    sample_tests = db.query(TestCase).filter(
        TestCase.case_id == req.case_id,
        TestCase.test_type == "public_sample"
    ).all()

    if not sample_tests:
        raise HTTPException(status_code=400, detail="No public sample test cases configured for this case")

    test_dicts = [
        {
            "id": f"sample_{s.id}",
            "type": "public_sample",
            "input": s.input_data,
            "output": s.expected_output,
            "points": 0
        }
        for s in sample_tests
    ]

    res = evaluate_submission(
        language=req.language,
        source_code=req.source_code,
        test_cases=test_dicts,
        time_limit_ms=case.time_limit_ms,
        memory_limit_mb=case.memory_limit_mb,
        is_sample_run=True,
        reveal_failed_tests=bool(case.reveal_failed_tests)
    )

    return res

@router.post("/submit")
def submit_solution(req: SubmitSolutionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_submit_cooldown_and_size(current_user.id, req.source_code)
    case = db.query(Case).filter(Case.id == req.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case dossier not found")

    if not case.judge_enabled:
        raise HTTPException(status_code=403, detail=f"Judge worker execution is disabled by administrator for {case.id} ({case.title})")

    # Fetch ALL test cases (samples and hidden)
    all_tests = db.query(TestCase).filter(TestCase.case_id == req.case_id).order_by(TestCase.test_index.asc()).all()
    if not all_tests:
        raise HTTPException(status_code=400, detail="No test cases configured for this challenge")

    test_dicts = [
        {
            "id": f"test_{t.id}",
            "type": t.test_type,
            "input": t.input_data,
            "output": t.expected_output,
            "points": t.points
        }
        for t in all_tests
    ]

    # Execute isolated judging
    eval_res = evaluate_submission(
        language=req.language,
        source_code=req.source_code,
        test_cases=test_dicts,
        time_limit_ms=case.time_limit_ms,
        memory_limit_mb=case.memory_limit_mb,
        is_sample_run=False,
        reveal_failed_tests=bool(case.reveal_failed_tests)
    )

    verdict_str = eval_res["verdict"]
    awarded_points = case.points if verdict_str == "ACCEPTED" else eval_res["score"]

    # Check if user belongs to an active team
    user_team = None
    membership = db.query(TeamMembership).filter(TeamMembership.user_id == current_user.id).first()
    if membership and membership.team and membership.team.is_active:
        user_team = membership.team

    # Save submission record
    sub = Submission(
        user_id=current_user.id,
        team_id=user_team.id if user_team else None,
        case_id=case.id,
        language=req.language,
        source_code=req.source_code,
        verdict=verdict_str,
        execution_time_ms=eval_res["execution_time_ms"],
        memory_used_kb=eval_res.get("memory_kb", 0),
        compile_log=eval_res.get("compile_log", ""),
        score=awarded_points,
        is_sample_run=False
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    unlocked_token = None
    # Handle Points & Evidence Token on ACCEPTED
    if verdict_str == "ACCEPTED":
        # 1. Update Personal Points if first solve by user
        prior_ac = db.query(Submission).filter(
            Submission.user_id == current_user.id,
            Submission.case_id == case.id,
            Submission.verdict == "ACCEPTED",
            Submission.id != sub.id
        ).first()

        if not prior_ac:
            current_user.points += case.points
            db.commit()

        # 2. Update Shared Team Progress & Points (Only once per team per problem)
        if user_team:
            existing_team_solve = db.query(TeamSolvedCase).filter(
                TeamSolvedCase.team_id == user_team.id,
                TeamSolvedCase.case_id == case.id
            ).first()

            if not existing_team_solve:
                try:
                    now_utc = datetime.now(timezone.utc)
                    team_solve = TeamSolvedCase(
                        team_id=user_team.id,
                        case_id=case.id,
                        points_awarded=case.points,
                        solved_by_user_id=current_user.id,
                        submission_id=sub.id,
                        solved_at=now_utc
                    )
                    db.add(team_solve)
                    user_team.points += case.points
                    user_team.updated_at = now_utc
                    db.commit()
                except IntegrityError:
                    # Concurrently handled by DB unique constraint
                    db.rollback()

        # 3. Unlock Evidence Token
        existing_token = db.query(EvidenceToken).filter(
            EvidenceToken.user_id == current_user.id,
            EvidenceToken.case_id == case.id
        ).first()

        if not existing_token:
            # Deterministic evidence token derivation
            token_val = compute_evidence_token(case.number, f"VERIFIED_{case.id}")
            tok = EvidenceToken(
                user_id=current_user.id,
                case_id=case.id,
                token_value=token_val,
                is_valid=True
            )
            db.add(tok)
            db.commit()
            unlocked_token = token_val
        else:
            unlocked_token = existing_token.token_value

    return {
        "submission_id": sub.id,
        "verdict": sub.verdict,
        "score": sub.score,
        "execution_time_ms": sub.execution_time_ms,
        "compile_log": sub.compile_log,
        "test_results": eval_res["test_results"],
        "unlocked_token": unlocked_token
    }

@router.get("")
def list_submissions(case_id: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Submission).filter(Submission.user_id == current_user.id)
    if case_id:
        query = query.filter(Submission.case_id == case_id)
    subs = query.order_by(Submission.created_at.desc()).limit(50).all()
    return [
        {
            "id": s.id,
            "case_id": s.case_id,
            "language": s.language,
            "verdict": s.verdict,
            "score": s.score,
            "execution_time_ms": s.execution_time_ms,
            "created_at": s.created_at
        }
        for s in subs
    ]

@router.get("/{submission_id}")
def get_submission_detail(submission_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if sub.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Clearance denied to other investigator's submission")

    return {
        "id": sub.id,
        "case_id": sub.case_id,
        "language": sub.language,
        "source_code": sub.source_code,
        "verdict": sub.verdict,
        "score": sub.score,
        "execution_time_ms": sub.execution_time_ms,
        "compile_log": sub.compile_log,
        "created_at": sub.created_at
    }
