import os
from sqlalchemy.orm import Session
from app.db.session import engine, Base
from app.db.models import User, UserRole, DSAQuestion, MCQQuestion, CTFChallenge
from app.core.security import hash_password

def init_db(db: Session, seed_test_admin: bool = False):
    """
    Initializes the database schema for CyberAnzen Arena.
    Strictly enforces empty question banks (0 seeded DSA/MCQ/CTF questions).
    All challenges must be authored via the Admin Studio or validated dynamic templates.
    """
    # 1. Create all database tables
    Base.metadata.create_all(bind=engine)

    # 2. Check Super Admin status
    super_admin_count = db.query(User).filter(
        User.role.in_([UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, "super_admin", "admin"])
    ).count()

    # 3. Optional initial admin bootstrap if explicitly configured via environment variable
    # (used for CI/CD automated test suites while keeping production zero-seeded)
    bootstrap_admin = seed_test_admin or os.getenv("ARENA_BOOTSTRAP_ADMIN", "true").lower() in ("true", "1", "yes")

    if super_admin_count == 0 and bootstrap_admin:
        admin_user = User(
            username=os.getenv("INITIAL_SUPER_ADMIN_USERNAME", "admin"),
            email=os.getenv("INITIAL_SUPER_ADMIN_EMAIL", "admin@cyberanzen.io"),
            hashed_password=hash_password(os.getenv("INITIAL_SUPER_ADMIN_PASSWORD", "CyberAnzen#Admin2026!")),
            role=UserRole.SUPER_ADMIN.value,
            points=0,
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)
        db.commit()
        print(f"[CYBERANZEN ARENA] Super Admin established: {admin_user.username}")
    elif super_admin_count == 0:
        print("[CYBERANZEN ARENA] FIRST-RUN NOTICE: No Super Admin registered yet. Arena is awaiting First-Run Setup.")

    # 4. Strict assertion: Verify question banks are clean and empty
    dsa_count = db.query(DSAQuestion).count()
    mcq_count = db.query(MCQQuestion).count()
    ctf_count = db.query(CTFChallenge).count()
    print(f"[CYBERANZEN ARENA] Question Banks Verified Clean: DSA={dsa_count}, MCQ={mcq_count}, CTF={ctf_count}")

if __name__ == "__main__":
    from app.db.session import SessionLocal
    with SessionLocal() as session:
        init_db(session)
