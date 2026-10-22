from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
import json
import time
from collections import defaultdict
from datetime import datetime, timezone
from app.db.session import get_db
from app.db.models import DSAQuestion, DSATestCase, Submission, User, ChallengeStatus, Verdict, Event, EventDSAQuestion, Solve, EventStatus, EventActivityLog
from app.api.deps import get_current_user
from app.judge.worker import evaluate_submission
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/questions", tags=["DSA Question Bank"])

MAX_SOURCE_CODE_BYTES = 65536
USER_LAST_RUN = defaultdict(float)

def check_cooldown_and_size(user_id: int, source_code: str):
    if len(source_code.encode("utf-8")) > MAX_SOURCE_CODE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Source code exceeds maximum permitted size of 64KB."
        )
    now = time.time()
    last = USER_LAST_RUN[user_id]
    if now - last < 0.2:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Execution cooldown active. Please wait briefly before executing again."
        )
    USER_LAST_RUN[user_id] = now

class RunCodeRequest(BaseModel):
    language: str  # python3, cpp, c
    source_code: str
    event_id: Optional[int] = None

class SubmitCodeRequest(BaseModel):
    language: str
    source_code: str
    event_id: Optional[int] = None

def get_question_by_id_or_slug(identifier: str, db: Session) -> DSAQuestion:
    if identifier.isdigit():
        q = db.query(DSAQuestion).filter(DSAQuestion.id == int(identifier)).first()
    else:
        q = db.query(DSAQuestion).filter(DSAQuestion.slug == identifier).first()

    if not q or q.status != ChallengeStatus.PUBLISHED.value:
        raise HTTPException(status_code=404, detail="Question not found in published archive.")
    return q

@router.get("")
def list_questions(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(DSAQuestion).filter(DSAQuestion.status == ChallengeStatus.PUBLISHED.value)

    if category:
        query = query.filter(DSAQuestion.category == category)
    if difficulty:
        query = query.filter(DSAQuestion.difficulty == difficulty)
    if search:
        query = query.filter(or_(
            DSAQuestion.title.ilike(f"%{search}%"),
            DSAQuestion.statement.ilike(f"%{search}%")
        ))

    questions = query.order_by(DSAQuestion.id.asc()).all()
    return [
        {
            "id": q.id,
            "slug": q.slug,
            "title": q.title,
            "category": q.category,
            "difficulty": q.difficulty,
            "points": q.points,
            "time_limit_ms": q.time_limit_ms,
            "memory_limit_mb": q.memory_limit_mb,
            "supported_languages": json.loads(q.supported_languages) if q.supported_languages else ["python3", "cpp", "c"],
            "allow_copy_paste": q.allow_copy_paste
        }
        for q in questions
    ]

@router.get("/{identifier}")
def get_question_detail(identifier: str, db: Session = Depends(get_db)):
    q = get_question_by_id_or_slug(identifier, db)

    # Fetch ONLY public samples — never hidden tests!
    samples = db.query(DSATestCase).filter(
        DSATestCase.question_id == q.id,
        DSATestCase.test_type == "public_sample"
    ).order_by(DSATestCase.test_index.asc()).all()

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
        "supported_languages": json.loads(q.supported_languages) if q.supported_languages else ["python3", "cpp", "c"],
        "starter_code": {
            "python3": q.starter_py or "# Write Python 3 solution here\n",
            "cpp": q.starter_cpp or "// Write C++ solution here\n",
            "c": q.starter_c or "/* Write C solution here */\n"
        },
        "sample_tests": [
            {
                "id": s.id,
                "input": s.input_data,
                "output": s.expected_output
            }
            for s in samples
        ],
        "allow_copy_paste": q.allow_copy_paste,
        "judge_enabled": q.judge_enabled
    }

