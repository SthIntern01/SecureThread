from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class FeedbackType(enum.Enum):
    bug = "bug"
    feature = "feature" 
    security = "security"
    general = "general"

class SeverityLevel(enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"

class FeedbackStatus(enum.Enum):
    submitted = "submitted"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(50), unique=True, index=True, nullable=False)
    
    # Feedback details
    type = Column(Enum(FeedbackType), nullable=False)
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.medium)
    description = Column(Text, nullable=False)
    steps_to_reproduce = Column(Text, nullable=True)
    
    # User information
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    
    # Status and metadata
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.submitted)
    attachments = Column(Text, nullable=True)  # JSON string of file URLs
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="feedback_submissions")
    
    def __repr__(self):
        return f"<Feedback(tracking_id='{self.tracking_id}', type='{self.type}', status='{self.status}')>"