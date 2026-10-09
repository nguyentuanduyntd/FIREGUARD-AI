import os
from dotenv import load_dotenv

# Load env variables from .env if present
load_dotenv()

class Settings:
    # Internal Security
    AI_API_KEY: str = os.getenv("AI_API_KEY", "fireguard_ai_secret_key_123456")
    
    # LLM Configuration
    # Options: mock, openai, gemini
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock").lower()
    
    # OpenAI Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Gemini Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # Logs and Storage
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    AI_LOGS_DIR: str = os.getenv("AI_LOGS_DIR", "logs/ai")

settings = Settings()

# Ensure logs directory exists
os.makedirs(settings.AI_LOGS_DIR, exist_ok=True)
