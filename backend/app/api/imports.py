from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, HttpUrl
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
import secrets
import os

from app.db.session import get_db
from app.db.models import User, DSAQuestion, DSATestCase, QuestionImportJob, AuditLog
from app.api.deps import get_current_admin, get_current_challenge_author
from app.services.question_importer import QuestionImporterService
from app.judge.worker import evaluate_submission

router = APIRouter(prefix="/imports", tags=["DSA Question Import Engine"])

class GitImportRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = None
    commit_sha: Optional[str] = None

class PublishImportedQuestionsRequest(BaseModel):
    question_indices: List[int]
    status: Optional[str] = "published"  # draft | published

class UpdateExtractedQuestionRequest(BaseModel):
    title: Optional[str] = None
    statement: Optional[str] = None
    input_spec: Optional[str] = None
    output_spec: Optional[str] = None
    constraints: Optional[str] = None
    difficulty: Optional[str] = None
    points: Optional[int] = None
    reference_solution: Optional[str] = None
    public_test_cases: Optional[List[Dict[str, Any]]] = None
    hidden_test_cases: Optional[List[Dict[str, Any]]] = None

# ==============================================================================
# 1. FILE UPLOAD & EXTRACTION (PDF, DOCX, Markdown, JSON, CSV, ZIP)
# ==============================================================================

@router.post("/upload")
async def import_from_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Document bundle exceeds 25MB safety threshold.")

    extracted = []
    source_type = "file"
    try:
        if ext == ".pdf":
            source_type = "pdf"
            extracted = QuestionImporterService.extract_from_pdf(content, filename)
        elif ext in (".docx", ".doc"):
            source_type = "docx"
            extracted = QuestionImporterService.extract_from_docx(content, filename)
        elif ext in (".md", ".markdown", ".txt"):
            source_type = "markdown"
            extracted = QuestionImporterService.extract_from_markdown(content.decode("utf-8", errors="ignore"), filename)
        elif ext == ".json":
            source_type = "json"
            extracted = QuestionImporterService.extract_from_json(content.decode("utf-8", errors="ignore"), filename)
        elif ext == ".csv":
            source_type = "csv"
            extracted = QuestionImporterService.extract_from_csv(content.decode("utf-8", errors="ignore"), filename)
        elif ext == ".zip":
            source_type = "zip"
            extracted = QuestionImporterService.extract_from_zip(content, filename)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document format '{ext}'. Supported: PDF, DOCX, Markdown, JSON, CSV, ZIP."
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Document parsing error: {str(e)}")

    if not extracted:
        raise HTTPException(status_code=400, detail="No valid questions or technical statements could be extracted.")

    job = QuestionImportJob(
        created_by_id=admin.id,
        source_type=source_type,
        source_name=filename,
        status="extracted",
        total_detected=len(extracted),
        total_imported=0,
        extracted_data_json=json.dumps(extracted)
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    db.add(AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="IMPORT_QUESTIONS_UPLOAD",
        entity_type="IMPORT_JOB",
        entity_id=str(job.id),
        details=json.dumps({"source_name": filename, "source_type": source_type, "detected": len(extracted)})
    ))
    db.commit()

    return {
        "success": True,
        "job_id": job.id,
        "source_type": source_type,
        "total_detected": len(extracted),
        "status": job.status
    }

# ==============================================================================
# 2. GIT REPOSITORY EXTRACTION
# ==============================================================================

