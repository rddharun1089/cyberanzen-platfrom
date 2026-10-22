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

    conn.commit()
    conn.close()
    print("[MIGRATION] Event upgrade migration completed successfully.")

if __name__ == "__main__":
    run_migrations()
