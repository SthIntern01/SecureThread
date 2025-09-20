from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    
    # OAuth provider IDs - only one should be set per repository
    github_id = Column(Integer, index=True, nullable=True)  # Changed to nullable
    bitbucket_id = Column(String, index=True, nullable=True)  # Bitbucket uses UUID strings
    gitlab_id = Column(String, index=True, nullable=True)  # GitLab uses integer but store as string
    
    # Common repository fields
    name = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    html_url = Column(String, nullable=False)
    clone_url = Column(String, nullable=False)
    default_branch = Column(String, default="main")
    language = Column(String, nullable=True)
    is_private = Column(Boolean, default=False)
    is_fork = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="repositories")
    scans = relationship("Scan", back_populates="repository", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendation", back_populates="repository", cascade="all, delete-orphan")
    ai_analysis_requests = relationship("AIAnalysisRequest", back_populates="repository")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def source_type(self) -> str:
        """Determine the source type of this repository"""
        if self.github_id:
            return "github"
        elif self.bitbucket_id:
            return "bitbucket"
        elif self.gitlab_id:
            return "gitlab"
        else:
            return "unknown"

    @property
    def external_id(self) -> str:
        """Get the external ID regardless of source"""
        if self.github_id:
            return str(self.github_id)
        elif self.bitbucket_id:
            return self.bitbucket_id
        elif self.gitlab_id:
            return self.gitlab_id
        else:
            return ""

    @property
    def source(self) -> str:
        """Get the source type for the repository (alias for source_type)"""
        return self.source_type

    def __repr__(self):
        return f"<Repository(name='{self.name}', full_name='{self.full_name}', source='{self.source_type}')>"