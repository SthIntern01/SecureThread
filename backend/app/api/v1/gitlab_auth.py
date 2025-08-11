from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import logging

# Import dependencies with proper error handling
from app.core.database import get_db
from app.services.gitlab_services import GitLabService
from app.services.auth_service import AuthService
from app.config.settings import settings
from app.api.deps import get_current_active_user
from app.schemas.auth import GitLabAuthRequest, GitLabAuthResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/gitlab/authorize")
async def gitlab_authorize():
    """Get GitLab OAuth authorization URL"""
    try:
        auth_url = GitLabService.get_authorization_url()
        return {"authorization_url": auth_url}
    except Exception as e:
        logger.error(f"Error in gitlab_authorize: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authorization URL"
        )

@router.post("/gitlab/callback", response_model=GitLabAuthResponse)
async def gitlab_callback(
    auth_request: GitLabAuthRequest,
    db: Session = Depends(get_db)
):
    """Handle GitLab OAuth callback."""
    try:
        auth_service = AuthService(db)
        
        # Authenticate using the code from the request body
        result = await auth_service.authenticate_gitlab(auth_request.code)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to authenticate with GitLab. The authorization code may be invalid or expired."
            )
        
        # Return the token and user data in a JSON response
        return GitLabAuthResponse(
            access_token=result["access_token"],
            token_type="bearer",
            user=result["user"]
        )
        
    except HTTPException:
        # Re-raise exceptions to let FastAPI handle them
        raise
    except Exception as e:
        logger.error(f"Unexpected error in gitlab_callback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during authentication."
        )
    
# ADD THIS NEW ENDPOINT FOR FRONTEND TO GET AUTH URL AS JSON
@router.get("/gitlab/auth-url")
async def get_gitlab_auth_url():
    """Get GitLab OAuth authorization URL as JSON (for frontend AJAX calls)"""
    try:
        logger.info("GitLab auth URL endpoint called")
        auth_url = GitLabService.get_authorization_url()
        logger.info(f"Generated auth URL: {auth_url}")
        
        return {
            "authorization_url": auth_url,
            "message": "GitLab authorization URL generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating GitLab auth URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {str(e)}"
        )

@router.get("/gitlab/test")
async def test_gitlab():
    """Test endpoint to verify GitLab integration"""
    try:
        gitlab_service = GitLabService()
        auth_url = gitlab_service.get_authorization_url()
        
        return {
            "message": "GitLab integration test successful",
            "gitlab_client_id": settings.GITLAB_CLIENT_ID[:10] + "...",
            "redirect_uri": settings.GITLAB_REDIRECT_URI,
            "test_auth_url": auth_url,
            "status": "ready"
        }
    except Exception as e:
        logger.error(f"GitLab test failed: {str(e)}")
        return {
            "message": "GitLab integration test failed",
            "error": str(e),
            "status": "error"
        }

@router.get("/gitlab/user-info")
async def get_gitlab_user_info(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's GitLab information"""
    if not current_user.gitlab_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has not connected GitLab account"
        )
    
    try:
        gitlab_service = GitLabService()
        
        # Validate token is still valid
        if not gitlab_service.validate_token(current_user.gitlab_access_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="GitLab token is invalid or expired"
            )
        
        # Get fresh user info
        user_info = await gitlab_service.get_user_info(current_user.gitlab_access_token)
        
        return {
            "gitlab_connected": True,
            "gitlab_username": user_info.get("username"),
            "gitlab_name": user_info.get("name"),
            "gitlab_email": user_info.get("email"),
            "gitlab_avatar_url": user_info.get("avatar_url")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting GitLab user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get GitLab user information"
        )