@router.post("/{identifier}/run-sample")
def run_sample_code(
    identifier: str,
    req: RunCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_cooldown_and_size(current_user.id, req.source_code)
    q = get_question_by_id_or_slug(identifier, db)

    if not q.judge_enabled:
        raise HTTPException(status_code=403, detail="Judging is currently disabled for this question.")

    samples = db.query(DSATestCase).filter(
        DSATestCase.question_id == q.id,
        DSATestCase.test_type == "public_sample"
    ).all()

    if not samples:
        raise HTTPException(status_code=400, detail="No public samples configured for this problem.")

    test_dicts = [
        {
            "id": f"sample_{s.id}",
            "type": "public_sample",
            "input": s.input_data,
            "output": s.expected_output,
            "points": 0
        }
        for s in samples
    ]

    res = evaluate_submission(
        language=req.language,
        source_code=req.source_code,
        test_cases=test_dicts,
        time_limit_ms=q.time_limit_ms,
        memory_limit_mb=q.memory_limit_mb,
        is_sample_run=True,
        reveal_failed_tests=bool(q.reveal_failed_tests)
    )

    if getattr(req, "event_id", None):
        try:
            db.add(EventActivityLog(
                event_id=req.event_id,
                user_id=current_user.id,
                username=current_user.username,
                action="RUN_SAMPLE",
                entity_type="dsa_question",
                entity_id=str(q.id),
                entity_title=q.title,
                status=res.get("verdict", "SAMPLE_TESTED"),
                details=f"Language: {req.language}. Tested {len(samples)} public samples in {res.get('execution_time_ms', 0)}ms.",
                created_at=datetime.now(timezone.utc)
            ))
            db.commit()
        except Exception:
            pass

    return res

@router.post("/{identifier}/submit")
def submit_solution(
    identifier: str,
    req: SubmitCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_cooldown_and_size(current_user.id, req.source_code)
    q = get_question_by_id_or_slug(identifier, db)

    if not q.judge_enabled:
        raise HTTPException(status_code=403, detail="Judging is currently disabled for this question.")

    all_tests = db.query(DSATestCase).filter(
        DSATestCase.question_id == q.id
    ).order_by(DSATestCase.test_index.asc()).all()

    if not all_tests:
        raise HTTPException(status_code=400, detail="No test cases configured for this question.")

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

    # Event-specific validation & navigation enforcement if submitted under an event
    event = None
    points_to_award = q.points
    if req.event_id:
        event = db.query(Event).filter(Event.id == req.event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Associated event competition not found.")
        if event.status in (EventStatus.ENDED.value, EventStatus.ARCHIVED.value):
            raise HTTPException(status_code=400, detail="Event competition has concluded. Submissions are closed.")

        # Check question association and points override
        ev_assoc = db.query(EventDSAQuestion).filter(
            EventDSAQuestion.event_id == event.id,
            EventDSAQuestion.question_id == q.id
        ).first()
        if ev_assoc and ev_assoc.points_override is not None:
            points_to_award = ev_assoc.points_override

        # Check sequential navigation policy
        if event.question_navigation_policy == "sequential" and ev_assoc:
            # Check all questions ordered before this one
            prior_assocs = db.query(EventDSAQuestion).filter(
                EventDSAQuestion.event_id == event.id,
                EventDSAQuestion.order_index < ev_assoc.order_index
            ).all()
            for pa in prior_assocs:
                prior_solve = db.query(Solve).filter(
                    Solve.event_id == event.id,
                    Solve.challenge_type == "dsa",
                    Solve.challenge_id == str(pa.question_id),
                    Solve.user_id == current_user.id
                ).first()
                if not prior_solve:
                    raise HTTPException(
                        status_code=403,
                        detail="Sequential progression lockdown: solve preceding challenges to unlock this question."
                    )

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
    awarded_points = points_to_award if verdict_str == Verdict.ACCEPTED.value else 0

    sub = Submission(
        event_id=event.id if event else None,
        user_id=current_user.id,
        team_id=current_user.team_membership.team_id if current_user.team_membership else None,
        submission_type="dsa",
        target_id=str(q.id),
        case_id=str(q.slug),
        language=req.language,
        source_code=req.source_code,
        verdict=verdict_str,
        execution_time_ms=eval_res["execution_time_ms"],
        memory_used_kb=eval_res.get("memory_kb", 0),
        compile_log=eval_res.get("compile_log", ""),
        score=awarded_points,
        test_results=json.dumps(eval_res.get("test_results", [])),
        is_sample_run=False
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    solve_res = None
    if verdict_str == Verdict.ACCEPTED.value:
        solve_res = ScoringService.record_solve(
            db=db,
            user=current_user,
            challenge_type="dsa",
            challenge_id=str(q.id),
            base_points=points_to_award,
            submission=sub,
            event=event
        )

    # Automatic Event Journey Audit Trail Logging
    if event:
        try:
            # 1. Log submission attempt
            db.add(EventActivityLog(
                event_id=event.id,
                user_id=current_user.id,
                username=current_user.username,
                action="SUBMIT_CODE",
                entity_type="dsa_question",
                entity_id=str(q.id),
                entity_title=q.title,
                status=verdict_str,
                details=f"Language: {req.language}. Executed in {eval_res.get('execution_time_ms', 0)}ms. Awarded: {awarded_points} PTS.",
                created_at=datetime.now(timezone.utc)
            ))

            # 2. If accepted, log challenge solve
            if verdict_str == Verdict.ACCEPTED.value:
                db.add(EventActivityLog(
                    event_id=event.id,
                    user_id=current_user.id,
                    username=current_user.username,
                    action="SOLVED",
                    entity_type="dsa_question",
                    entity_id=str(q.id),
                    entity_title=q.title,
                    status="ACCEPTED",
                    details=f"Challenge '{q.title}' solved! Awarded +{points_to_award} points.",
                    created_at=datetime.now(timezone.utc)
                ))

                # 3. Check if all tournament challenges are now completed!
                total_assigned = db.query(EventDSAQuestion).filter(EventDSAQuestion.event_id == event.id).count()
                if total_assigned > 0:
                    solves_count = db.query(Solve).filter(
                        Solve.event_id == event.id,
                        Solve.user_id == current_user.id,
                        Solve.challenge_type == "dsa"
                    ).count()
                    if solves_count >= total_assigned:
                        db.add(EventActivityLog(
                            event_id=event.id,
                            user_id=current_user.id,
                            username=current_user.username,
                            action="EVENT_COMPLETED",
                            entity_type="event",
                            entity_id=str(event.id),
                            entity_title=event.title,
                            status="SUCCESS",
                            details=f"Candidate completed all {total_assigned} challenges in the event! Tournament session finished.",
                            created_at=datetime.now(timezone.utc)
                        ))

            db.commit()
        except Exception:
            pass

    return {
        "submission_id": sub.id,
        "verdict": sub.verdict,
        "score": sub.score,
        "execution_time_ms": sub.execution_time_ms,
        "compile_log": sub.compile_log,
        "test_results": eval_res["test_results"],
        "solve_summary": solve_res
    }
