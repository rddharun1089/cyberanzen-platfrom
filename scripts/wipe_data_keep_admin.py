import sys
import os

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.session import SessionLocal, engine
from app.db.models import (
    User, UserRole, Team, TeamMembership, TeamSolvedCase,
    Event, EventRegistration, EventDSAQuestion, EventCTFChallenge, EventMCQQuestion,
    DSAQuestion, DSATestCase, MCQQuestion, MCQAttempt, CTFChallenge, DynamicFlag,
    DockerLabInstance, Submission, Solve, EvidenceToken, QuestionImportJob,
    ScoreAdjustment, SecurityIncident, Notification, SessionToken
)
from sqlalchemy import text

def clean_database():
    with SessionLocal() as db:
        print("==================================================")
        print("PURGING EVENTS, QUESTIONS, TEAMS & PARTICIPANTS")
        print("KEEPING ONLY ADMINISTRATOR ACCOUNTS")
        print("==================================================")

        # 1. Solves & Submissions
        del_solves = db.query(Solve).delete()
        del_subs = db.query(Submission).delete()
        print(f"[-] Cleared Solves: {del_solves}, Submissions: {del_subs}")

        # 2. Team solves & memberships & teams
        del_team_solves = db.query(TeamSolvedCase).delete()
        del_team_mems = db.query(TeamMembership).delete()
        del_teams = db.query(Team).delete()
        print(f"[-] Cleared Team Solves: {del_team_solves}, Team Memberships: {del_team_mems}, Teams: {del_teams}")

        # 3. Event associations & registrations & events
        del_event_dsa = db.query(EventDSAQuestion).delete()
        del_event_ctf = db.query(EventCTFChallenge).delete()
        del_event_mcq = db.query(EventMCQQuestion).delete()
        del_event_regs = db.query(EventRegistration).delete()
        del_events = db.query(Event).delete()
        print(f"[-] Cleared Event Links: DSA={del_event_dsa}, CTF={del_event_ctf}, MCQ={del_event_mcq}")
        print(f"[-] Cleared Event Registrations: {del_event_regs}, Events: {del_events}")

        # 4. Challenge questions
        del_docker = db.query(DockerLabInstance).delete()
        del_flags = db.query(DynamicFlag).delete()
        del_ctf = db.query(CTFChallenge).delete()
        print(f"[-] Cleared Docker Lab Instances: {del_docker}, Dynamic Flags: {del_flags}, CTF Challenges: {del_ctf}")

        del_dsa_tc = db.query(DSATestCase).delete()
        del_dsa_q = db.query(DSAQuestion).delete()
        print(f"[-] Cleared DSA Test Cases: {del_dsa_tc}, DSA Questions: {del_dsa_q}")

        del_mcq_att = db.query(MCQAttempt).delete()
        del_mcq_q = db.query(MCQQuestion).delete()
        print(f"[-] Cleared MCQ Attempts: {del_mcq_att}, MCQ Questions: {del_mcq_q}")

        # 5. Ancillary data (tokens, jobs, adjustments, incidents)
        del_evidence = db.query(EvidenceToken).delete()
        del_jobs = db.query(QuestionImportJob).delete()
        del_adj = db.query(ScoreAdjustment).delete()
        del_inc = db.query(SecurityIncident).delete()
        del_notif = db.query(Notification).delete()
        print(f"[-] Cleared Evidence: {del_evidence}, Import Jobs: {del_jobs}, Score Adjustments: {del_adj}, Incidents: {del_inc}, Notifications: {del_notif}")

        # 6. Delete participants (Keep only admins)
        admin_roles = [UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, "super_admin", "admin", "event_admin"]
        participants = db.query(User).filter(~User.role.in_(admin_roles)).all()
        participant_ids = [p.id for p in participants]
        if participant_ids:
            db.query(SessionToken).filter(SessionToken.user_id.in_(participant_ids)).delete(synchronize_session=False)
            del_part = db.query(User).filter(User.id.in_(participant_ids)).delete(synchronize_session=False)
            print(f"[-] Deleted Participants: {del_part}")
        else:
            print("[-] No non-admin participants found.")

        # 7. Reset admin points
        admins = db.query(User).filter(User.role.in_(admin_roles)).all()
        for a in admins:
            a.points = 0
        print(f"[✓] Preserved {len(admins)} Admin account(s):")
        for a in admins:
            print(f"    - ID={a.id}, username='{a.username}', role='{a.role}', email='{a.email}'")

        db.commit()
        print("==================================================")
        print("DATABASE SUCCESSFULLY PURGED & PREPARED.")
        print("==================================================")

if __name__ == "__main__":
    clean_database()
