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

class MentorGuidanceRequest(BaseModel):
    source_code: str
    language: str  # python3, cpp, c
    failed_case_input: Optional[str] = None
    expected_output: Optional[str] = None
    actual_output: Optional[str] = None
    error_message: Optional[str] = None
    verdict: Optional[str] = "WRONG_ANSWER"
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
            "allow_copy_paste": q.allow_copy_paste,
            "enable_mentor": getattr(q, "enable_mentor", True)
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
        "enable_mentor": getattr(q, "enable_mentor", True),
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

# ==============================================================================
# DSA AI MENTOR // DIAGNOSTIC GUIDANCE ENGINE (ENABLED BY ADMIN)
# ==============================================================================

@router.post("/{identifier}/mentor-guidance")
def get_mentor_guidance(
    identifier: str,
    req: MentorGuidanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = get_question_by_id_or_slug(identifier, db)

    # Check if admin disabled mentor in this event
    event = None
    if req.event_id:
        event = db.query(Event).filter(Event.id == req.event_id).first()
        if event and not getattr(event, "enable_mentor", True):
            raise HTTPException(
                status_code=403,
                detail="The DSA AI Debugging Mentor has been disabled for this competition by the tournament administrator."
            )

    # Check if mentor is disabled specifically for this question
    if not getattr(q, "enable_mentor", True):
        raise HTTPException(
            status_code=403,
            detail=f"The DSA AI Debugging Mentor has been disabled for question '{q.title}' by the tournament administrator."
        )

    verdict = (req.verdict or "WRONG_ANSWER").upper()
    code = req.source_code or ""
    err = (req.error_message or "").strip()
    exp = (req.expected_output or "").strip()
    act = (req.actual_output or "").strip()
    inp = (req.failed_case_input or "").strip()

    root_cause = ""
    actionable_hints = []
    pedagogical_concept = ""
    suggested_action = ""

    # Diagnosis Category 1: Compilation Error
    if "COMPILE" in verdict or "SYNTAX" in err.upper() or "ERROR:" in err.upper():
        pedagogical_concept = "Language Syntax & Standard Library Bindings"
        if "indentationerror" in err.lower():
            root_cause = "Indentation / Block alignment error. Python relies on consistent 4 spaces per indentation level."
            actionable_hints.append("Check lines around the reported line number for mixed tabs/spaces or missing `:` after if/for/def.")
            suggested_action = "Align your block under the preceding function or loop header with uniform spacing."
        elif "was not declared in this scope" in err.lower():
            missing_name = err.split("‘")[-1].split("’")[0] if "‘" in err else "a symbol"
            root_cause = f"Undeclared identifier ({missing_name}). Variable or standard container was used before definition or missing include."
            actionable_hints.append("Verify spelling, variable declaration, and check required headers like `#include <vector>` or `#include <unordered_map>`.")
            suggested_action = "Ensure `using namespace std;` and appropriate includes are declared at top of file."
        else:
            root_cause = f"Compilation failure during binary build: {err[:140] if err else 'Syntax error'}"
            actionable_hints.append("Carefully inspect the compiler error output in the diagnostic tab for line numbers and tokens.")
            suggested_action = "Resolve compiler errors before re-testing against sample vectors."

    # Diagnosis Category 2: Runtime Exception / Crash
    elif "RUNTIME" in verdict or "error" in err.lower() or "exception" in err.lower() or "dump" in err.lower():
        pedagogical_concept = "Defensive Bounds Checking & Memory Access"
        if "indexerror" in err.lower() or "out of range" in err.lower():
            root_cause = "Array Index Out of Bounds. An array or list element was accessed using an index >= size or < -size."
            actionable_hints.append("Remember that array indices run from 0 to N - 1. A loop condition checking `nums[i + 1]` can overflow on the last element.")
            actionable_hints.append("If checking adjacent items, stop loop at `len(nums) - 1`.")
            suggested_action = "Add boundary checks `if i + 1 < len(nums)` or verify length of input vector before indexing."
        elif "keyerror" in err.lower():
            root_cause = "Dictionary Key Missing. Accessing `hash_map[key]` when `key` does not exist raises KeyError."
            actionable_hints.append("Use `if key in hash_map:` or `hash_map.get(key)` to safely check presence before retrieving.")
            suggested_action = "Check key existence before fetching: `if complement in seen: return seen[complement], i`."
        elif "recursionerror" in err.lower() or "maximum recursion" in err.lower():
            root_cause = "Stack Overflow / Unbounded Recursion. Recursive function missing a terminating base case or excessive depth."
            actionable_hints.append("Ensure your base case returns immediately when constraints are met.")
            suggested_action = "Convert recursive traversal to an iterative queue/stack or memoize subproblems."
        elif "zerodivisionerror" in err.lower():
            root_cause = "Division by zero occurred during arithmetic evaluation."
            actionable_hints.append("Guard division operations with `if denominator != 0:`.")
            suggested_action = "Check for zero values before modulo or division."
        else:
            root_cause = f"Runtime Crash ({err[:120] if err else 'Signal termination or non-zero exit code'})."
            actionable_hints.append("Verify input reading: empty inputs or trailing whitespace might produce unhandled None/null values.")
            suggested_action = "Use safe input handling: `input_data = sys.stdin.read().split()` and verify `if not input_data: return`."

    # Diagnosis Category 3: Time Limit Exceeded (TLE)
    elif "TIME_LIMIT" in verdict or "TLE" in verdict:
        pedagogical_concept = "Algorithmic Time Complexity Optimization"
        if "for " in code and code.count("for ") >= 2 and ("in range" in code or "i++" in code):
            root_cause = "Quadratic Time Complexity $O(N^2)$. Nested loops iterating over N elements will time out when $N \\ge 10^4$."
            actionable_hints.append("For $N = 10^5$, an $O(N^2)$ algorithm performs $10^{10}$ operations, taking ~10 seconds (limit is 2 seconds).")
            actionable_hints.append("Optimal strategy: Trade $O(N)$ space for $O(1)$ lookups using an unordered hash map or two-pointer sliding window.")
            suggested_action = "Replace the inner loop with a hash table lookup: store elements in `seen` as you iterate in a single pass."
        else:
            root_cause = "Execution took longer than the 2000ms judge cutoff. Possible non-terminating while loop or unoptimized I/O."
            actionable_hints.append("In C++, speed up standard stream I/O with `ios_base::sync_with_stdio(false); cin.tie(NULL);`.")
            actionable_hints.append("In Python, avoid repeated string concatenation in loops; use list/join or dictionary lookups.")
            suggested_action = "Check your loop termination conditions to ensure pointers advance on every cycle."

    # Diagnosis Category 4: Output Mismatch / Wrong Answer
    else:
        pedagogical_concept = "Correctness, Edge Cases & Output Specifications"

        # Sub-case: Empty output
        if not act:
            root_cause = "Zero standard output produced. Your program executed to completion but wrote nothing to stdout."
            actionable_hints.append("Make sure your solution actually prints the final result via `print(...)` in Python or `cout << ... << '\\n'` in C++.")
            suggested_action = "Ensure your code is not exiting prematurely before printing results."

        # Sub-case: Boolean case mismatch (e.g. Python "True" vs lowercase "true")
        elif exp.lower() in ("true", "false") and act in ("True", "False") and exp != act:
            root_cause = f"Boolean formatting mismatch: Expected lowercase '{exp}', but your program output '{act}' with a capital letter."
            actionable_hints.append("Python's default `print(True)` outputs `'True'`. The problem judge specifically checks for lowercase `'true'` and `'false'`.")
            suggested_action = "Format your output as: `print('true' if condition else 'false')` or `print(str(result).lower())`."

        # Sub-case: Array / bracket formatting mismatch (e.g. expected "0 1" vs "[0, 1]")
        elif "[" in act and "]" in act and "[" not in exp and exp.replace(" ", "").isdigit():
            root_cause = f"Data format mismatch: Expected space-separated integers, but your program printed a raw list/array string '{act}'."
            actionable_hints.append("The judge specification expects `print(f'{i} {j}')` or `print(i, j)` instead of `print([i, j])`.")
            suggested_action = "Unpack or format your indices: `print(f'{idx1} {idx2}')`."

        # Sub-case: Reversed index order (e.g. expected "0 1" vs actual "1 0")
        elif len(exp.split()) == 2 and len(act.split()) == 2:
            e_parts = exp.split()
            a_parts = act.split()
            if sorted(e_parts) == sorted(a_parts) and e_parts != a_parts:
                root_cause = f"Index Ordering Flaw: Your program found the right pair but printed them in inverted order ('{act}' instead of '{exp}')."
                actionable_hints.append("The specification requires ascending index order (`index1 < index2`).")
                suggested_action = "Print smaller index first: `print(f'{min(i, j)} {max(i, j)}')` or ensure `index1 < index2`."
            else:
                root_cause = f"Result value mismatch: Expected '{exp}', but your program output '{act}'."
                actionable_hints.append(f"Input tested: {inp if inp else 'vector data'}.")
                actionable_hints.append("Trace the state of your variables through this specific test case.")
                suggested_action = "Consider edge cases: duplicate values, negative numbers, or non-adjacent items."

        # Sub-case: String anagram or length mismatch
        elif "anagram" in q.slug.lower() or "anagram" in q.title.lower():
            root_cause = "Anagram character frequency mismatch. For two strings to be anagrams, their lengths must be identical AND each character must appear with identical counts."
            actionable_hints.append("First check length: `if len(s) != len(t): return False`.")
            actionable_hints.append("Compare sorted characters `sorted(s) == sorted(t)` or use an array of 26 frequency counts.")
            suggested_action = "Check: `print('true' if sorted(s) == sorted(t) else 'false')`."

        # Sub-case: Sliding window / Substring unique sequence
        elif "substring" in q.slug.lower() or "unique" in q.slug.lower():
            root_cause = "Sliding window pointer shift flaw. When encountering a previously seen character, your left window pointer did not advance correctly."
            actionable_hints.append("When a duplicate is encountered at index `last_seen[ch]`, the left bound must jump to `max(left, last_seen[ch] + 1)`.")
            actionable_hints.append("Never move `left` backward if the duplicate was already outside the current window!")
            suggested_action = "Update left pointer as: `if ch in seen and seen[ch] >= left: left = seen[ch] + 1`."

        else:
            root_cause = f"Output mismatch: Expected '{exp}', but program generated '{act}'."
            actionable_hints.append(f"Analyze the input vectors: {inp[:80] if inp else 'test case'}.")
            actionable_hints.append("Check whether all constraints and boundary cases are handled.")
            suggested_action = "Re-read the specification carefully for output format requirements or off-by-one errors."

    # Log mentor consultation event in EventActivityLog if event is present
    if event:
        try:
            db.add(EventActivityLog(
                event_id=event.id,
                user_id=current_user.id,
                username=current_user.username,
                action="MENTOR_GUIDANCE",
                entity_type="dsa_question",
                entity_id=str(q.id),
                entity_title=q.title,
                status="INFO",
                details=f"Mentor diagnosed candidate error on {verdict}: {root_cause}",
                created_at=datetime.now(timezone.utc)
            ))
            db.commit()
        except Exception:
            pass

    return {
        "status": "DIAGNOSIS_READY",
        "question_id": q.id,
        "question_title": q.title,
        "verdict": verdict,
        "pedagogical_concept": pedagogical_concept,
        "root_cause": root_cause,
        "actionable_hints": actionable_hints,
        "suggested_action": suggested_action
    }
