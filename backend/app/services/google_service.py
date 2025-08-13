import httpx
import requests
from typing import Optional, Dict, Any
from app.config.settings import settings
import logging
from urllib.parse import urlencode

logger = logging.getLogger(__name__)

class GoogleService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        self.api_base_url = "https://www.googleapis.com"

    @classmethod
    def get_authorization_url(cls) -> str:
        """Get Google OAuth authorization URL"""
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
            "state": "securethread_google_auth"
        }
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        return auth_url

    async def exchange_code_for_token(self, code: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token and refresh token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri
                }
            )
            if response.status_code == 200:
                data = response.json()
                return {
                    "access_token": data.get("access_token"),
                    "refresh_token": data.get("refresh_token"),
                    "expires_in": data.get("expires_in")
                }
            else:
                logger.error(f"Failed to exchange code: {response.text}")
            return None

    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from Google"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base_url}/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code == 200:
                return response.json()
            logger.error(f"Failed to get user info: {response.text}")
            return None

    def validate_token(self, access_token: str) -> bool:
        """Validate if the Google token is valid"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(f"{self.api_base_url}/oauth2/v2/userinfo", headers=headers)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error validating token: {e}")
            return False

    async def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """Refresh access token using refresh token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token"
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
            logger.error(f"Failed to refresh token: {response.text}")
            return None