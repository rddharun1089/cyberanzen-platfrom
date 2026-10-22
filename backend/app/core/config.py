import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CyberAnzen Arena — Cybersecurity CTF & Competitive Programming Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cyberanzen-arena-secure-platform-master-key-2026!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cyberanzen.db")
    
    # Judge Worker Execution Limits
    JUDGE_TIMEOUT_SEC: float = 3.0
    JUDGE_MEMORY_LIMIT_MB: int = 256
    JUDGE_MAX_OUTPUT_BYTES: int = 1024 * 1024  # 1 MB
    JUDGE_TEMP_DIR: str = os.getenv("JUDGE_TEMP_DIR", "/tmp/cyberanzen_judge")
    
    # Project paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    QUESTIONS_DIR: str = os.path.join(BASE_DIR, "questions")
    
    model_config = SettingsConfigDict(case_sensitive=True, extra="allow")

settings = Settings()
