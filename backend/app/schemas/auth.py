from pydantic import BaseModel
from typing import Optional, Dict, Any



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


class GitLabAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None


class GitLabAuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


# ADD THESE GOOGLE CLASSES
class GoogleAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None


class GoogleAuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class BitbucketAuthRequest(BaseModel):
    code: str

class BitbucketAuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class BitbucketUserInfo(BaseModel):
    bitbucket_connected: bool
    bitbucket_username: Optional[str] = None
    bitbucket_display_name: Optional[str] = None
    bitbucket_email: Optional[str] = None
    bitbucket_avatar_url: Optional[str] = None