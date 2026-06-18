from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ANTHROPIC_API_KEY: str
    GOOGLE_APPLICATION_CREDENTIALS: str = ""

    # LLM orchestrator: which provider to use by default, and per-provider models.
    LLM_PROVIDER: str = "anthropic"  # "anthropic" | "groq" | "gemini"
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GOOGLE_API_KEY: str = ""  # Gemini (separate from GOOGLE_APPLICATION_CREDENTIALS, which is for Vision OCR)
    GEMINI_MODEL: str = "gemini-2.5-flash"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()