import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PARTICIPANT = "participant"

class PublicationStatus(str, enum.Enum):
    PUBLISHED = "PUBLISHED"
    DRAFT = "DRAFT"
    ARCHIVED = "ARCHIVED"

class ValidationStatus(str, enum.Enum):
    VALIDATED = "VALIDATED"
    NEEDS_SOLUTION_REVIEW = "NEEDS_SOLUTION_REVIEW"
    NEEDS_SPECIFICATION = "NEEDS_SPECIFICATION"
    NEEDS_TEST_CASES = "NEEDS_TEST_CASES"

class Verdict(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    WRONG_ANSWER = "WRONG_ANSWER"
    COMPILE_ERROR = "COMPILE_ERROR"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    PENDING = "PENDING"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.PARTICIPANT.value, nullable=False)
    points = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    tokens = relationship("EvidenceToken", back_populates="user", cascade="all, delete-orphan")

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(String(20), primary_key=True, index=True)  # CASE-01
    number = Column(Integer, unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    phase = Column(String(100), nullable=False)
    domain = Column(String(100), index=True, nullable=False)
    points = Column(Integer, default=50, nullable=False)
    difficulty = Column(String(20), default="Beginner", nullable=False)
    time_limit_ms = Column(Integer, default=2000, nullable=False)
    memory_limit_mb = Column(Integer, default=256, nullable=False)
    flag_format = Column(String(100), nullable=False)
    publication_status = Column(String(20), default=PublicationStatus.DRAFT.value, nullable=False)
    validation_status = Column(String(30), default=ValidationStatus.VALIDATED.value, nullable=False)
    
    story = Column(Text, nullable=False)
    objective = Column(Text, nullable=False)
    input_contract = Column(Text, nullable=False)
    required_result = Column(Text, nullable=False)
    constraints = Column(Text, nullable=True)
    
    starter_py = Column(Text, nullable=True)
    starter_cpp = Column(Text, nullable=True)
    starter_c = Column(Text, nullable=True)
    reference_solution = Column(Text, nullable=True)
    validation_notes = Column(Text, nullable=True)
    
    judge_enabled = Column(Boolean, default=True, nullable=False)
    reveal_failed_tests = Column(Boolean, default=True, nullable=False)

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    test_cases = relationship("TestCase", back_populates="case", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="case", cascade="all, delete-orphan")
    tokens = relationship("EvidenceToken", back_populates="case", cascade="all, delete-orphan")

class TestCase(Base):
    __tablename__ = "test_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(20), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    test_type = Column(String(20), default="public_sample", nullable=False)  # public_sample or hidden_test
    test_index = Column(Integer, default=1, nullable=False)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    points = Column(Integer, default=0, nullable=False)

    case = relationship("Case", back_populates="test_cases")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(20), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    language = Column(String(20), nullable=False)  # c, cpp, python3
    source_code = Column(Text, nullable=False)
    verdict = Column(String(30), default=Verdict.PENDING.value, nullable=False, index=True)
    execution_time_ms = Column(Integer, default=0, nullable=False)
    memory_used_kb = Column(Integer, default=0, nullable=False)
    compile_log = Column(Text, nullable=True)
    score = Column(Integer, default=0, nullable=False)
    is_sample_run = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="submissions")
    case = relationship("Case", back_populates="submissions")

class EvidenceToken(Base):
    __tablename__ = "evidence_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(20), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    token_value = Column(String(255), nullable=False)
    is_valid = Column(Boolean, default=True, nullable=False)
    unlocked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="tokens")
    case = relationship("Case", back_populates="tokens")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

class GitSyncRecord(Base):
    __tablename__ = "git_sync_records"
    
    id = Column(Integer, primary_key=True, index=True)
    repo_url = Column(String(255), nullable=False)
    branch = Column(String(100), default="main", nullable=False)
    last_commit = Column(String(100), nullable=True)
    status = Column(String(50), default="IDLE", nullable=False)
    preview_diff = Column(Text, nullable=True)
    synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
