from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import logging

# Import dependencies with proper error handling
from app.core.database import get_db
from app.services.bitbucket_services import BitbucketService
from app.services.auth_service import AuthService
from app.config.settings import settings
from app.api.deps import get_current_active_user
from app.schemas.auth import BitbucketAuthRequest, BitbucketAuthResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/bitbucket/authorize")
async def bitbucket_authorize():
    """Get Bitbucket OAuth authorization URL"""
    try:
        auth_url = BitbucketService.get_authorization_url()
        return {"authorization_url": auth_url}
    except Exception as e:
        logger.error(f"Error in bitbucket_authorize: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authorization URL"
        )

@router.post("/bitbucket/callback", response_model=BitbucketAuthResponse)
async def bitbucket_callback(
    auth_request: BitbucketAuthRequest,
    db: Session = Depends(get_db)
):
    """Handle Bitbucket OAuth callback."""
    try:
        auth_service = AuthService(db)
        
        # Authenticate using the code from the request body
        result = await auth_service.authenticate_bitbucket(auth_request.code)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to authenticate with Bitbucket. The authorization code may be invalid or expired."
            )
        
        # Return the token and user data in a JSON response
        return BitbucketAuthResponse(
            access_token=result["access_token"],
            token_type="bearer",
            user=result["user"]
        )
        
    except HTTPException:
        # Re-raise exceptions to let FastAPI handle them
        raise
    except Exception as e:
        logger.error(f"Unexpected error in bitbucket_callback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during authentication."
        )

@router.get("/bitbucket/auth-url")
async def get_bitbucket_auth_url():
    """Get Bitbucket OAuth authorization URL as JSON (for frontend AJAX calls)"""
    try:
        logger.info("Bitbucket auth URL endpoint called")
        auth_url = BitbucketService.get_authorization_url()
        logger.info(f"Generated auth URL: {auth_url}")
        
        return {
            "authorization_url": auth_url,
            "message": "Bitbucket authorization URL generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating Bitbucket auth URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {str(e)}"
        )

@router.get("/bitbucket/test")
async def test_bitbucket():
    """Test endpoint to verify Bitbucket integration"""
    try:
        bitbucket_service = BitbucketService()
        auth_url = bitbucket_service.get_authorization_url()
        
        return {
            "message": "Bitbucket integration test successful",
            "bitbucket_client_id": settings.BITBUCKET_CLIENT_ID[:10] + "...",
            "redirect_uri": settings.BITBUCKET_REDIRECT_URI,
            "test_auth_url": auth_url,
            "status": "ready"
        }
    except Exception as e:
        logger.error(f"Bitbucket test failed: {str(e)}")
        return {
            "message": "Bitbucket integration test failed",
            "error": str(e),
            "status": "error"
        }

@router.get("/bitbucket/user-info")
async def get_bitbucket_user_info(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's Bitbucket information"""
    if not current_user.bitbucket_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has not connected Bitbucket account"
        )
    
    try:
        bitbucket_service = BitbucketService()
        
        # Validate token is still valid
        if not bitbucket_service.validate_token(current_user.bitbucket_access_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bitbucket token is invalid or expired"
            )
        
        # Get fresh user info
        user_info = await bitbucket_service.get_user_info(current_user.bitbucket_access_token)
        
        return {
            "bitbucket_connected": True,
            "bitbucket_username": user_info.get("username"),
            "bitbucket_display_name": user_info.get("display_name"),
            "bitbucket_email": user_info.get("email"),
            "bitbucket_avatar_url": user_info.get("links", {}).get("avatar", {}).get("href")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Bitbucket user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get Bitbucket user information"
        )

@router.get("/bitbucket/repositories")
async def get_bitbucket_repositories(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's Bitbucket repositories"""
    if not current_user.bitbucket_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has not connected Bitbucket account"
        )
    
    try:
        bitbucket_service = BitbucketService()
        
        # Validate token is still valid
        if not bitbucket_service.validate_token(current_user.bitbucket_access_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bitbucket token is invalid or expired"
            )
        
        # Get repositories
        repositories = bitbucket_service.get_user_repositories(current_user.bitbucket_access_token)
        
        return {
            "repositories": repositories,
            "count": len(repositories)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Bitbucket repositories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get Bitbucket repositories"
        )