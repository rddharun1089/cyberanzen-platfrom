from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, UserRole
from app.core.security import verify_password, hash_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str
    points: int

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid investigator callsign or passkey"
        )
    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
        "points": user.points
    }

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Callsign already assigned to an agent")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email address already registered")

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        role=UserRole.PARTICIPANT.value,
        points=0
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username, "role": user.role, "id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
        "points": user.points
    }

@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "points": current_user.points,
        "created_at": current_user.created_at
    }
