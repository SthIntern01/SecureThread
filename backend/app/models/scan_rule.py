# Create: backend/app/models/scan_rule.py

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ScanRule(Base):
    """Built-in security scan rules"""
    __tablename__ = "scan_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    severity = Column(String(50), nullable=False)
    rule_content = Column(Text, nullable=False)  # YARA rule content
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<ScanRule(id={self.id}, name='{self.name}', category='{self.category}')>"


class UserCustomRule(Base):
    """User-uploaded custom scan rules"""
    __tablename__ = "user_custom_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100), index=True)
    severity = Column(String(50))
    rule_content = Column(Text, nullable=False)  # YARA rule content from JSON
    is_active = Column(Boolean, default=True, index=True)
    is_approved = Column(Boolean, default=False, index=True)  # For moderation
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    uploader = relationship("User", back_populates="custom_rules")
    
    def __repr__(self):
        return f"<UserCustomRule(id={self.id}, name='{self.name}', uploaded_by={self.uploaded_by})>"