from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Team, Solve, Submission, DSAQuestion, CTFChallenge, MCQQuestion

router = APIRouter(prefix="/leaderboard", tags=["Leaderboards & Standings"])

@router.get("")
def get_global_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.is_active == True).order_by(
        User.points.desc(), User.id.asc()
    ).limit(100).all()

    return [
        {
            "rank": idx + 1,
            "user_id": u.id,
            "username": u.username,
            "points": u.points,
            "solved_count": len(u.solves),
            "team_name": u.team_membership.team.name if (u.team_membership and u.team_membership.team) else None
        }
        for idx, u in enumerate(users)
    ]

@router.get("/teams")
def get_team_leaderboard(db: Session = Depends(get_db)):
    teams = db.query(Team).filter(Team.is_active == True).order_by(
        Team.points.desc(), Team.updated_at.asc()
    ).limit(100).all()

    return [
        {
            "rank": idx + 1,
            "team_id": t.id,
            "team_name": t.name,
            "points": t.points,
            "solved_count": len(t.solves),
            "member_count": len(t.memberships),
            "updated_at": t.updated_at
        }
        for idx, t in enumerate(teams)
    ]

@router.get("/stats")
def get_platform_stats(db: Session = Depends(get_db)):
    dsa_count = db.query(DSAQuestion).count()
    ctf_count = db.query(CTFChallenge).count()
    mcq_count = db.query(MCQQuestion).count()
    users_count = db.query(User).count()
    teams_count = db.query(Team).count()
    subs_count = db.query(Submission).count()
    solves_count = db.query(Solve).count()

    return {
        "total_challenges": dsa_count + ctf_count + mcq_count,
        "dsa_questions": dsa_count,
        "ctf_challenges": ctf_count,
        "mcq_questions": mcq_count,
        "total_cadets": users_count,
        "active_squads": teams_count,
        "total_submissions": subs_count,
        "total_solves": solves_count
    }
