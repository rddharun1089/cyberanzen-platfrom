import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey,
    Enum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base

# ==============================================================================
# ENUMS & CONSTANTS
# ==============================================================================

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    EVENT_ADMIN = "event_admin"
    CHALLENGE_AUTHOR = "challenge_author"
    JUDGE_OPERATOR = "judge_operator"
    PROCTOR = "proctor"
    AUDITOR = "auditor"
    PARTICIPANT = "participant"
    # Legacy alias support
    ADMIN = "admin"

    @classmethod
    def is_admin_or_super(cls, role_str: str) -> bool:
        return role_str in (cls.SUPER_ADMIN.value, cls.ADMIN.value, "admin", "super_admin")

    @classmethod
    def has_admin_privileges(cls, role_str: str) -> bool:
        return role_str in (
            cls.SUPER_ADMIN.value, cls.EVENT_ADMIN.value, cls.ADMIN.value, "admin", "super_admin"
        )

    @classmethod
    def can_author_challenges(cls, role_str: str) -> bool:
        return role_str in (
            cls.SUPER_ADMIN.value, cls.EVENT_ADMIN.value, cls.CHALLENGE_AUTHOR.value,
            cls.ADMIN.value, "admin", "super_admin"
        )

class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    REGISTRATION_OPEN = "registration_open"
    LIVE = "live"
    UPCOMING = "upcoming"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"
    COMPLETED = "completed"
    RESULTS_PUBLISHED = "results_published"
    ARCHIVED = "archived"

class EventType(str, enum.Enum):
    DSA = "dsa"
    CTF = "ctf"
    MCQ = "mcq"
    CTF_DSA = "ctf_dsa"
    DSA_MCQ = "dsa_mcq"
    CTF_MCQ = "ctf_mcq"
    COMBINED = "combined"

class ParticipationMode(str, enum.Enum):
    TEAM = "team"
    INDIVIDUAL = "individual"
    MIXED = "mixed"

class ClipboardPolicy(str, enum.Enum):
    ALLOWED = "allowed"
    RESTRICTED = "restricted"
    MANAGED_EXAM = "managed_exam"

class ScoringPolicy(str, enum.Enum):
    STANDARD = "standard"
    DECAY = "decay"
    FIRST_SOLVE_BONUS = "first_solve_bonus"

class ChallengeStatus(str, enum.Enum):
    DRAFT = "draft"
    VALIDATION = "validation"
    REVIEW = "review"
    PUBLISHED = "published"
    ARCHIVED = "archived"

# Legacy aliases
PublicationStatus = ChallengeStatus
ValidationStatus = ChallengeStatus

