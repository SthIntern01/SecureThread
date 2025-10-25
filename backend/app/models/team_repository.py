# backend/models/team_repository.py
from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TeamRepository(Base):
    __tablename__ = "team_repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    repository_id = Column(Integer, ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    team = relationship("Team", back_populates="team_repositories")
    repository = relationship("Repository", back_populates="team_repositories")
    
    # Ensure a repository can only be added once per team
    __table_args__ = (
        UniqueConstraint('team_id', 'repository_id', name='unique_team_repository'),
    )
    
    def __repr__(self):
        return f"<TeamRepository(team_id={self.team_id}, repository_id={self.repository_id})>"