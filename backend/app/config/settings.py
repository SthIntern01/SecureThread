from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SecureThread"
    PROJECT_NAME: str = "SecureThread" 
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Database
    DATABASE_URL: str
    
    # GitHub OAuth
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    GITHUB_REDIRECT_URI: str
    
    # GitLab OAuth
    GITLAB_CLIENT_ID: str
    GITLAB_CLIENT_SECRET: str
    GITLAB_REDIRECT_URI: str

    # Bitbucket OAuth
    BITBUCKET_CLIENT_ID: str = ""
    BITBUCKET_CLIENT_SECRET: str = ""
    BITBUCKET_REDIRECT_URI: str = "http://localhost:3000/auth/bitbucket/callback"

    # LLM Configuration
    DEEPSEEK_API_KEY: str
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:8080"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8081",  # ADD THIS LINE - your actual frontend URL
        "http://localhost:5173",
        "http://127.0.0.1:8081"
    ]
    
    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # This line fixes the validation error


settings = Settings()