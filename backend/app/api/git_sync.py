from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, GitSyncRecord, Case, AuditLog
from app.api.deps import get_current_admin
from app.services.git_service import scan_questions_repository, get_git_repo_info
from app.core.config import settings
from app.db.init_db import init_db

router = APIRouter(prefix="/admin/git", tags=["Git Question Management"])

class GitPreviewRequest(BaseModel):
    repo_path: Optional[str] = None

class GitSyncRequest(BaseModel):
    repo_path: Optional[str] = None
    publish_validated: bool = False

@router.post("/preview")
def git_preview_import(req: GitPreviewRequest, current_admin: User = Depends(get_current_admin)):
    target_path = req.repo_path or settings.QUESTIONS_DIR
    scan_res = scan_questions_repository(target_path)
    git_info = get_git_repo_info(settings.BASE_DIR)
    return {
        "git_info": git_info,
        "scan_summary": scan_res
    }

@router.post("/sync")
def git_sync_questions(req: GitSyncRequest, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    target_path = req.repo_path or settings.QUESTIONS_DIR
    scan_res = scan_questions_repository(target_path)
    if not scan_res["success"]:
        raise HTTPException(status_code=400, detail=scan_res.get("error", "Scan failed"))

    git_info = get_git_repo_info(settings.BASE_DIR)

    # Record Git Sync
    sync_rec = GitSyncRecord(
        repo_url=target_path,
        branch=git_info.get("branch") or "main",
        last_commit=git_info.get("commit_hash") or "local",
        status="SUCCESS",
        preview_diff=f"Synchronized {scan_res['valid_count']} valid cases."
    )
    db.add(sync_rec)

    # Audit log
    audit = AuditLog(
        user_id=current_admin.id,
        action="GIT_SYNC",
        target_type="QUESTIONS_REPO",
        target_id=git_info.get("commit_hash") or "local",
        details=f"Synced questions: {scan_res['valid_count']} valid, {scan_res['invalid_count']} invalid"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "synced_cases": scan_res["valid_count"],
        "invalid_cases": scan_res["invalid_count"],
        "last_commit": git_info.get("commit_hash")
    }
