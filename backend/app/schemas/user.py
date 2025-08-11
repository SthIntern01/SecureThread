from pydantic import BaseModel, EmailStr
from typing import Optional, Union
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    github_username: Optional[str] = None
    gitlab_username: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    # GitHub fields
    github_id: Optional[int] = None
    github_access_token: Optional[str] = None

    # GitLab fields - Changed to Union[int, str] to handle both
    gitlab_id: Optional[Union[int, str]] = None
    gitlab_access_token: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserInDBBase(UserBase):
    id: int
    github_id: Optional[int] = None
    gitlab_id: Optional[str] = None  # Changed to str to match database
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    github_access_token: Optional[str] = None
    gitlab_access_token: Optional[str] = None