from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import GitHubAuthRequest, GitHubAuthResponse, Token
from app.services.auth_service import AuthService
from app.services.github_service import GitHubService
from app.api.deps import get_current_active_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ===============================
# GITHUB AUTHENTICATION ROUTES ONLY
# ===============================

@router.get("/github/authorize")
async def github_authorize():
    """Get GitHub OAuth authorization URL"""
    auth_url = GitHubService.get_authorization_url()
    return {"authorization_url": auth_url}

@router.post("/github/callback", response_model=GitHubAuthResponse)
async def github_callback(
    auth_request: GitHubAuthRequest,
    db: Session = Depends(get_db)
):
    """Handle GitHub OAuth callback"""
    auth_service = AuthService(db)
    
    result = await auth_service.authenticate_github(auth_request.code)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to authenticate with GitHub"
        )
    
    return result

# ===============================
# COMMON AUTHENTICATION ROUTES
# ===============================

@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_active_user)
):
    """Refresh access token"""
    try:
        from app.core.security import create_access_token
        from datetime import timedelta
        from app.config.settings import settings
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(current_user.id)}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh token: {str(e)}"
        )

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current authenticated user's information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "github_username": current_user.github_username,
        "gitlab_username": current_user.gitlab_username,
        "bitbucket_username": current_user.bitbucket_username,  # ← THIS WAS MISSING!
        "google_email": current_user.google_email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
    }