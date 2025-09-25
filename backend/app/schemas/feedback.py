from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class FeedbackTypeEnum(str, Enum):
    bug = "bug"
    feature = "feature"
    security = "security"
    general = "general"

class SeverityLevelEnum(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"

class FeedbackStatusEnum(str, Enum):
    submitted = "submitted"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

# Request schemas
class FeedbackCreate(BaseModel):
    type: FeedbackTypeEnum
    severity: Optional[SeverityLevelEnum] = SeverityLevelEnum.medium
    description: str = Field(..., min_length=10, max_length=5000)
    stepsToReproduce: Optional[str] = Field(None, max_length=3000)
    userEmail: Optional[str] = Field(None, max_length=255)
    
    @validator('description')
    def description_must_be_meaningful(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Description must be at least 10 characters long')
        return v.strip()

class FeedbackStatusUpdate(BaseModel):
    status: FeedbackStatusEnum

# Response schemas
class FeedbackResponse(BaseModel):
    tracking_id: str
    message: str
    
    class Config:
        from_attributes = True

class AttachmentInfo(BaseModel):
    filename: str
    size: int
    url: Optional[str] = None

class FeedbackDetail(BaseModel):
    id: int
    tracking_id: str
    type: FeedbackTypeEnum
    severity: Optional[SeverityLevelEnum]
    description: str
    steps_to_reproduce: Optional[str]
    user_email: Optional[str]
    status: FeedbackStatusEnum
    created_at: datetime
    updated_at: Optional[datetime]
    attachments: Optional[List[dict]] = []
    
    class Config:
        from_attributes = True

class FeedbackList(BaseModel):
    items: List[FeedbackDetail]
    total: int
    page: int
    per_page: int

class FeedbackStats(BaseModel):
    total_feedback: int
    by_type: dict
    by_status: dict
    
    class Config:
        from_attributes = True

# File upload schema
class FileUploadResponse(BaseModel):
    filename: str
    size: int
    url: str
    message: str