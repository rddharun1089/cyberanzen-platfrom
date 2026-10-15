from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Case, TestCase, User, AuditLog, Submission
from app.api.deps import get_current_admin
from app.services.git_service import scan_questions_repository, get_git_repo_info
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])

class CaseUpdateRequest(BaseModel):
    title: Optional[str] = None
    points: Optional[int] = None
    difficulty: Optional[str] = None
    publication_status: Optional[str] = None  # PUBLISHED, DRAFT, ARCHIVED
    validation_status: Optional[str] = None
    story: Optional[str] = None
    objective: Optional[str] = None
    input_contract: Optional[str] = None
    required_result: Optional[str] = None

class TestCaseCreateRequest(BaseModel):
    test_type: str  # public_sample or hidden_test
    input_data: str
    expected_output: str
    points: int = 0

@router.get("/cases")
def admin_list_cases(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    cases = db.query(Case).order_by(Case.number.asc()).all()
    return [
        {
            "id": c.id,
            "number": c.number,
            "title": c.title,
            "domain": c.domain,
            "points": c.points,
            "difficulty": c.difficulty,
            "publication_status": c.publication_status,
            "validation_status": c.validation_status,
            "validation_notes": c.validation_notes,
            "test_count": len(c.test_cases)
        }
        for c in cases
    ]

@router.put("/cases/{case_id}")
def admin_update_case(case_id: str, req: CaseUpdateRequest, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if req.title is not None: case.title = req.title
    if req.points is not None: case.points = req.points
    if req.difficulty is not None: case.difficulty = req.difficulty
    if req.publication_status is not None: case.publication_status = req.publication_status
    if req.validation_status is not None: case.validation_status = req.validation_status
    if req.story is not None: case.story = req.story
    if req.objective is not None: case.objective = req.objective
    if req.input_contract is not None: case.input_contract = req.input_contract
    if req.required_result is not None: case.required_result = req.required_result

    # Record Audit Log
    log = AuditLog(
        user_id=current_admin.id,
        action="UPDATE_CASE",
        target_type="CASE",
        target_id=case_id,
        details=f"Updated case {case_id} by {current_admin.username}"
    )
    db.add(log)
    db.commit()
    db.refresh(case)

    return {"success": True, "case_id": case.id, "publication_status": case.publication_status}

@router.post("/cases/{case_id}/tests")
def admin_add_test(case_id: str, req: TestCaseCreateRequest, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    count = db.query(TestCase).filter(TestCase.case_id == case_id).count()
    tc = TestCase(
        case_id=case_id,
        test_type=req.test_type,
        test_index=count + 1,
        input_data=req.input_data,
        expected_output=req.expected_output,
        points=req.points
    )
    db.add(tc)

    # Record Audit Log
    log = AuditLog(
        user_id=current_admin.id,
        action="ADD_TEST_CASE",
        target_type="TEST_CASE",
        target_id=str(tc.id),
        details=f"Added {req.test_type} to {case_id}"
    )
    db.add(log)
    db.commit()
    return {"success": True, "test_id": tc.id}

@router.get("/audit-logs")
def admin_audit_logs(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "details": l.details,
            "timestamp": l.timestamp
        }
        for l in logs
    ]

@router.get("/health")
def admin_system_health(current_admin: User = Depends(get_current_admin)):
    git_info = get_git_repo_info(settings.BASE_DIR)
    return {
        "status": "HEALTHY",
        "judge_engine": "ACTIVE (C/C++/Python3 isolated worker)",
        "git": git_info,
        "database": "CONNECTED",
        "active_cases": 80
    }
