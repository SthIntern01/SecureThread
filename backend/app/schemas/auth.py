from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


class GitHubAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None


class GitHubAuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict