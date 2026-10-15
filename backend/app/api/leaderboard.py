from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import User, Submission, Case, EvidenceToken

router = APIRouter(prefix="", tags=["Leaderboard & Statistics"])

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.points.desc()).limit(100).all()
    rankings = []
    for rank, u in enumerate(users, start=1):
        solved_count = db.query(EvidenceToken).filter(EvidenceToken.user_id == u.id).count()
        rankings.append({
            "rank": rank,
            "username": u.username,
            "role": u.role,
            "points": u.points,
            "cases_solved": solved_count
        })
    return rankings

@router.get("/stats")
def get_platform_statistics(db: Session = Depends(get_db)):
    total_cases = db.query(Case).count()
    total_users = db.query(User).count()
    total_submissions = db.query(Submission).count()
    total_accepted = db.query(Submission).filter(Submission.verdict == "ACCEPTED").count()

    # Domain breakdown
    domain_rows = db.query(Case.domain, func.count(Case.id)).group_by(Case.domain).all()
    domain_stats = {d: cnt for d, cnt in domain_rows}

    # Total points in catalog
    total_possible_points = db.query(func.sum(Case.points)).scalar() or 0

    return {
        "total_cases": total_cases,
        "total_users": total_users,
        "total_submissions": total_submissions,
        "total_accepted": total_accepted,
        "total_possible_points": total_possible_points,
        "domain_distribution": domain_stats
    }
