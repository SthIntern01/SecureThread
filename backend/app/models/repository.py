from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    github_id = Column(Integer, unique=True, index=True, nullable=False)
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
    # Relationships
    scans = relationship("Scan", back_populates="repository", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendation", back_populates="repository", cascade="all, delete-orphan")
    ai_analysis_requests = relationship("AIAnalysisRequest", back_populates="repository")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Repository(name='{self.name}', full_name='{self.full_name}')>"