import sqlite3
import os
from app.core.config import settings
from app.db.session import engine, Base
import app.db.models  # ensure all models registered

def run_migrations():
    """
    Safely migrates SQLite schema without data loss.
    Adds new columns to `events` and `event_registrations`,
    and creates new association and job tables.
    """
    # 1. Create any missing new tables
    Base.metadata.create_all(bind=engine)

    # 2. Add columns if missing in SQLite
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Events table columns
    cursor.execute("PRAGMA table_info(events)")
    event_cols = {r[1] for r in cursor.fetchall()}

    new_event_columns = [
        ("event_type", "VARCHAR(30) DEFAULT 'dsa'"),
        ("short_description", "VARCHAR(500)"),
        ("organizer", "VARCHAR(100) DEFAULT 'CyberAnzen Organization'"),
        ("category", "VARCHAR(100) DEFAULT 'General'"),
        ("difficulty", "VARCHAR(30) DEFAULT 'Intermediate'"),
        ("timezone", "VARCHAR(50) DEFAULT 'UTC'"),
        ("eligibility", "TEXT"),
        ("visibility", "VARCHAR(30) DEFAULT 'public'"),
        ("capacity", "INTEGER"),
        ("contact_info", "VARCHAR(200)"),
        ("team_allow_create", "BOOLEAN DEFAULT 1"),
        ("team_allow_join_code", "BOOLEAN DEFAULT 1"),
        ("team_require_approval", "BOOLEAN DEFAULT 0"),
        ("team_allow_member_changes", "BOOLEAN DEFAULT 1"),
        ("team_lock_on_start", "BOOLEAN DEFAULT 1"),
        ("team_allow_ownership_transfer", "BOOLEAN DEFAULT 1"),
        ("team_allow_delete_empty", "BOOLEAN DEFAULT 1"),
        ("team_show_members_leaderboard", "BOOLEAN DEFAULT 1"),
        ("leaderboard_type", "VARCHAR(30) DEFAULT 'individual'"),
        ("scores_visible_during_event", "BOOLEAN DEFAULT 1"),
        ("auto_publish_results", "BOOLEAN DEFAULT 1"),
        ("show_solve_times", "BOOLEAN DEFAULT 1"),
        ("show_solve_counts", "BOOLEAN DEFAULT 1"),
        ("anonymize_participants", "BOOLEAN DEFAULT 0"),
        ("question_navigation_policy", "VARCHAR(50) DEFAULT 'free'"),
        ("question_order_mode", "VARCHAR(50) DEFAULT 'fixed'"),
        ("show_progress", "BOOLEAN DEFAULT 1"),
        ("mark_solved_immediately", "BOOLEAN DEFAULT 1"),
        ("revisit_solved_questions", "BOOLEAN DEFAULT 1"),
        ("result_publication_time", "DATETIME"),
        ("competition_template_id", "INTEGER"),
    ]

    for col_name, col_def in new_event_columns:
        if col_name not in event_cols:
            cursor.execute(f"ALTER TABLE events ADD COLUMN {col_name} {col_def}")
            print(f"[MIGRATION] Added column 'events.{col_name}'")

    # Event registrations table columns
    cursor.execute("PRAGMA table_info(event_registrations)")
    reg_cols = {r[1] for r in cursor.fetchall()}

    if "selected_mode" not in reg_cols:
        cursor.execute("ALTER TABLE event_registrations ADD COLUMN selected_mode VARCHAR(30) DEFAULT 'individual'")
        print("[MIGRATION] Added column 'event_registrations.selected_mode'")

    # Seed initial competition templates if none exist
    cursor.execute("SELECT COUNT(*) FROM competition_templates")
    template_count = cursor.fetchone()[0]
    if template_count == 0:
        import json
        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()
        builtin_templates = [
            (
                "dsa-competitive-programming",
                "DSA & Competitive Programming",
                "dsa",
                "Algorithmic problem solving arena with automated multi-language judge, real-time verdicts, test suite evaluations, and runtime benchmarks.",
                "code",
                json.dumps(["dsa"]),
                "split_code",
                json.dumps(["individual", "team", "mixed"]),
                json.dumps({"policy": "standard", "dynamic": False}),
                "free",
                "fixed",
                json.dumps(["source_code", "test_cases"]),
                json.dumps(["code_editor", "syntax_highlighting", "language_selector", "test_cases", "judge_verdicts", "runtime_metrics", "submissions", "leaderboards"]),
                json.dumps({"allowed_languages": ["python3", "cpp", "c"], "time_limit_ms": 2000, "memory_limit_mb": 256}),
                1, now_iso, now_iso
            ),
            (
                "ctf-security-arena",
                "Cybersecurity CTF Arena",
                "ctf",
                "Capture-The-Flag jeopardy challenge arena featuring web exploitation, reverse engineering, cryptography, forensics, dynamic flags, and isolated Docker labs.",
                "flag",
                json.dumps(["ctf"]),
                "ctf_grid",
                json.dumps(["team", "individual", "mixed"]),
                json.dumps({"policy": "standard", "dynamic_decay": True}),
                "free",
                "fixed",
                json.dumps(["challenge_files", "flags"]),
                json.dumps(["flag_submission", "docker_labs", "hint_progression", "attachment_vault", "team_scoring", "leaderboards"]),
                json.dumps({"flag_format": "CYBER{...}", "lab_timeout_min": 60}),
                1, now_iso, now_iso
            ),
            (
                "mcq-knowledge-quiz",
                "MCQ & Knowledge Quiz",
                "mcq",
                "Timed multiple-choice knowledge assessments with single/multi-select options, negative marking rules, randomized shuffling, and attempt limits.",
                "help-circle",
                json.dumps(["mcq"]),
                "mcq_quiz",
                json.dumps(["individual"]),
                json.dumps({"policy": "standard", "negative_marking": True}),
                "free",
                "fixed",
                json.dumps(["question_options"]),
                json.dumps(["question_banks", "answer_options", "quiz_timer", "randomization", "attempt_policies", "results_review"]),
                json.dumps({"time_limit_sec": 60, "allow_revisit": True}),
                1, now_iso, now_iso
            ),
            (
                "combined-cyber-code",
                "Combined Cyber & Code Sprint",
                "combined",
                "Comprehensive multi-track event uniting CTF security challenges, DSA competitive programming, and MCQ trivia under a unified event leaderboard.",
                "layers",
                json.dumps(["dsa", "ctf", "mcq"]),
                "combined",
                json.dumps(["team", "individual", "mixed"]),
                json.dumps({"policy": "standard", "cross_track_weights": True}),
                "free",
                "fixed",
                json.dumps(["source_code", "flags", "question_options"]),
                json.dumps(["code_editor", "flag_submission", "quiz_engine", "multi_track_tabs", "squad_management", "unified_leaderboard"]),
                json.dumps({"tracks": ["ctf", "dsa", "mcq"]}),
                1, now_iso, now_iso
            ),
            (
                "puzzle-quest-challenge",
                "Algorithmic Puzzle Quest",
                "puzzle",
                "Logic puzzles, cipher decryptions, and riddle-based challenges testing lateral thinking, pattern recognition, and rapid problem-solving.",
                "sparkles",
                json.dumps(["puzzle", "dsa"]),
                "split_code",
                json.dumps(["individual", "team"]),
                json.dumps({"policy": "standard"}),
                "free",
                "fixed",
                json.dumps(["source_code", "puzzle_hints"]),
                json.dumps(["puzzle_input", "code_editor", "hints", "leaderboards"]),
                json.dumps({}),
                1, now_iso, now_iso
            )
        ]
        cursor.executemany("""
            INSERT INTO competition_templates (
                slug, name, competition_type, description, icon,
                supported_question_types, workspace_layout, participation_modes,
                scoring_configuration, question_navigation_policy, question_order_mode,
                supported_attachments, enabled_features, default_config,
                is_builtin, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, builtin_templates)
        print(f"[MIGRATION] Seeded {len(builtin_templates)} built-in competition templates.")

    conn.commit()
    conn.close()
    print("[MIGRATION] Event upgrade migration completed successfully.")

if __name__ == "__main__":
    run_migrations()
