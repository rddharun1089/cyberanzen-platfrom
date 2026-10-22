from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.db.session import get_db
from app.db.models import DockerLabInstance, CTFChallenge, User, LabStatus
from app.api.deps import get_current_user
from app.services.lab_service import DockerLabService

router = APIRouter(prefix="/labs", tags=["Docker Interactive Challenge Labs"])

def get_remaining_seconds(expires_at) -> int:
    if expires_at is None:
        return 0
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    return max(0, int((expires_at - now).total_seconds()))

@router.post("/challenges/{challenge_id}/launch")
def launch_challenge_lab(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    challenge = db.query(CTFChallenge).filter(CTFChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    if not challenge.has_docker_lab:
        raise HTTPException(status_code=400, detail="This challenge does not have an interactive lab environment.")

    team_id = current_user.team_membership.team_id if current_user.team_membership else None

    # Launch instance using isolated service
    instance = DockerLabService.launch_instance(
        db=db,
        challenge=challenge,
        user_id=current_user.id,
        team_id=team_id,
        duration_minutes=challenge.lab_timeout_min or 60
    )

    remaining_sec = get_remaining_seconds(instance.expires_at)

    return {
        "success": True,
        "instance_id": instance.id,
        "challenge_id": challenge.id,
        "status": instance.status,
        "access_host": instance.access_host,
        "access_port": instance.access_port,
        "access_url": f"http://{instance.access_host}:{instance.access_port}",
        "expires_at": instance.expires_at,
        "remaining_seconds": remaining_sec
    }

@router.post("/instances/{instance_id}/stop")
def stop_challenge_lab(
    instance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    instance = db.query(DockerLabInstance).filter(DockerLabInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Lab instance not found.")

    # Authorization check
    if instance.user_id != current_user.id and not UserRole.is_admin_or_super(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to stop this lab instance.")

    stopped = DockerLabService.stop_instance(db, instance_id)
    return {"success": stopped, "instance_id": instance_id, "status": LabStatus.STOPPED.value}

@router.post("/instances/{instance_id}/reset")
def reset_challenge_lab(
    instance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    instance = db.query(DockerLabInstance).filter(DockerLabInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Lab instance not found.")

    if instance.user_id != current_user.id and not UserRole.is_admin_or_super(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to reset this lab instance.")

    new_inst = DockerLabService.reset_instance(db, instance_id)
    if not new_inst:
        raise HTTPException(status_code=500, detail="Failed to reset lab instance.")

    remaining_sec = get_remaining_seconds(new_inst.expires_at)
    return {
        "success": True,
        "instance_id": new_inst.id,
        "status": new_inst.status,
        "access_host": new_inst.access_host,
        "access_port": new_inst.access_port,
        "access_url": f"http://{new_inst.access_host}:{new_inst.access_port}",
        "expires_at": new_inst.expires_at,
        "remaining_seconds": remaining_sec
    }

@router.get("/instances/{instance_id}/status")
def get_lab_status(
    instance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    instance = db.query(DockerLabInstance).filter(DockerLabInstance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Lab instance not found.")

    if instance.user_id != current_user.id and not UserRole.is_admin_or_super(current_user.role):
        raise HTTPException(status_code=403, detail="Not authorized to inspect this lab instance.")

    remaining_sec = get_remaining_seconds(instance.expires_at)

    return {
        "instance_id": instance.id,
        "challenge_id": instance.challenge_id,
        "status": instance.status,
        "access_host": instance.access_host,
        "access_port": instance.access_port,
        "access_url": f"http://{instance.access_host}:{instance.access_port}",
        "expires_at": instance.expires_at,
        "remaining_seconds": remaining_sec
    }