class DifficultyLevel(str, enum.Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"

class CTFCategory(str, enum.Enum):
    WEB = "web"
    CRYPTO = "crypto"
    FORENSICS = "forensics"
    PWN = "pwn"
    REVERSE = "reverse"
    NETWORK = "network"
    OSINT = "osint"
    STEGO = "stego"
    CLOUD = "cloud"
    IOT = "iot"
    PUZZLE = "puzzle"
    MISC = "misc"

class FlagType(str, enum.Enum):
    STATIC = "static"
    DYNAMIC_USER = "dynamic_user"
    DYNAMIC_TEAM = "dynamic_team"
    DYNAMIC_INSTANCE = "dynamic_instance"

class QuestionType(str, enum.Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"

class TeamMemberRole(str, enum.Enum):
    OWNER = "OWNER"
    MEMBER = "MEMBER"

class Verdict(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    WRONG_ANSWER = "WRONG_ANSWER"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
    COMPILE_ERROR = "COMPILE_ERROR"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    PENDING = "PENDING"

class LabStatus(str, enum.Enum):
    STARTING = "starting"
    RUNNING = "running"
    STOPPED = "stopped"
    EXPIRED = "expired"
    FAILED = "failed"

# ==============================================================================
# AUTHENTICATION & IDENTITY
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), default=UserRole.PARTICIPANT.value, nullable=False, index=True)
    points = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    solves = relationship("Solve", back_populates="user", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMembership", back_populates="user", cascade="all, delete-orphan")
    mcq_attempts = relationship("MCQAttempt", back_populates="user", cascade="all, delete-orphan")
    lab_instances = relationship("DockerLabInstance", back_populates="user", cascade="all, delete-orphan")
    event_registrations = relationship("EventRegistration", back_populates="user", cascade="all, delete-orphan")
    tokens = relationship("EvidenceToken", back_populates="user", cascade="all, delete-orphan")

    @property
    def team_membership(self):
        """Backward-compatible helper returning the user's primary/active team membership"""
        return self.team_memberships[0] if self.team_memberships else None

class SessionToken(Base):
    __tablename__ = "session_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_jti = Column(String(64), unique=True, index=True, nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

# ==============================================================================
# EVENTS & COMPETITIONS
# ==============================================================================

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    event_type = Column(String(30), default=EventType.DSA.value, nullable=False, index=True)  # dsa | ctf | mcq
    short_description = Column(String(500), nullable=True)
    description = Column(Text, nullable=False)
    banner_url = Column(String(255), nullable=True)
    rules = Column(Text, nullable=True)
    organizer = Column(String(100), default="CyberAnzen Organization", nullable=True)
    category = Column(String(100), default="General", nullable=True)
    difficulty = Column(String(30), default="Intermediate", nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    eligibility = Column(Text, nullable=True)
    visibility = Column(String(30), default="public", nullable=False)  # public | unlisted | restricted
    capacity = Column(Integer, nullable=True)
    contact_info = Column(String(200), nullable=True)
    status = Column(String(30), default=EventStatus.DRAFT.value, nullable=False, index=True)
    participation_mode = Column(String(30), default=ParticipationMode.TEAM.value, nullable=False)
    team_size_min = Column(Integer, default=1, nullable=False)
    team_size_max = Column(Integer, default=4, nullable=False)

    # Team configuration policies
    team_allow_create = Column(Boolean, default=True, nullable=False)
    team_allow_join_code = Column(Boolean, default=True, nullable=False)
    team_require_approval = Column(Boolean, default=False, nullable=False)
    team_allow_member_changes = Column(Boolean, default=True, nullable=False)
    team_lock_on_start = Column(Boolean, default=True, nullable=False)
    team_allow_ownership_transfer = Column(Boolean, default=True, nullable=False)
    team_allow_delete_empty = Column(Boolean, default=True, nullable=False)
    team_show_members_leaderboard = Column(Boolean, default=True, nullable=False)

    # Leaderboard & visibility settings
    leaderboard_type = Column(String(30), default="individual", nullable=False)  # individual | team | both
    leaderboard_visible = Column(Boolean, default=True, nullable=False)
    leaderboard_frozen = Column(Boolean, default=False, nullable=False)
    scores_visible_during_event = Column(Boolean, default=True, nullable=False)
    auto_publish_results = Column(Boolean, default=True, nullable=False)
    show_solve_times = Column(Boolean, default=True, nullable=False)
    show_solve_counts = Column(Boolean, default=True, nullable=False)
    anonymize_participants = Column(Boolean, default=False, nullable=False)

    start_time = Column(DateTime, nullable=True, index=True)
    end_time = Column(DateTime, nullable=True, index=True)
    registration_open = Column(Boolean, default=True, nullable=False)
    registration_close = Column(DateTime, nullable=True)
    clipboard_policy = Column(String(30), default=ClipboardPolicy.RESTRICTED.value, nullable=False)
    scoring_policy = Column(String(30), default=ScoringPolicy.STANDARD.value, nullable=False)
    allowed_languages = Column(Text, default='["python3", "cpp", "c"]', nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="event", cascade="all, delete-orphan")
    solves = relationship("Solve", back_populates="event", cascade="all, delete-orphan")
    dsa_questions = relationship("EventDSAQuestion", back_populates="event", cascade="all, delete-orphan")
    ctf_challenges = relationship("EventCTFChallenge", back_populates="event", cascade="all, delete-orphan")
    mcq_questions = relationship("EventMCQQuestion", back_populates="event", cascade="all, delete-orphan")

class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    selected_mode = Column(String(30), default="individual", nullable=False)  # individual | team (for mixed mode)
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    event = relationship("Event", back_populates="registrations")
    user = relationship("User", back_populates="event_registrations")
    team = relationship("Team")

    __table_args__ = (
        UniqueConstraint('event_id', 'user_id', name='uq_event_user_reg'),
    )

class EventDSAQuestion(Base):
    __tablename__ = "event_dsa_questions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("dsa_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    points_override = Column(Integer, nullable=True)
    release_time = Column(DateTime, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)

    event = relationship("Event", back_populates="dsa_questions")
    question = relationship("DSAQuestion")

    __table_args__ = (
        UniqueConstraint('event_id', 'question_id', name='uq_event_dsa_q'),
    )

class EventCTFChallenge(Base):
    __tablename__ = "event_ctf_challenges"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("ctf_challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    points_override = Column(Integer, nullable=True)
    release_time = Column(DateTime, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)

    event = relationship("Event", back_populates="ctf_challenges")
    challenge = relationship("CTFChallenge")

    __table_args__ = (
        UniqueConstraint('event_id', 'challenge_id', name='uq_event_ctf_c'),
    )

class EventMCQQuestion(Base):
    __tablename__ = "event_mcq_questions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    mcq_id = Column(Integer, ForeignKey("mcq_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    points_override = Column(Integer, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)

    event = relationship("Event", back_populates="mcq_questions")
    mcq = relationship("MCQQuestion")

    __table_args__ = (
        UniqueConstraint('event_id', 'mcq_id', name='uq_event_mcq_q'),
    )

class QuestionImportJob(Base):
    __tablename__ = "question_import_jobs"

    id = Column(Integer, primary_key=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    source_type = Column(String(30), nullable=False)  # pdf | docx | markdown | json | csv | zip | git
    source_name = Column(String(255), nullable=False)
    status = Column(String(30), default="extracted", nullable=False)  # uploaded | extracting | extracted | failed | completed
    total_detected = Column(Integer, default=0, nullable=False)
    total_imported = Column(Integer, default=0, nullable=False)
    extracted_data_json = Column(Text, default='[]', nullable=False)  # JSON array of extracted questions
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    created_by = relationship("User")

# ==============================================================================
# SQUADS & TEAMS
# ==============================================================================

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    invitation_code = Column(String(64), unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    points = Column(Integer, default=0, nullable=False, index=True)
    max_members = Column(Integer, default=4, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    event = relationship("Event", back_populates="teams")
    owner = relationship("User", foreign_keys=[owner_id])
    memberships = relationship("TeamMembership", back_populates="team", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="team")
    solves = relationship("Solve", back_populates="team", cascade="all, delete-orphan")
    solved_cases = relationship("TeamSolvedCase", back_populates="team", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('event_id', 'name', name='uq_team_event_name'),
    )

class TeamMembership(Base):
    __tablename__ = "team_memberships"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), default=TeamMemberRole.MEMBER.value, nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    team = relationship("Team", back_populates="memberships")
    user = relationship("User", back_populates="team_memberships")

    __table_args__ = (
        UniqueConstraint('team_id', 'user_id', name='uq_team_member'),
    )

class TeamSolvedCase(Base):
    """Legacy compatibility model for existing squad score tests"""
    __tablename__ = "team_solved_cases"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(50), nullable=False, index=True)
    points_awarded = Column(Integer, default=0, nullable=False)
    solved_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True)
    solved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    team = relationship("Team", back_populates="solved_cases")
    solved_by = relationship("User")

    __table_args__ = (
        UniqueConstraint('team_id', 'case_id', name='uq_team_case_solve'),
    )

# ==============================================================================
# DSA QUESTION STUDIO & QUESTION BANK
# ==============================================================================

class DSAQuestion(Base):
    __tablename__ = "dsa_questions"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    statement = Column(Text, nullable=False)
    input_spec = Column(Text, nullable=False)
    output_spec = Column(Text, nullable=False)
    constraints = Column(Text, nullable=True)
    difficulty = Column(String(30), default=DifficultyLevel.BEGINNER.value, nullable=False)
    category = Column(String(100), default="Data Structures & Algorithms", nullable=False, index=True)
    tags = Column(Text, default='[]', nullable=False)
    points = Column(Integer, default=100, nullable=False)
    time_limit_ms = Column(Integer, default=2000, nullable=False)
    memory_limit_mb = Column(Integer, default=256, nullable=False)
    supported_languages = Column(Text, default='["python3", "cpp", "c"]', nullable=False)
    starter_py = Column(Text, nullable=True)
    starter_cpp = Column(Text, nullable=True)
    starter_c = Column(Text, nullable=True)
    reference_solution = Column(Text, nullable=True)
    status = Column(String(30), default=ChallengeStatus.DRAFT.value, nullable=False, index=True)
    judge_enabled = Column(Boolean, default=True, nullable=False)
    reveal_failed_tests = Column(Boolean, default=True, nullable=False)
    allow_copy_paste = Column(Boolean, default=False, nullable=False)
    is_dynamic_instance = Column(Boolean, default=False, nullable=False)
    template_id = Column(Integer, nullable=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    test_cases = relationship("DSATestCase", back_populates="question", cascade="all, delete-orphan")

class DSATestCase(Base):
    __tablename__ = "dsa_test_cases"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("dsa_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    test_type = Column(String(30), default="public_sample", nullable=False)  # public_sample | hidden_test
    test_index = Column(Integer, default=1, nullable=False)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    points = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    question = relationship("DSAQuestion", back_populates="test_cases")

# Legacy Case & TestCase compatibility wrappers
Case = DSAQuestion
TestCase = DSATestCase

# ==============================================================================
# MCQ QUESTION STUDIO & QUIZ ENGINE
# ==============================================================================

class MCQQuestion(Base):
    __tablename__ = "mcq_questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    prompt = Column(Text, nullable=False)
    question_type = Column(String(30), default=QuestionType.SINGLE_CHOICE.value, nullable=False)
    difficulty = Column(String(30), default=DifficultyLevel.BEGINNER.value, nullable=False)
    category = Column(String(100), default="Cybersecurity", nullable=False, index=True)
    tags = Column(Text, default='[]', nullable=False)
    options = Column(Text, nullable=False)  # JSON: [{"id": 1, "text": "...", "is_correct": true, "explanation": "..."}]
    points_positive = Column(Integer, default=10, nullable=False)
    points_negative = Column(Integer, default=0, nullable=False)
    time_limit_sec = Column(Integer, default=60, nullable=False)
    explanation = Column(Text, nullable=True)
    status = Column(String(30), default=ChallengeStatus.DRAFT.value, nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    attempts = relationship("MCQAttempt", back_populates="mcq", cascade="all, delete-orphan")

class MCQAttempt(Base):
    __tablename__ = "mcq_attempts"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mcq_id = Column(Integer, ForeignKey("mcq_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_option_ids = Column(Text, nullable=False)  # JSON list of int IDs [1, 2]
    is_correct = Column(Boolean, default=False, nullable=False)
    score_awarded = Column(Integer, default=0, nullable=False)
    time_taken_sec = Column(Integer, default=0, nullable=False)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="mcq_attempts")
    mcq = relationship("MCQQuestion", back_populates="attempts")

# ==============================================================================
# CTF CHALLENGE STUDIO & DYNAMIC FLAGS
# ==============================================================================

class CTFChallenge(Base):
    __tablename__ = "ctf_challenges"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default=CTFCategory.WEB.value, nullable=False, index=True)
    difficulty = Column(String(30), default=DifficultyLevel.BEGINNER.value, nullable=False)
    points = Column(Integer, default=100, nullable=False)
    dynamic_scoring = Column(Boolean, default=False, nullable=False)
    min_points = Column(Integer, default=50, nullable=False)
    decay_rate = Column(Float, default=30.0, nullable=False)
    flag_type = Column(String(30), default=FlagType.STATIC.value, nullable=False)
    static_flag = Column(String(255), nullable=True)
    static_flag_hash = Column(String(255), nullable=True)
    hints = Column(Text, default='[]', nullable=False)  # JSON: [{"id": 1, "hint": "...", "cost": 10}]
    files = Column(Text, default='[]', nullable=False)  # JSON: [{"name": "...", "url": "...", "size": 1024}]
    has_docker_lab = Column(Boolean, default=False, nullable=False)
    docker_image = Column(String(255), nullable=True)
    lab_timeout_min = Column(Integer, default=60, nullable=False)
    lab_port_exposed = Column(Integer, default=80, nullable=False)
    lab_env_template = Column(Text, nullable=True)
    status = Column(String(30), default=ChallengeStatus.DRAFT.value, nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    dynamic_flags = relationship("DynamicFlag", back_populates="challenge", cascade="all, delete-orphan")
    lab_instances = relationship("DockerLabInstance", back_populates="challenge", cascade="all, delete-orphan")

class DynamicFlag(Base):
    __tablename__ = "dynamic_flags"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("ctf_challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=True, index=True)
    instance_id = Column(Integer, nullable=True)
    flag_value = Column(String(255), nullable=False)
    flag_hash = Column(String(255), nullable=False, index=True)
    is_solved = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    challenge = relationship("CTFChallenge", back_populates="dynamic_flags")

# ==============================================================================
# DOCKER LAB LIFECYCLE MANAGEMENT
# ==============================================================================

class DockerLabInstance(Base):
    __tablename__ = "docker_lab_instances"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("ctf_challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    container_id = Column(String(100), nullable=True, index=True)
    status = Column(String(30), default=LabStatus.STARTING.value, nullable=False, index=True)
    access_host = Column(String(100), default="127.0.0.1", nullable=False)
    access_port = Column(Integer, nullable=True)
    assigned_flag = Column(String(255), nullable=True)
    memory_limit_mb = Column(Integer, default=512, nullable=False)
    cpu_quota = Column(Float, default=1.0, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    terminated_at = Column(DateTime, nullable=True)

    challenge = relationship("CTFChallenge", back_populates="lab_instances")
    user = relationship("User", back_populates="lab_instances")

# ==============================================================================
# DYNAMIC QUESTION GENERATOR TEMPLATES
# ==============================================================================

class DynamicTemplate(Base):
    __tablename__ = "dynamic_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100), default="DSA", nullable=False)
    statement_template = Column(Text, nullable=False)
    parameter_schema = Column(Text, nullable=False)  # JSON
    generator_script = Column(Text, nullable=False)
    reference_solution = Column(Text, nullable=False)
    validation_rules = Column(Text, default='{}', nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

# ==============================================================================
# SUBMISSIONS, SCORING & SOLVES
# ==============================================================================

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    submission_type = Column(String(30), default="dsa", nullable=False)  # dsa | ctf | mcq
    target_id = Column(String(50), nullable=False, index=True)
    case_id = Column(String(50), nullable=True, index=True)  # Legacy alias for target_id
    language = Column(String(20), nullable=True)
    source_code = Column(Text, nullable=True)
    verdict = Column(String(30), default=Verdict.PENDING.value, nullable=False, index=True)
    execution_time_ms = Column(Integer, default=0, nullable=False)
    memory_used_kb = Column(Integer, default=0, nullable=False)
    compile_log = Column(Text, nullable=True)
    score = Column(Integer, default=0, nullable=False)
    test_results = Column(Text, nullable=True)  # JSON string of test outcomes
    is_sample_run = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="submissions")
    team = relationship("Team", back_populates="submissions")

class Solve(Base):
    __tablename__ = "solves"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    challenge_type = Column(String(30), nullable=False)  # dsa | ctf | mcq
    challenge_id = Column(String(50), nullable=False, index=True)
    points_awarded = Column(Integer, default=0, nullable=False)
    submission_id = Column(Integer, ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True)
    is_first_solve = Column(Boolean, default=False, nullable=False)
    solved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="solves")
    team = relationship("Team", back_populates="solves")
    event = relationship("Event", back_populates="solves")

    __table_args__ = (
        UniqueConstraint('user_id', 'challenge_type', 'challenge_id', name='uq_user_challenge_solve'),
    )

class ScoreAdjustment(Base):
    __tablename__ = "score_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    adjusted_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    points_delta = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    previous_score = Column(Integer, nullable=False)
    new_score = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

# ==============================================================================
# AUDITING, SECURITY INCIDENTS & NOTIFICATIONS
# ==============================================================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=True, index=True)
    actor_username = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    incident_type = Column(String(50), nullable=False, index=True)  # clipboard_violation, brute_force, etc.
    severity = Column(String(20), default="medium", nullable=False)
    metadata_json = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="info", nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), unique=True, index=True, nullable=False)
    setting_value = Column(Text, nullable=False)  # JSON
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

class EvidenceToken(Base):
    """Legacy compatibility model for existing token tests"""
    __tablename__ = "evidence_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(50), nullable=False, index=True)
    token_value = Column(String(255), nullable=False)
    is_valid = Column(Boolean, default=True, nullable=False)
    unlocked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="tokens")
