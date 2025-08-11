# backend/app/core/settings.py

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SecureThread"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/securethread"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # GitHub Integration
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_REDIRECT_URI: Optional[str] = None
    
    # GitLab Integration (Added to fix the error)
    GITLAB_CLIENT_ID: Optional[str] = None
    GITLAB_CLIENT_SECRET: Optional[str] = None
    GITLAB_REDIRECT_URI: Optional[str] = None
    
    # AI Services
    DEEPSEEK_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_EXTENSIONS: set = {
        '.py', '.js', '.jsx', '.ts', '.tsx', '.php', '.java', 
        '.cpp', '.c', '.cs', '.rb', '.go', '.rs', '.swift',
        '.sql', '.sh', '.bash', '.yaml', '.yml', '.json',
        '.xml', '.html', '.css', '.dockerfile', '.makefile'
    }
    UPLOAD_DIR: str = "uploads"
    
    # Frontend and Environment
    FRONTEND_URL: Optional[str] = None
    ENVIRONMENT: Optional[str] = None
    
    # CORS Configuration - Updated to include your frontend port
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:8080",  # Added for your frontend
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080"   # Added for your frontend
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        # Allow extra fields to prevent validation errors
        extra = "allow"

# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)