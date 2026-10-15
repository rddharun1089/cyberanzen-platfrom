from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, EvidenceToken, Case
from app.api.deps import get_current_user
from app.services.evidence_engine import build_case_80_final_convergence, verify_token_submission

router = APIRouter(prefix="/evidence", tags=["Evidence Tokens & Case 80 Convergence"])

@router.get("/tokens")
def get_user_tokens(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tokens = db.query(EvidenceToken).filter(EvidenceToken.user_id == current_user.id).all()
    return [
        {
            "id": t.id,
            "case_id": t.case_id,
            "token_value": t.token_value,
            "is_valid": t.is_valid,
            "unlocked_at": t.unlocked_at
        }
        for t in tokens
    ]

@router.get("/graph")
def get_evidence_graph(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns the investigative evidence graph nodes and edges showing how
    the 10 technical domains and 80 cases interconnect into the final convergence.
    """
    domains = [
        "Cybersecurity & Digital Forensics",
        "AI / Machine Learning",
        "Data Science",
        "ECE / Embedded Systems",
        "IoT",
        "Blockchain",
        "Robotics",
        "Aerospace",
        "Nanotechnology",
        "Cross-Domain Grand Crimes"
    ]
    
    user_tokens = db.query(EvidenceToken).filter(EvidenceToken.user_id == current_user.id).all()
    unlocked_cases = {t.case_id for t in user_tokens}

    nodes = []
    edges = []

    # Domain group nodes
    for i, d in enumerate(domains):
        nodes.append({
            "id": f"domain_{i+1}",
            "label": d,
            "type": "domain",
            "group": i + 1
        })

    # Case nodes
    cases = db.query(Case).all()
    for c in cases:
        is_unlocked = c.id in unlocked_cases
        nodes.append({
            "id": c.id,
            "label": f"{c.id}: {c.title}",
            "type": "case",
            "number": c.number,
            "domain": c.domain,
            "unlocked": is_unlocked,
            "points": c.points
        })

    # Inter-domain chain edges (connecting sequentially across the storyline)
    for i in range(1, 80):
        c1 = f"CASE-{i:02d}"
        c2 = f"CASE-{i+1:02d}"
        edges.append({
            "source": c1,
            "target": c2,
            "type": "evidence_flow",
            "active": (c1 in unlocked_cases and c2 in unlocked_cases)
        })

    # Case 80 Convergence target
    for i in range(1, 80):
        edges.append({
            "source": f"CASE-{i:02d}",
            "target": "CASE-80",
            "type": "convergence_ray",
            "active": f"CASE-{i:02d}" in unlocked_cases
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "total_cases": 80,
        "unlocked_count": len(unlocked_cases)
    }

@router.post("/converge")
def run_final_convergence(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Executes Case 80 Final Convergence: aggregates all 79 tokens recovered by the user
    and computes the master cryptographic SHA-256 evidence chain flag.
    """
    tokens = db.query(EvidenceToken).filter(EvidenceToken.user_id == current_user.id).all()
    
    token_dicts = []
    for t in tokens:
        # Extract case number from case_id "CASE-XX"
        try:
            num = int(t.case_id.split("-")[1])
            token_dicts.append({"case_number": num, "token_value": t.token_value})
        except:
            pass

    convergence = build_case_80_final_convergence(token_dicts)
    return convergence
