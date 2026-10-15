import os
import json
import glob
from sqlalchemy.orm import Session
from app.db.session import engine, Base, SessionLocal
from app.db.models import User, Case, TestCase, UserRole, PublicationStatus, ValidationStatus
from app.core.security import hash_password
from app.core.config import settings

def init_db(db: Session):
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # 1. Seed Administrator
    admin = db.query(User).filter(User.username == "lead_investigator").first()
    if not admin:
        admin = User(
            username="lead_investigator",
            email="investigator@cyberanzen.local",
            hashed_password=hash_password("Investigator#2026!"),
            role=UserRole.ADMIN.value,
            points=0,
            is_active=True
        )
        db.add(admin)
        print("Created Admin: lead_investigator (password: Investigator#2026!)")

    # 2. Seed Sample Participant
    user = db.query(User).filter(User.username == "cadet_forensic").first()
    if not user:
        user = User(
            username="cadet_forensic",
            email="cadet@cyberanzen.local",
            hashed_password=hash_password("Investigator#2026!"),
            role=UserRole.PARTICIPANT.value,
            points=0,
            is_active=True
        )
        db.add(user)
        print("Created Participant: cadet_forensic (password: Investigator#2026!)")

    db.commit()

    # 3. Seed 80 Cases from questions directory
    q_dirs = sorted(glob.glob(os.path.join(settings.QUESTIONS_DIR, "CASE-*")))
    print(f"Found {len(q_dirs)} question packages to seed...")

    for qdir in q_dirs:
        cid = os.path.basename(qdir)
        meta_file = os.path.join(qdir, "metadata.json")
        prob_file = os.path.join(qdir, "problem.md")
        val_file = os.path.join(qdir, "validation.json")
        ref_file = os.path.join(qdir, "reference", "solution.py")

        if not os.path.exists(meta_file):
            continue

        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)

        problem_md = ""
        if os.path.exists(prob_file):
            with open(prob_file, "r", encoding="utf-8") as f:
                problem_md = f.read()

        ref_sol = ""
        if os.path.exists(ref_file):
            with open(ref_file, "r", encoding="utf-8") as f:
                ref_sol = f.read()

        val_notes = ""
        if os.path.exists(val_file):
            with open(val_file, "r", encoding="utf-8") as f:
                val_data = json.load(f)
                val_notes = "; ".join(val_data.get("issues", []))

        # Starter codes
        s_py = open(os.path.join(qdir, "starter", "main.py")).read() if os.path.exists(os.path.join(qdir, "starter", "main.py")) else ""
        s_cpp = open(os.path.join(qdir, "starter", "main.cpp")).read() if os.path.exists(os.path.join(qdir, "starter", "main.cpp")) else ""
        s_c = open(os.path.join(qdir, "starter", "main.c")).read() if os.path.exists(os.path.join(qdir, "starter", "main.c")) else ""

        existing_case = db.query(Case).filter(Case.id == cid).first()
        if not existing_case:
            case_obj = Case(
                id=cid,
                number=meta["number"],
                title=meta["title"],
                phase=meta["phase"],
                domain=meta["domain"],
                points=meta["points"],
                difficulty=meta["difficulty"],
                time_limit_ms=meta.get("time_limit_ms", 2000),
                memory_limit_mb=meta.get("memory_limit_mb", 256),
                flag_format=meta.get("flag_format", f"FLAG{{{cid}_RESULT}}"),
                publication_status=meta.get("publication_status", PublicationStatus.PUBLISHED.value),
                validation_status=meta.get("validation_status", ValidationStatus.VALIDATED.value),
                story=problem_md,
                objective=f"Solve {meta['title']}",
                input_contract=f"Input contract for {cid}",
                required_result=f"Required result for {cid}",
                constraints="Standard runtime constraints apply",
                starter_py=s_py,
                starter_cpp=s_cpp,
                starter_c=s_c,
                reference_solution=ref_sol,
                validation_notes=val_notes
            )
            db.add(case_obj)
            db.commit()

            # Seed Test Cases
            # 1. Public sample
            s_in = os.path.join(qdir, "samples", "sample1.in")
            s_out = os.path.join(qdir, "samples", "sample1.out")
            if os.path.exists(s_in) and os.path.exists(s_out):
                tc_sample = TestCase(
                    case_id=cid,
                    test_type="public_sample",
                    test_index=1,
                    input_data=open(s_in, encoding="utf-8").read(),
                    expected_output=open(s_out, encoding="utf-8").read(),
                    points=0
                )
                db.add(tc_sample)

            # 2. Hidden tests
            for t_idx, t_name in [(1, "test1"), (2, "test2")]:
                tin = os.path.join(qdir, "tests", f"{t_name}.in")
                tout = os.path.join(qdir, "tests", f"{t_name}.out")
                if os.path.exists(tin) and os.path.exists(tout):
                    tc_hidden = TestCase(
                        case_id=cid,
                        test_type="hidden_test",
                        test_index=t_idx,
                        input_data=open(tin, encoding="utf-8").read(),
                        expected_output=open(tout, encoding="utf-8").read(),
                        points=int(meta["points"] * 0.5)
                    )
                    db.add(tc_hidden)

            db.commit()

    print(f"Database bootstrap complete. Total cases in DB: {db.query(Case).count()}")

if __name__ == "__main__":
    db = SessionLocal()
    init_db(db)
    db.close()
