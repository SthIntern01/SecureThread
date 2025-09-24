from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)

    # GitHub fields
    github_id = Column(Integer, unique=True, index=True, nullable=True)
    github_username = Column(String, nullable=True)
    github_access_token = Column(Text, nullable=True)

    # GitLab fields
    gitlab_id = Column(String, unique=True, index=True, nullable=True)
    gitlab_username = Column(String, nullable=True)
    gitlab_access_token = Column(Text, nullable=True)

    # Google fields - ADD THESE LINES
    google_id = Column(String, unique=True, index=True, nullable=True)
    google_email = Column(String, nullable=True)  
    google_access_token = Column(Text, nullable=True)
    google_refresh_token = Column(Text, nullable=True)

    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    # Bitbucket Integration
    bitbucket_access_token = Column(String, nullable=True)
    bitbucket_username = Column(String, nullable=True)
    bitbucket_user_id = Column(String, nullable=True)


    
    # Relationships
    repositories = relationship("Repository", back_populates="owner", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendation", back_populates="user", cascade="all, delete-orphan")
    ai_usage_metrics = relationship("AIUsageMetrics", back_populates="user", cascade="all, delete-orphan")
    ai_feedback = relationship("AIFeedback", back_populates="user", cascade="all, delete-orphan")
    custom_rules = relationship("UserCustomRule", back_populates="uploader", cascade="all, delete-orphan")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User(email='{self.email}', github_username='{self.github_username}', gitlab_username='{self.gitlab_username}')>"