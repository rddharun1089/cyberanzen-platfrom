import json
import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import (
    User, UserRole, DSAQuestion, DSATestCase, MCQQuestion, CTFChallenge,
    DynamicTemplate, DockerLabInstance, AuditLog, SecurityIncident, Team,
    TeamMembership, TeamMemberRole, TeamSolvedCase, Submission, Solve, ChallengeStatus, FlagType, LabStatus
)
from app.api.deps import get_current_admin, get_current_super_admin
from app.judge.worker import evaluate_submission
from app.services.dynamic_generator import DynamicGeneratorService
from app.services.lab_service import DockerLabService
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/admin", tags=["Administration Control Center"])

# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================

class DSACreateRequest(BaseModel):
    title: str
    slug: Optional[str] = None
    statement: str
    input_spec: str
    output_spec: str
    constraints: Optional[str] = ""
    difficulty: Optional[str] = "Beginner"
    category: Optional[str] = "Data Structures & Algorithms"
    tags: Optional[List[str]] = []
    points: Optional[int] = 100
    time_limit_ms: Optional[int] = 2000
    memory_limit_mb: Optional[int] = 256
    supported_languages: Optional[List[str]] = ["python3", "cpp", "c"]
    starter_py: Optional[str] = ""
    starter_cpp: Optional[str] = ""
    starter_c: Optional[str] = ""
    reference_solution: Optional[str] = ""
    status: Optional[str] = "published"
    allow_copy_paste: Optional[bool] = False

class DSATestCaseRequest(BaseModel):
    test_type: str  # public_sample | hidden_test
    input_data: str
    expected_output: str
    points: Optional[int] = 0

class MCQCreateRequest(BaseModel):
    title: str
    prompt: str
    question_type: Optional[str] = "single_choice"
    difficulty: Optional[str] = "Beginner"
    category: Optional[str] = "Cybersecurity"
    tags: Optional[List[str]] = []
    options: List[Dict[str, Any]]  # [{"id": 1, "text": "...", "is_correct": true, "explanation": "..."}]
    points_positive: Optional[int] = 10
    points_negative: Optional[int] = 0
    time_limit_sec: Optional[int] = 60
    explanation: Optional[str] = ""
    status: Optional[str] = "published"

class CTFCreateRequest(BaseModel):
    title: str
    slug: Optional[str] = None
    description: str
    category: Optional[str] = "web"
    difficulty: Optional[str] = "Beginner"
    points: Optional[int] = 100
    flag_type: Optional[str] = "static"
    static_flag: Optional[str] = None
    hints: Optional[List[Dict[str, Any]]] = []
    files: Optional[List[Dict[str, Any]]] = []
    has_docker_lab: Optional[bool] = False
    docker_image: Optional[str] = None
    lab_timeout_min: Optional[int] = 60
    lab_port_exposed: Optional[int] = 80
    status: Optional[str] = "published"

class DynamicTemplateRequest(BaseModel):
    name: str
    category: Optional[str] = "DSA"
    statement_template: str
    parameter_schema: Dict[str, Any]
    generator_script: str
    reference_solution: str

class GenerateInstanceRequest(BaseModel):
    seed: int

class DeleteUserConfirmation(BaseModel):
    confirm_username: str

class RoleUpdateRequest(BaseModel):
    role: str

class BatchAntiCheatRequest(BaseModel):
    category: Optional[str] = None
    allow_copy_paste: bool

# ==============================================================================
# 1. DSA QUESTION STUDIO
# ==============================================================================