@router.post("/git")
def import_from_git(
    req: GitImportRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    try:
        extracted = QuestionImporterService.extract_from_git(req.repo_url, req.branch, req.commit_sha)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Git extraction failed: {str(e)}")

    if not extracted:
        raise HTTPException(status_code=400, detail="No question documents or manifests detected in target Git repository.")

    job = QuestionImportJob(
        created_by_id=admin.id,
        source_type="git",
        source_name=req.repo_url,
        status="extracted",
        total_detected=len(extracted),
        total_imported=0,
        extracted_data_json=json.dumps(extracted)
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return {
        "success": True,
        "job_id": job.id,
        "source_type": "git",
        "total_detected": len(extracted),
        "status": job.status
    }

# ==============================================================================
# 3. JOB INSPECTION & REVIEW TABLE
# ==============================================================================

@router.get("/jobs")
def list_import_jobs(
    limit: int = 20,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    jobs = db.query(QuestionImportJob).order_by(QuestionImportJob.id.desc()).limit(limit).all()
    return [
        {
            "id": j.id,
            "source_type": j.source_type,
            "source_name": j.source_name,
            "status": j.status,
            "total_detected": j.total_detected,
            "total_imported": j.total_imported,
            "created_at": j.created_at
        }
        for j in jobs
    ]

@router.get("/jobs/{job_id}")
def get_import_job(
    job_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    job = db.query(QuestionImportJob).filter(QuestionImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found.")

    questions = json.loads(job.extracted_data_json) if job.extracted_data_json else []
    return {
        "id": job.id,
        "source_type": job.source_type,
        "source_name": job.source_name,
        "status": job.status,
        "total_detected": job.total_detected,
        "total_imported": job.total_imported,
        "questions": questions,
        "created_at": job.created_at
    }

# ==============================================================================
# 4. QUESTION EDITING & PRE-FLIGHT VALIDATION IN JUDGE SANDBOX
# ==============================================================================

@router.put("/jobs/{job_id}/question/{question_idx}")
def update_extracted_question(
    job_id: int,
    question_idx: int,
    req: UpdateExtractedQuestionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    job = db.query(QuestionImportJob).filter(QuestionImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found.")

    questions = json.loads(job.extracted_data_json) if job.extracted_data_json else []
    if question_idx < 0 or question_idx >= len(questions):
        raise HTTPException(status_code=404, detail="Question index out of range.")

    target = questions[question_idx]
    if req.title is not None:
        target["title"] = req.title.strip()
    if req.statement is not None:
        target["statement"] = req.statement.strip()
    if req.input_spec is not None:
        target["input_spec"] = req.input_spec.strip()
    if req.output_spec is not None:
        target["output_spec"] = req.output_spec.strip()
    if req.constraints is not None:
        target["constraints"] = req.constraints.strip()
    if req.difficulty is not None:
        target["difficulty"] = req.difficulty
    if req.points is not None:
        target["points"] = req.points
    if req.reference_solution is not None:
        target["reference_solution"] = req.reference_solution
    if req.public_test_cases is not None:
        target["public_test_cases"] = req.public_test_cases
    if req.hidden_test_cases is not None:
        target["hidden_test_cases"] = req.hidden_test_cases

    # Re-normalize to update warnings
    updated = QuestionImporterService.normalize_question(target, target.get("source_type", "edit"), target.get("source_document", "editor"))
    questions[question_idx] = updated

    job.extracted_data_json = json.dumps(questions)
    db.commit()

    return {"success": True, "question": updated}

@router.post("/jobs/{job_id}/validate/{question_idx}")
def validate_against_sandbox(
    job_id: int,
    question_idx: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Executes the extracted question's reference solution against its test cases
    in the live POSIX sandboxed judge worker.
    """
    job = db.query(QuestionImportJob).filter(QuestionImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found.")

    questions = json.loads(job.extracted_data_json) if job.extracted_data_json else []
    if question_idx < 0 or question_idx >= len(questions):
        raise HTTPException(status_code=404, detail="Question index out of range.")

    target = questions[question_idx]
    ref_code = target.get("reference_solution", "").strip()
    if not ref_code:
        raise HTTPException(status_code=400, detail="Cannot validate: No reference solution provided for this question.")

    test_cases = target.get("public_test_cases", []) + target.get("hidden_test_cases", [])
    if not test_cases:
        raise HTTPException(status_code=400, detail="Cannot validate: No test cases attached to question.")

    formatted_test_cases = [
        {
            "id": str(i + 1),
            "input": tc.get("input") or tc.get("input_data", ""),
            "output": tc.get("output") or tc.get("expected_output", ""),
            "points": tc.get("points", 10),
            "type": tc.get("test_type", "public")
        }
        for i, tc in enumerate(test_cases)
    ]

    # Evaluate in judge sandbox
    res = evaluate_submission(
        language="python3",
        source_code=ref_code,
        test_cases=formatted_test_cases,
        time_limit_ms=target.get("time_limit_ms", 2000),
        memory_limit_mb=target.get("memory_limit_mb", 256)
    )

    verdict = res["verdict"]
    test_results = res.get("test_results", [])
    passed_count = sum(1 for tr in test_results if tr.get("verdict") == "ACCEPTED")
    total_tests = len(test_results)
    is_valid = (verdict == "ACCEPTED")

    target["sandbox_verdict"] = verdict
    target["sandbox_passed_count"] = passed_count
    target["sandbox_total_tests"] = total_tests
    target["validation_status"] = "VALIDATED" if is_valid else "VALIDATION_FAILED"

    questions[question_idx] = target
    job.extracted_data_json = json.dumps(questions)
    db.commit()

    return {
        "success": True,
        "is_valid": is_valid,
        "verdict": verdict,
        "passed_count": passed_count,
        "total_tests": total_tests,
        "compile_log": res.get("compile_log", ""),
        "test_results": test_results
    }

# ==============================================================================
# 5. APPROVAL & PUBLICATION INTO CENTRAL QUESTION BANK
# ==============================================================================

@router.post("/jobs/{job_id}/publish")
def publish_imported_questions(
    job_id: int,
    req: PublishImportedQuestionsRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    job = db.query(QuestionImportJob).filter(QuestionImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found.")

    questions = json.loads(job.extracted_data_json) if job.extracted_data_json else []
    created_ids = []

    for idx in req.question_indices:
        if idx < 0 or idx >= len(questions):
            continue
        q_data = questions[idx]

        slug = q_data["title"].lower().replace(" ", "-").replace("/", "-")
        slug = "".join(c for c in slug if c.isalnum() or c == "-")
        existing_slug = db.query(DSAQuestion).filter(DSAQuestion.slug == slug).first()
        if existing_slug:
            slug = f"{slug}-{secrets.token_hex(3)}"

        new_q = DSAQuestion(
            slug=slug,
            title=q_data["title"],
            statement=q_data["statement"],
            input_spec=q_data["input_spec"],
            output_spec=q_data["output_spec"],
            constraints=q_data.get("constraints", ""),
            difficulty=q_data.get("difficulty", "Beginner"),
            category=q_data.get("category", "Data Structures & Algorithms"),
            points=q_data.get("points", 100),
            time_limit_ms=q_data.get("time_limit_ms", 2000),
            memory_limit_mb=q_data.get("memory_limit_mb", 256),
            supported_languages=json.dumps(q_data.get("supported_languages", ["python3", "cpp", "c"])),
            starter_py=q_data.get("starter_py", ""),
            starter_cpp=q_data.get("starter_cpp", ""),
            starter_c=q_data.get("starter_c", ""),
            reference_solution=q_data.get("reference_solution", ""),
            status=req.status or "published",
            created_by_id=admin.id
        )
        db.add(new_q)
        db.commit()
        db.refresh(new_q)

        # Create public test cases
        for t_idx, tc in enumerate(q_data.get("public_test_cases", [])):
            db.add(DSATestCase(
                question_id=new_q.id,
                test_type="public_sample",
                test_index=t_idx + 1,
                input_data=tc["input_data"],
                expected_output=tc["expected_output"],
                points=0
            ))

        # Create hidden test cases
        for t_idx, tc in enumerate(q_data.get("hidden_test_cases", [])):
            db.add(DSATestCase(
                question_id=new_q.id,
                test_type="hidden_test",
                test_index=t_idx + 1,
                input_data=tc["input_data"],
                expected_output=tc["expected_output"],
                points=tc.get("points", 0)
            ))

        db.commit()
        created_ids.append(new_q.id)

    job.total_imported += len(created_ids)
    if job.total_imported >= job.total_detected:
        job.status = "completed"
    db.commit()

    db.add(AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="PUBLISH_IMPORTED_QUESTIONS",
        entity_type="IMPORT_JOB",
        entity_id=str(job.id),
        details=json.dumps({"created_question_ids": created_ids, "status": req.status})
    ))
    db.commit()

    return {
        "success": True,
        "message": f"Successfully ingested {len(created_ids)} questions into the DSA Question Bank.",
        "created_question_ids": created_ids,
        "job_status": job.status
    }
