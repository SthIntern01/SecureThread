from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True


class UserCreate(BaseModel):
    email: str
    
    # GitHub fields
    github_id: Optional[int] = None
    github_username: Optional[str] = None
    github_access_token: Optional[str] = None
    
    # GitLab fields
    gitlab_id: Optional[str] = None
    gitlab_username: Optional[str] = None
    gitlab_access_token: Optional[str] = None
    
    # Google fields
    google_id: Optional[str] = None
    google_email: Optional[str] = None
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None
    
    # Common fields
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None


class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    # Include sensitive fields for internal use
    github_id: Optional[int] = None
    github_username: Optional[str] = None
    github_access_token: Optional[str] = None
    gitlab_id: Optional[str] = None
    gitlab_username: Optional[str] = None
    gitlab_access_token: Optional[str] = None
    google_id: Optional[str] = None
    google_email: Optional[str] = None
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    github_username: Optional[str] = None
    gitlab_username: Optional[str] = None
    google_email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Public user info (excluding sensitive data)"""
    id: int
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    github_username: Optional[str] = None
    gitlab_username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserConnections(BaseModel):
    """User OAuth connections status"""
    github_connected: bool = False
    gitlab_connected: bool = False
    google_connected: bool = False
    github_username: Optional[str] = None
    gitlab_username: Optional[str] = None
    google_email: Optional[str] = None

    class Config:
        from_attributes = True