# backend/app/api/v1/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import GitHubAuthRequest, GitHubAuthResponse, Token
from app.services.auth_service import AuthService
from app.services.github_service import GitHubService
from app.api.deps import get_current_active_user
from app.models.user import User
import logging
import time
from typing import Dict, Set

logger = logging.getLogger(__name__)

router = APIRouter()

# CRITICAL: In-memory tracking for OAuth codes (use Redis in production)
processed_oauth_codes: Dict[str, float] = {}
processing_codes: Set[str] = set()

def cleanup_old_codes():
    """Remove codes older than 5 minutes"""
    current_time = time.time()
    expired_codes = [
        code for code, timestamp in processed_oauth_codes.items() 
        if current_time - timestamp > 300  # 5 minutes
    ]
    for code in expired_codes:
        processed_oauth_codes.pop(code, None)
        processing_codes.discard(code)

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
    """Handle GitHub OAuth callback with deduplication"""
    
    # Clean up old codes periodically
    cleanup_old_codes()
    
    oauth_code = auth_request.code
    
    # Check if this code was already processed
    if oauth_code in processed_oauth_codes:
        logger.warning(f"OAuth code already processed: {oauth_code[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth authorization code has already been used"
        )
    
    # Check if this code is currently being processed
    if oauth_code in processing_codes:
        logger.warning(f"OAuth code currently being processed: {oauth_code[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="OAuth authorization code is currently being processed"
        )
    
    # Mark code as being processed
    processing_codes.add(oauth_code)
    
    try:
        logger.info(f"Processing GitHub OAuth callback for code: {oauth_code[:10]}...")
        
        auth_service = AuthService(db)
        
        result = await auth_service.authenticate_github(oauth_code)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to authenticate with GitHub"
            )
        
        # Mark code as successfully processed
        processed_oauth_codes[oauth_code] = time.time()
        
        logger.info(f"GitHub authentication successful for code: {oauth_code[:10]}...")
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in GitHub callback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )
    finally:
        # Always remove from processing set
        processing_codes.discard(oauth_code)

@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_active_user)
):
    """Refresh access token"""
    try:
        from app.core.security import create_access_token
        from datetime import timedelta
        from app.core.settings import settings
        
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
        "bitbucket_username": current_user.bitbucket_username,
        "google_email": current_user.google_email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
    }