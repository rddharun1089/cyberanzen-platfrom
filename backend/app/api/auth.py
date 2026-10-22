from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, UserRole, AuditLog
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class FirstRunSetupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    organization_name: Optional[str] = "CyberAnzen Arena"

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

@router.get("/setup-status")
def get_setup_status(db: Session = Depends(get_db)):
    """
    Checks whether the platform requires initial Super Admin setup.
    Returns True if no Super Admin or Admin account exists.
    """
    admin_count = db.query(User).filter(
        User.role.in_([UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, "super_admin", "admin"])
    ).count()

    return {
        "is_setup_needed": admin_count == 0,
        "platform_status": "PENDING_SETUP" if admin_count == 0 else "OPERATIONAL"
    }

@router.post("/first-run-setup")
def first_run_setup(req: FirstRunSetupRequest, db: Session = Depends(get_db)):
    """
    One-time initial Super Admin setup flow.
    Permanently locked down once the first administrative account is created.
    """
    admin_count = db.query(User).filter(
        User.role.in_([UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, "super_admin", "admin"])
    ).count()

    if admin_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="First-run setup has already been completed. Contact existing Super Administrator."
        )

    if len(req.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super Admin passphrase must be at least 8 characters in length."
        )

    super_admin = User(
        username=req.username.strip(),
        email=req.email.strip().lower(),
        hashed_password=hash_password(req.password),
        role=UserRole.SUPER_ADMIN.value,
        points=0,
        is_active=True,
        is_verified=True
    )
    db.add(super_admin)
    db.commit()
    db.refresh(super_admin)

    # Log milestone audit event
    log = AuditLog(
        actor_id=super_admin.id,
        actor_username=super_admin.username,
        action="PLATFORM_INITIAL_SETUP",
        entity_type="SYSTEM",
        entity_id="1",
        details=f"Super Admin initialized for organization: {req.organization_name}"
    )
    db.add(log)
    db.commit()

    token = create_access_token(data={"sub": super_admin.username, "role": super_admin.role})
    return {
        "success": True,
        "message": "Super Administrator established successfully.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": super_admin.id,
            "username": super_admin.username,
            "email": super_admin.email,
            "role": super_admin.role
        }
    }

@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    username_clean = req.username.strip()
    email_clean = req.email.strip().lower()

    if db.query(User).filter(User.username == username_clean).first():
        raise HTTPException(status_code=400, detail="Username is already claimed in the Arena.")

    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(status_code=400, detail="Email address is already registered.")

    user = User(
        username=username_clean,
        email=email_clean,
        hashed_password=hash_password(req.password),
        role=UserRole.PARTICIPANT.value,
        points=0,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "points": user.points
    }

@router.post("/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username.strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid clearance credentials or passphrase."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended. Contact an administrator."
        )

    token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "points": user.points
    }

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    team_info = None
    if current_user.team_membership and current_user.team_membership.team:
        team = current_user.team_membership.team
        team_info = {
            "id": team.id,
            "name": team.name,
            "role": current_user.team_membership.role,
            "points": team.points,
            "invitation_code": team.invitation_code
        }

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "points": current_user.points,
        "is_active": current_user.is_active,
        "team": team_info,
        "created_at": current_user.created_at
    }

@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current passphrase verification failed.")

    current_user.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"success": True, "message": "Passphrase updated successfully."}
