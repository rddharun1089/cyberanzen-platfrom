import os
import sys

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.session import SessionLocal
from app.db.models import (
    User, Team, TeamMembership, TeamSolvedCase,
    Event, EventRegistration, EventDSAQuestion, EventCTFChallenge, EventMCQQuestion,
    DSAQuestion, DSATestCase, MCQQuestion, MCQAttempt, CTFChallenge, DynamicFlag,
    DockerLabInstance, Submission, Solve, EventActivityLog
)

def run_cleanup():
    with SessionLocal() as db:
        print("[-] Locating event 'demo 1'...")
        demo_event = db.query(Event).filter(
            (Event.slug == "demo-1") | (Event.title.ilike("%demo 1%"))
        ).first()

        if not demo_event:
            print("[!] Event 'demo 1' not found!")
            return

        demo_event_id = demo_event.id
        demo_links = db.query(EventDSAQuestion).filter(EventDSAQuestion.event_id == demo_event_id).all()
        demo_question_ids = [l.question_id for l in demo_links]

        print(f"[+] Preserving Event ID: #{demo_event_id} ({demo_event.title})")
        print(f"[+] Preserving Question IDs: {demo_question_ids}")

        # 1. Clear team solves, memberships, squads
        db.query(TeamSolvedCase).delete()
        db.query(TeamMembership).delete()
        db.query(Team).delete()

        # 2. Clear non-admin users (preserve admin accounts)
        admin_roles = ["super_admin", "admin", "event_admin"]
        del_users = db.query(User).filter(~User.role.in_(admin_roles)).delete(synchronize_session=False)
        print(f"[-] Removed {del_users} non-admin participant accounts.")

        # 3. Clear all other events & registrations
        del_other_regs = db.query(EventRegistration).filter(EventRegistration.event_id != demo_event_id).delete(synchronize_session=False)
        del_ctf_links = db.query(EventCTFChallenge).delete()
        del_mcq_links = db.query(EventMCQQuestion).delete()
        del_other_dsa_links = db.query(EventDSAQuestion).filter(EventDSAQuestion.event_id != demo_event_id).delete(synchronize_session=False)
        del_other_events = db.query(Event).filter(Event.id != demo_event_id).delete(synchronize_session=False)
        print(f"[-] Removed other events: {del_other_events}, links: DSA={del_other_dsa_links}, CTF={del_ctf_links}, MCQ={del_mcq_links}")

        # 4. Clear all questions EXCEPT demo 1's questions
        del_other_tc = db.query(DSATestCase).filter(~DSATestCase.question_id.in_(demo_question_ids)).delete(synchronize_session=False)
        del_other_dsa_q = db.query(DSAQuestion).filter(~DSAQuestion.id.in_(demo_question_ids)).delete(synchronize_session=False)
        print(f"[-] Removed other DSA questions: {del_other_dsa_q}, test cases: {del_other_tc}")

        # 5. Clear CTF & MCQ questions
        del_docker = db.query(DockerLabInstance).delete()
        del_flags = db.query(DynamicFlag).delete()
        del_ctf = db.query(CTFChallenge).delete()
        del_mcq_att = db.query(MCQAttempt).delete()
        del_mcq = db.query(MCQQuestion).delete()
        print(f"[-] Removed CTF: {del_ctf}, MCQ: {del_mcq}")

        # 6. Clear solves & submissions not linked to demo-1
        db.query(Solve).filter(Solve.event_id != demo_event_id).delete(synchronize_session=False)
        db.query(Submission).filter(Submission.event_id != demo_event_id).delete(synchronize_session=False)

        # Ensure demo-1 has enable_mentor = True
        demo_event.status = "active"
        demo_event.visibility = "public"

        db.commit()

        # Verification print
        remaining_events = db.query(Event).all()
        remaining_questions = db.query(DSAQuestion).all()
        admins = db.query(User).all()

        print("==================================================")
        print(f"SUCCESS: Database cleaned successfully!")
        print(f"Remaining Events ({len(remaining_events)}):")
        for e in remaining_events:
            print(f"  - ID #{e.id}: {e.title} (slug: {e.slug})")
        print(f"Remaining DSA Questions ({len(remaining_questions)}):")
        for q in remaining_questions:
            print(f"  - ID #{q.id}: {q.title} ({q.difficulty} - {q.points} PTS)")
        print(f"Admin Accounts ({len(admins)}):")
        for a in admins:
            print(f"  - {a.username} ({a.role})")
        print("==================================================")

if __name__ == "__main__":
    run_cleanup()
