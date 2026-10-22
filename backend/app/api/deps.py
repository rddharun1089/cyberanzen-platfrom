from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, UserRole
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def get_current_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if not UserRole.is_admin_or_super(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Administrator clearance required for this operation."
        )
    return current_user

def get_current_event_admin(current_user: User = Depends(get_current_user)) -> User:
    allowed_roles = [
        UserRole.SUPER_ADMIN.value, UserRole.EVENT_ADMIN.value,
        UserRole.ADMIN.value, "super_admin", "event_admin", "admin"
    ]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Event Administrator clearance required for this operation."
        )
    return current_user

def get_current_challenge_author(current_user: User = Depends(get_current_user)) -> User:
    if not UserRole.can_author_challenges(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Challenge Author clearance required for this operation."
        )
    return current_user

def get_current_judge_operator(current_user: User = Depends(get_current_user)) -> User:
    allowed_roles = [
        UserRole.SUPER_ADMIN.value, UserRole.JUDGE_OPERATOR.value,
        UserRole.ADMIN.value, "super_admin", "judge_operator", "admin"
    ]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Judge Operator clearance required for this operation."
        )
    return current_user

def get_current_proctor(current_user: User = Depends(get_current_user)) -> User:
    allowed_roles = [
        UserRole.SUPER_ADMIN.value, UserRole.EVENT_ADMIN.value, UserRole.PROCTOR.value,
        UserRole.ADMIN.value, "super_admin", "event_admin", "proctor", "admin"
    ]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Proctor clearance required for this operation."
        )
    return current_user

def get_current_auditor(current_user: User = Depends(get_current_user)) -> User:
    allowed_roles = [
        UserRole.SUPER_ADMIN.value, UserRole.EVENT_ADMIN.value, UserRole.AUDITOR.value,
        UserRole.ADMIN.value, "super_admin", "event_admin", "auditor", "admin"
    ]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Auditor clearance required for this operation."
        )
    return current_user

# Legacy backward-compatible admin dependency
def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not UserRole.has_admin_privileges(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative authorization required."
        )
    return current_user
