from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.models import (
    User, Team, Solve, Submission, ScoreAdjustment, AuditLog, Event, ScoringPolicy
)

class ScoringService:
    @staticmethod
    def record_solve(
        db: Session,
        user: User,
        challenge_type: str,  # "dsa" | "ctf" | "mcq"
        challenge_id: str,
        base_points: int,
        submission: Optional[Submission] = None,
        event: Optional[Event] = None
    ) -> Dict[str, Any]:
        """
        Atomically records a solve and awards points to the participant and their active team.
        Enforces strict deduplication: points are never awarded twice for the same challenge.
        Calculates first-solve bonus if configured.
        """
        now = datetime.now(timezone.utc)
        team = user.team_membership.team if (user.team_membership and user.team_membership.team and user.team_membership.team.is_active) else None

        # 1. Check if challenge was already solved globally in this event (for first-solve bonus)
        prior_global_solve = db.query(Solve).filter(
            Solve.challenge_type == challenge_type,
            Solve.challenge_id == str(challenge_id)
        ).first()

        is_first_solve = prior_global_solve is None
        points_to_award = base_points
        if is_first_solve and event and event.scoring_policy == ScoringPolicy.FIRST_SOLVE_BONUS.value:
            points_to_award = int(base_points * 1.2)  # 20% first-solve bonus

        # 2. Check if user already solved this challenge
        user_solve = db.query(Solve).filter(
            Solve.user_id == user.id,
            Solve.challenge_type == challenge_type,
            Solve.challenge_id == str(challenge_id)
        ).first()

        user_points_awarded = 0
        if not user_solve:
            new_user_solve = Solve(
                event_id=event.id if event else None,
                user_id=user.id,
                team_id=team.id if team else None,
                challenge_type=challenge_type,
                challenge_id=str(challenge_id),
                points_awarded=points_to_award,
                submission_id=submission.id if submission else None,
                is_first_solve=is_first_solve,
                solved_at=now
            )
            db.add(new_user_solve)
            user.points += points_to_award
            user_points_awarded = points_to_award

        # 3. Check if team already solved this challenge
        team_points_awarded = 0
        if team:
            existing_team_solve = db.query(Solve).filter(
                Solve.team_id == team.id,
                Solve.challenge_type == challenge_type,
                Solve.challenge_id == str(challenge_id),
                Solve.user_id != user.id
            ).first()

            if not existing_team_solve and user_points_awarded > 0:
                team.points += points_to_award
                team.updated_at = now
                team_points_awarded = points_to_award

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return {"awarded": False, "points": 0, "message": "Concurrent solve already recorded."}

        return {
            "awarded": True,
            "points_awarded": user_points_awarded,
            "team_points_awarded": team_points_awarded,
            "is_first_solve": is_first_solve,
            "new_user_total": user.points,
            "new_team_total": team.points if team else None
        }

    @staticmethod
    def adjust_score(
        db: Session,
        admin_user: User,
        points_delta: int,
        reason: str,
        target_user: Optional[User] = None,
        target_team: Optional[Team] = None,
        event: Optional[Event] = None
    ) -> ScoreAdjustment:
        """Audited administrative score override"""
        prev_score = target_user.points if target_user else (target_team.points if target_team else 0)
        new_score = max(0, prev_score + points_delta)

        if target_user:
            target_user.points = new_score
        if target_team:
            target_team.points = new_score

        adj = ScoreAdjustment(
            event_id=event.id if event else None,
            target_user_id=target_user.id if target_user else None,
            target_team_id=target_team.id if target_team else None,
            adjusted_by_id=admin_user.id,
            points_delta=points_delta,
            reason=reason,
            previous_score=prev_score,
            new_score=new_score,
            created_at=datetime.now(timezone.utc)
        )
        db.add(adj)

        # Record immutable audit log
        log = AuditLog(
            actor_id=admin_user.id,
            actor_username=admin_user.username,
            action="SCORE_ADJUSTMENT",
            entity_type="USER" if target_user else "TEAM",
            entity_id=str(target_user.id if target_user else (target_team.id if target_team else 0)),
            details=f"Score adjusted by {points_delta} pts ({prev_score} -> {new_score}). Reason: {reason}"
        )
        db.add(log)
        db.commit()
        return adj
