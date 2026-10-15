import hashlib
from typing import Dict, List, Any, Optional

def compute_evidence_token(case_number: int, computed_result: str) -> str:
    """
    Formats the evidence token for a completed investigation case.
    """
    clean_val = computed_result.strip()
    return f"FLAG{{CASE_{case_number:02d}_{clean_val}}}"

def verify_token_submission(case_number: int, expected_token_rule: str, user_token: str) -> bool:
    """
    Server-side verification of an investigator's evidence token.
    """
    if not user_token:
        return False
    user_token = user_token.strip()
    # Check direct match or case-insensitive flag match
    return user_token == expected_token_rule.strip() or user_token.upper() == expected_token_rule.strip().upper()

def build_case_80_final_convergence(tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Case 80 Final Convergence:
    Takes recovered tokens from cases 1-79, sorts by case number,
    builds canonical string, and computes the 16-character SHA-256 master flag.
    """
    # Filter valid tokens with case_number < 80
    valid_items = []
    for item in tokens:
        c_num = item.get("case_number")
        val = item.get("token_value", "").strip()
        if c_num and 1 <= c_num <= 79 and val:
            valid_items.append((c_num, val))

    # Sort canonical order by case number
    valid_items.sort(key=lambda x: x[0])
    
    chain = "|".join(f"{k}:{v}" for k, v in valid_items)
    digest = hashlib.sha256(chain.encode("utf-8")).hexdigest()[:16]
    master_flag = f"FLAG{{{digest}}}"

    return {
        "master_flag": master_flag,
        "token_count": len(valid_items),
        "total_required": 79,
        "is_complete": len(valid_items) == 79,
        "canonical_chain_preview": chain[:120] + "..." if len(chain) > 120 else chain
    }