@router.post("/dsa")
def admin_create_dsa(req: DSACreateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    slug = req.slug or req.title.lower().replace(" ", "-").replace("/", "-")
    existing = db.query(DSAQuestion).filter(DSAQuestion.slug == slug).first()
    if existing:
        slug = f"{slug}-{secrets.token_hex(3)}"

    q = DSAQuestion(
        slug=slug,
        title=req.title,
        statement=req.statement,
        input_spec=req.input_spec,
        output_spec=req.output_spec,
        constraints=req.constraints,
        difficulty=req.difficulty or "Beginner",
        category=req.category or "Data Structures & Algorithms",
        tags=json.dumps(req.tags or []),
        points=req.points or 100,
        time_limit_ms=req.time_limit_ms or 2000,
        memory_limit_mb=req.memory_limit_mb or 256,
        supported_languages=json.dumps(req.supported_languages or ["python3", "cpp", "c"]),
        starter_py=req.starter_py,
        starter_cpp=req.starter_cpp,
        starter_c=req.starter_c,
        reference_solution=req.reference_solution,
        status=req.status or ChallengeStatus.PUBLISHED.value,
        allow_copy_paste=bool(req.allow_copy_paste),
        created_by_id=admin.id
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    log = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="CREATE_DSA_QUESTION",
        entity_type="DSA",
        entity_id=str(q.id),
        details=f"Created DSA question: {q.title} ({q.slug})"
    )
    db.add(log)
    db.commit()

    return {"success": True, "id": q.id, "slug": q.slug, "title": q.title}

@router.get("/dsa")
def admin_list_dsa(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    questions = db.query(DSAQuestion).order_by(DSAQuestion.id.asc()).all()
    return [
        {
            "id": q.id,
            "slug": q.slug,
            "title": q.title,
            "category": q.category,
            "difficulty": q.difficulty,
            "points": q.points,
            "status": q.status,
            "allow_copy_paste": q.allow_copy_paste,
            "judge_enabled": q.judge_enabled,
            "test_count": len(q.test_cases)
        }
        for q in questions
    ]

@router.get("/dsa/{id}")
def admin_get_dsa_detail(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    q = db.query(DSAQuestion).filter(DSAQuestion.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    return {
        "id": q.id,
        "slug": q.slug,
        "title": q.title,
        "statement": q.statement,
        "input_spec": q.input_spec,
        "output_spec": q.output_spec,
        "constraints": q.constraints,
        "category": q.category,
        "difficulty": q.difficulty,
        "points": q.points,
        "time_limit_ms": q.time_limit_ms,
        "memory_limit_mb": q.memory_limit_mb,
        "supported_languages": json.loads(q.supported_languages) if q.supported_languages else [],
        "starter_py": q.starter_py,
        "starter_cpp": q.starter_cpp,
        "starter_c": q.starter_c,
        "reference_solution": q.reference_solution,
        "status": q.status,
        "allow_copy_paste": q.allow_copy_paste,
        "test_cases": [
            {
                "id": tc.id,
                "type": tc.test_type,
                "index": tc.test_index,
                "input": tc.input_data,
                "output": tc.expected_output,
                "points": tc.points
            }
            for tc in q.test_cases
        ]
    }

@router.post("/dsa/{id}/test-cases")
def admin_add_dsa_testcase(id: int, req: DSATestCaseRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    q = db.query(DSAQuestion).filter(DSAQuestion.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    idx = len(q.test_cases) + 1
    tc = DSATestCase(
        question_id=q.id,
        test_type=req.test_type,
        test_index=idx,
        input_data=req.input_data,
        expected_output=req.expected_output,
        points=req.points or 0
    )
    db.add(tc)
    db.commit()
    db.refresh(tc)
    return {"success": True, "test_id": tc.id, "index": tc.test_index, "type": tc.test_type}

@router.delete("/dsa/test-cases/{test_id}")
def admin_delete_dsa_testcase(test_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    tc = db.query(DSATestCase).filter(DSATestCase.id == test_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Testcase not found.")
    db.delete(tc)
    db.commit()
    return {"success": True, "deleted_test_id": test_id}

@router.post("/dsa/{id}/validate-reference")
def admin_validate_dsa_reference(id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    q = db.query(DSAQuestion).filter(DSAQuestion.id == id).first()
    if not q or not q.reference_solution:
        raise HTTPException(status_code=400, detail="Question or reference solution not found.")

    all_tests = db.query(DSATestCase).filter(DSATestCase.question_id == q.id).all()
    if not all_tests:
        raise HTTPException(status_code=400, detail="No test cases to validate against.")

    test_dicts = [
        {"id": f"tc_{t.id}", "type": t.test_type, "input": t.input_data, "output": t.expected_output, "points": t.points}
        for t in all_tests
    ]

    res = evaluate_submission(
        language="python3",
        source_code=q.reference_solution,
        test_cases=test_dicts,
        time_limit_ms=q.time_limit_ms,
        memory_limit_mb=q.memory_limit_mb,
        is_sample_run=False,
        reveal_failed_tests=True
    )

    all_accepted = res["verdict"] == "ACCEPTED"
    return {
        "valid": all_accepted,
        "verdict": res["verdict"],
        "total_tests": len(all_tests),
        "results": res["test_results"]
    }

# ==============================================================================
# 2. MCQ QUESTION STUDIO
# ==============================================================================

@router.post("/mcqs")
def admin_create_mcq(req: MCQCreateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    m = MCQQuestion(
        title=req.title,
        prompt=req.prompt,
        question_type=req.question_type or "single_choice",
        difficulty=req.difficulty or "Beginner",
        category=req.category or "Cybersecurity",
        tags=json.dumps(req.tags or []),
        options=json.dumps(req.options),
        points_positive=req.points_positive or 10,
        points_negative=req.points_negative or 0,
        time_limit_sec=req.time_limit_sec or 60,
        explanation=req.explanation,
        status=req.status or ChallengeStatus.PUBLISHED.value,
        created_by_id=admin.id
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"success": True, "id": m.id, "title": m.title}

@router.get("/mcqs")
def admin_list_mcqs(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    mcqs = db.query(MCQQuestion).order_by(MCQQuestion.id.asc()).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "question_type": m.question_type,
            "category": m.category,
            "difficulty": m.difficulty,
            "points_positive": m.points_positive,
            "points_negative": m.points_negative,
            "status": m.status,
            "options": json.loads(m.options) if m.options else [],
            "explanation": m.explanation
        }
        for m in mcqs
    ]

# ==============================================================================
# 3. CTF CHALLENGE STUDIO
# ==============================================================================

@router.post("/ctf")
def admin_create_ctf(req: CTFCreateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    slug = req.slug or req.title.lower().replace(" ", "-").replace("/", "-")
    existing = db.query(CTFChallenge).filter(CTFChallenge.slug == slug).first()
    if existing:
        slug = f"{slug}-{secrets.token_hex(3)}"

    c = CTFChallenge(
        slug=slug,
        title=req.title,
        description=req.description,
        category=req.category or "web",
        difficulty=req.difficulty or "Beginner",
        points=req.points or 100,
        flag_type=req.flag_type or FlagType.STATIC.value,
        static_flag=req.static_flag,
        hints=json.dumps(req.hints or []),
        files=json.dumps(req.files or []),
        has_docker_lab=bool(req.has_docker_lab),
        docker_image=req.docker_image,
        lab_timeout_min=req.lab_timeout_min or 60,
        lab_port_exposed=req.lab_port_exposed or 80,
        status=req.status or ChallengeStatus.PUBLISHED.value,
        created_by_id=admin.id
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"success": True, "id": c.id, "slug": c.slug, "title": c.title}

@router.get("/ctf")
def admin_list_ctf(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    challenges = db.query(CTFChallenge).order_by(CTFChallenge.id.asc()).all()
    return [
        {
            "id": c.id,
            "slug": c.slug,
            "title": c.title,
            "category": c.category,
            "difficulty": c.difficulty,
            "points": c.points,
            "flag_type": c.flag_type,
            "static_flag": c.static_flag,
            "has_docker_lab": c.has_docker_lab,
            "docker_image": c.docker_image,
            "status": c.status
        }
        for c in challenges
    ]

# ==============================================================================
# 4. DYNAMIC GENERATOR STUDIO
# ==============================================================================

@router.post("/dynamic-templates")
def admin_create_template(req: DynamicTemplateRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    tmpl = DynamicTemplate(
        name=req.name,
        category=req.category or "DSA",
        statement_template=req.statement_template,
        parameter_schema=json.dumps(req.parameter_schema),
        generator_script=req.generator_script,
        reference_solution=req.reference_solution,
        created_by_id=admin.id
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return {"success": True, "template_id": tmpl.id, "name": tmpl.name}

@router.get("/dynamic-templates")
def admin_list_templates(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    tmpls = db.query(DynamicTemplate).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "statement_template": t.statement_template,
            "parameter_schema": json.loads(t.parameter_schema) if t.parameter_schema else {}
        }
        for t in tmpls
    ]

@router.post("/dynamic-templates/{id}/generate")
def admin_generate_from_template(id: int, req: GenerateInstanceRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    tmpl = db.query(DynamicTemplate).filter(DynamicTemplate.id == id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found.")

    res = DynamicGeneratorService.generate_instance_from_template(
        db=db,
        template=tmpl,
        seed=req.seed,
        creator_id=admin.id
    )
    return res

# ==============================================================================
# 5. DOCKER LAB MANAGER
# ==============================================================================

@router.get("/labs")
def admin_list_labs(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    instances = db.query(DockerLabInstance).order_by(DockerLabInstance.id.desc()).all()
    return [
        {
            "id": inst.id,
            "challenge_id": inst.challenge_id,
            "challenge_title": inst.challenge.title if inst.challenge else "Unknown",
            "user_id": inst.user_id,
            "username": inst.user.username if inst.user else "Unknown",
            "status": inst.status,
            "access_port": inst.access_port,
            "expires_at": inst.expires_at,
            "created_at": inst.created_at
        }
        for inst in instances
    ]

# ==============================================================================
# 6. USER & TEAM GOVERNANCE WITH SAFE DELETION
# ==============================================================================

@router.get("/users")
def admin_list_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    users = db.query(User).order_by(User.id.asc()).all()
    results = []
    for u in users:
        team_data = None
        if u.team_membership and u.team_membership.team:
            team_data = {
                "team_id": u.team_membership.team_id,
                "team_name": u.team_membership.team.name,
                "role": u.team_membership.role
            }
        sub_count = db.query(Submission).filter(Submission.user_id == u.id).count()
        results.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "points": u.points,
            "is_active": u.is_active,
            "team": team_data,
            "submission_count": sub_count,
            "created_at": u.created_at
        })
    return results

@router.put("/users/{user_id}/role")
def admin_update_user_role(
    user_id: int,
    req: RoleUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_super_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target.role = req.role
    db.commit()
    return {"success": True, "user_id": target.id, "new_role": target.role}

@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    confirm_username: Optional[str] = None,
    req: Optional[DeleteUserConfirmation] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_super_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    conf = (req.confirm_username if req else confirm_username) or ""
    if conf.strip() != target.username:
        raise HTTPException(status_code=400, detail=f"Confirmation mismatch. Expected '{target.username}'.")

    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="Administrative self-deletion is strictly prohibited. You cannot delete your own active account.")

    if UserRole.is_admin_or_super(target.role):
        active_admins = db.query(User).filter(
            User.role.in_([UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, "super_admin", "admin"]),
            User.is_active == True,
            User.id != target.id
        ).count()
        if active_admins == 0:
            raise HTTPException(status_code=400, detail="Cannot delete the final active Super Administrator.")

    deleted_username = target.username

    # Handle team memberships and automatic ownership succession
    if target.team_membership:
        membership = target.team_membership
        team = membership.team
        if membership.role == TeamMemberRole.OWNER.value and team:
            other_members = db.query(TeamMembership).filter(
                TeamMembership.team_id == team.id,
                TeamMembership.user_id != target.id
            ).order_by(TeamMembership.joined_at.asc()).all()
            if other_members:
                new_owner_membership = other_members[0]
                new_owner_membership.role = TeamMemberRole.OWNER.value
                team.owner_id = new_owner_membership.user_id
                db.delete(membership)
            else:
                db.delete(team)
        else:
            db.delete(membership)

    # Dissociate solved_by_user_id in TeamSolvedCase to preserve team achievements
    db.query(TeamSolvedCase).filter(TeamSolvedCase.solved_by_user_id == target.id).update(
        {"solved_by_user_id": None}, synchronize_session="fetch"
    )

    # Safe cascade cleanup
    db.delete(target)

    # Record Audit Log
    db.add(AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="DELETE_USER",
        entity_type="USER",
        entity_id=str(user_id),
        details=json.dumps({"deleted_username": deleted_username})
    ))

    db.commit()

    return {"success": True, "message": f"User '{deleted_username}' deleted permanently."}

# ==============================================================================
# 7. AUDIT LOGS & INCIDENT CONTROLS
# ==============================================================================

@router.get("/audit-logs")
def admin_get_audit_logs(
    limit: int = 100,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    logs = query.order_by(AuditLog.id.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "actor_username": l.actor_username,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "created_at": l.created_at
        }
        for l in logs
    ]

@router.get("/security-incidents")
def admin_get_incidents(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    incidents = db.query(SecurityIncident).order_by(SecurityIncident.id.desc()).limit(100).all()
    return [
        {
            "id": inc.id,
            "user_id": inc.user_id,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "resolved": inc.resolved,
            "created_at": inc.created_at
        }
        for inc in incidents
    ]

@router.post("/batch-anti-cheat")
def admin_batch_anti_cheat(
    req: BatchAntiCheatRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(DSAQuestion)
    if req.category:
        query = query.filter(DSAQuestion.category == req.category)
    questions = query.all()

    for q in questions:
        q.allow_copy_paste = req.allow_copy_paste
    db.commit()

    return {
        "success": True,
        "affected_questions": len(questions),
        "allow_copy_paste": req.allow_copy_paste
    }
