from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.services.google_service import GoogleService
from app.services.auth_service import AuthService
from app.config.settings import settings
from app.api.deps import get_current_active_user
from app.schemas.auth import GoogleAuthRequest, GoogleAuthResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/google/authorize")
async def google_authorize():
    """Get Google OAuth authorization URL"""
    try:
        auth_url = GoogleService.get_authorization_url()
        return {"authorization_url": auth_url}
    except Exception as e:
        logger.error(f"Error in google_authorize: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authorization URL"
        )

@router.post("/google/callback", response_model=GoogleAuthResponse)
async def google_callback(
    auth_request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback."""
    try:
        auth_service = AuthService(db)
        
        # Authenticate using the code from the request body
        result = await auth_service.authenticate_google(auth_request.code)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to authenticate with Google. The authorization code may be invalid or expired."
            )
        
        # Return the token and user data in a JSON response
        return GoogleAuthResponse(
            access_token=result["access_token"],
            token_type="bearer",
            user=result["user"]
        )
        
    except HTTPException:
        # Re-raise exceptions to let FastAPI handle them
        raise
    except Exception as e:
        logger.error(f"Unexpected error in google_callback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during authentication."
        )

@router.get("/google/auth-url")
async def get_google_auth_url():
    """Get Google OAuth authorization URL as JSON (for frontend AJAX calls)"""
    try:
        logger.info("Google auth URL endpoint called")
        auth_url = GoogleService.get_authorization_url()
        logger.info(f"Generated auth URL: {auth_url}")
        
        return {
            "authorization_url": auth_url,
            "message": "Google authorization URL generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating Google auth URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {str(e)}"
        )

@router.get("/google/test")
async def test_google():
    """Test endpoint to verify Google integration"""
    try:
        google_service = GoogleService()
        auth_url = google_service.get_authorization_url()
        
        return {
            "message": "Google integration test successful",
            "google_client_id": settings.GOOGLE_CLIENT_ID[:10] + "..." if settings.GOOGLE_CLIENT_ID else "Not set",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "test_auth_url": auth_url,
            "status": "ready"
        }
    except Exception as e:
        logger.error(f"Google test failed: {str(e)}")
        return {
            "message": "Google integration test failed",
            "error": str(e),
            "status": "error"
        }

@router.get("/google/user-info")
async def get_google_user_info(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's Google information"""
    if not current_user.google_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has not connected Google account"
        )
    
    try:
        google_service = GoogleService()
        
        # Validate token is still valid
        if not google_service.validate_token(current_user.google_access_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token is invalid or expired"
            )
        
        # Get fresh user info
        user_info = await google_service.get_user_info(current_user.google_access_token)
        
        return {
            "google_connected": True,
            "google_email": user_info.get("email"),
            "google_name": user_info.get("name"),
            "google_picture": user_info.get("picture")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Google user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get Google user information"
        )