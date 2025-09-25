from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class MemberRole(enum.Enum):
    owner = "Owner"
    admin = "Admin"
    member = "Member"
    viewer = "Viewer"

class MemberStatus(enum.Enum):
    active = "Active"
    pending = "Pending"
    inactive = "Inactive"

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    invitations = relationship("TeamInvitation", back_populates="team", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Team(name='{self.name}', created_by={self.created_by})>"

class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(Enum(MemberRole), nullable=False, default=MemberRole.member)
    status = Column(Enum(MemberStatus), nullable=False, default=MemberStatus.active)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", foreign_keys=[user_id], back_populates="team_memberships")
    inviter = relationship("User", foreign_keys=[invited_by])
    
    def __repr__(self):
        return f"<TeamMember(team_id={self.team_id}, user_id={self.user_id}, role='{self.role}')>"

class TeamInvitation(Base):
    __tablename__ = "team_invitations"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(Enum(MemberRole), nullable=False, default=MemberRole.member)
    token = Column(String(255), unique=True, nullable=False, index=True)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status tracking
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    used_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    team = relationship("Team", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[invited_by])
    acceptor = relationship("User", foreign_keys=[used_by])
    
    def __repr__(self):
        return f"<TeamInvitation(email='{self.email}', team_id={self.team_id}, token='{self.token}')>"