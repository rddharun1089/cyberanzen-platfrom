from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.db.models import Case, TestCase, Submission, User, PublicationStatus
from app.api.deps import get_current_user

router = APIRouter(prefix="/cases", tags=["Investigation Archive"])

@router.get("")
def list_cases(
    domain: Optional[str] = Query(None, description="Filter by technical domain"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    phase: Optional[str] = Query(None, description="Filter by investigative phase"),
    search: Optional[str] = Query(None, description="Search case titles or narratives"),
    db: Session = Depends(get_db)
):
    query = db.query(Case).filter(Case.publication_status == PublicationStatus.PUBLISHED.value)

    if domain:
        query = query.filter(Case.domain == domain)
    if difficulty:
        query = query.filter(Case.difficulty == difficulty)
    if phase:
        query = query.filter(Case.phase.ilike(f"%{phase}%"))
    if search:
        query = query.filter(or_(Case.title.ilike(f"%{search}%"), Case.story.ilike(f"%{search}%")))

    cases = query.order_by(Case.number.asc()).all()
    
    return [
        {
            "id": c.id,
            "number": c.number,
            "title": c.title,
            "phase": c.phase,
            "domain": c.domain,
            "points": c.points,
            "difficulty": c.difficulty,
            "time_limit_ms": c.time_limit_ms,
            "memory_limit_mb": c.memory_limit_mb,
            "validation_status": c.validation_status
        }
        for c in cases
    ]

@router.get("/{case_id}")
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case dossier not found")

    # Fetch ONLY public samples, never hidden tests!
    samples = db.query(TestCase).filter(
        TestCase.case_id == case_id,
        TestCase.test_type == "public_sample"
    ).all()

    return {
        "id": case.id,
        "number": case.number,
        "title": case.title,
        "phase": case.phase,
        "domain": case.domain,
        "points": case.points,
        "difficulty": case.difficulty,
        "time_limit_ms": case.time_limit_ms,
        "memory_limit_mb": case.memory_limit_mb,
        "validation_status": case.validation_status,
        "story": case.story,
        "objective": case.objective,
        "input_contract": case.input_contract,
        "required_result": case.required_result,
        "constraints": case.constraints,
        "starter_code": {
            "python3": case.starter_py,
            "cpp": case.starter_cpp,
            "c": case.starter_c
        },
        "sample_tests": [
            {
                "id": s.id,
                "input": s.input_data,
                "output": s.expected_output
            }
            for s in samples
        ]
    }
