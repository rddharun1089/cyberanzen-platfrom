import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import PlatformSetting, AuditLog, User
from app.api.deps import get_current_admin

router = APIRouter(tags=["Site Content"])

DEFAULT_SITE_CONTENT = {
    "creator": {
        "name": "CyberAnzen Core Security Team",
        "role": "Security Engineering & Systems Architecture",
        "bio": "Platform maintained by the CyberAnzen team. Dedicated to hands-on cybersecurity research, competitive programming, and responsible vulnerability education.",
        "avatar_url": "/logo.png",
        "links": {
            "github": "https://github.com/rddharun1089/cyberanzen-platfrom",
            "linkedin": "",
            "website": ""
        }
    },
    "about": {
        "title": "About CyberAnzen Arena",
        "description": "CyberAnzen is an advanced cybersecurity competition and algorithmic practice platform engineered to bridge practical defensive forensics, ethical exploitation, and competitive programming.",
        "principles": [
            {
                "title": "Hands-on Cybersecurity Learning",
                "description": "Practical challenges in web security, cryptography, digital forensics, reverse engineering, binary exploitation, and network packet analysis."
            },
            {
                "title": "Competitive Programming & Problem Solving",
                "description": "Algorithmic challenges evaluated against kernel-level resource sandboxes supporting C, C++, and Python 3."
            },
            {
                "title": "Knowledge-Based Quizzes",
                "description": "Comprehensive technical assessments covering Linux internals, protocols, and defensive security architectures."
            },
            {
                "title": "Individual & Squad Operations",
                "description": "Dynamic participation models supporting both solo operatives and coordinated team operations with strict capacity controls."
            },
            {
                "title": "Responsible Security Research",
                "description": "A secure environment promoting ethical investigation, vulnerability analysis, and community knowledge sharing."
            }
        ]
    },
    "hero": {
        "eyebrow": "CYBERANZEN · SECURE · LEARN · COMPETE",
        "headline": "Think. Explore. Solve. Prove.",
        "description": "Build practical cybersecurity skills, solve technical challenges, and compete with a community of learners through events hosted by CyberAnzen."
    },
    "footer": {
        "description": "CyberAnzen Arena — Digital Forensics, Cybersecurity CTF & Competitive Programming Platform.",
        "copyright": "© 2026 CyberAnzen Organization. All rights reserved."
    }
}

class SiteContentUpdateRequest(BaseModel):
    creator: Optional[Dict[str, Any]] = None
    about: Optional[Dict[str, Any]] = None
    hero: Optional[Dict[str, Any]] = None
    footer: Optional[Dict[str, Any]] = None

@router.get("/public")
def get_public_site_content(db: Session = Depends(get_db)):
    """Publicly accessible site content for Landing page, About, Creator, and Footer."""
    row = db.query(PlatformSetting).filter(PlatformSetting.setting_key == "site_content").first()
    if not row:
        return DEFAULT_SITE_CONTENT
    try:
        content = json.loads(row.setting_value)
        # Merge defaults for any missing top-level keys
        for k, v in DEFAULT_SITE_CONTENT.items():
            if k not in content:
                content[k] = v
        return content
    except Exception:
        return DEFAULT_SITE_CONTENT

@router.get("/admin/content")
def get_admin_site_content(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin-only retrieve site content with metadata."""
    row = db.query(PlatformSetting).filter(PlatformSetting.setting_key == "site_content").first()
    if not row:
        return {"content": DEFAULT_SITE_CONTENT, "updated_at": None, "updated_by": None}
    try:
        content = json.loads(row.setting_value)
        return {
            "content": content,
            "updated_at": row.updated_at,
            "updated_by": row.updated_by_id
        }
    except Exception:
        return {"content": DEFAULT_SITE_CONTENT, "updated_at": None, "updated_by": None}

@router.put("/admin/content")
def update_admin_site_content(
    req: SiteContentUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin-only update site content (Creator, About, Hero copy)."""
    row = db.query(PlatformSetting).filter(PlatformSetting.setting_key == "site_content").first()
    if not row:
        current_data = dict(DEFAULT_SITE_CONTENT)
        row = PlatformSetting(
            setting_key="site_content",
            setting_value=json.dumps(current_data),
            updated_by_id=admin.id
        )
        db.add(row)
    else:
        try:
            current_data = json.loads(row.setting_value)
        except Exception:
            current_data = dict(DEFAULT_SITE_CONTENT)

    if req.creator is not None:
        current_data["creator"] = req.creator
    if req.about is not None:
        current_data["about"] = req.about
    if req.hero is not None:
        current_data["hero"] = req.hero
    if req.footer is not None:
        current_data["footer"] = req.footer

    row.setting_value = json.dumps(current_data)
    row.updated_by_id = admin.id
    row.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Audit log entry
    audit = AuditLog(
        actor_id=admin.id,
        actor_username=admin.username,
        action="UPDATE_SITE_CONTENT",
        entity_type="SYSTEM",
        entity_id="site_content",
        details="Updated public site content (Creator/About/Hero/Footer)"
    )
    db.add(audit)
    db.commit()

    return {"success": True, "content": current_data}
