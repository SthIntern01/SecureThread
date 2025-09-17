from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import create_access_token
from app.services.github_service import GitHubService
from app.services.gitlab_services import GitLabService  
from app.services.google_service import GoogleService  # ADD THIS IMPORT
from app.services.bitbucket_services import BitbucketService
from datetime import timedelta
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.github_service = GitHubService()
        self.gitlab_service = GitLabService()
        self.google_service = GoogleService()  # ADD THIS LINE

    async def authenticate_github(self, code: str) -> Optional[dict]:
        """Authenticate user with GitHub OAuth and link accounts if email exists."""
        # Exchange code for access token
        access_token = await self.github_service.exchange_code_for_token(code)
        if not access_token:
            return None

        # Get user info from GitHub
        github_user = await self.github_service.get_user_info(access_token)
        if not github_user:
            return None

        # Get user email
        email = await self.github_service.get_user_email(access_token)
        if not email:
            return None

        # --- MODIFIED LOGIC TO PREVENT DUPLICATE USERS ---

        # 1. First, try to find the user by their unique GitHub ID.
        user = self.db.query(User).filter(User.github_id == github_user["id"]).first()
        
        # 2. If no user is found by GitHub ID, check if a user exists with that email.
        if not user:
            user = self.db.query(User).filter(User.email == email).first()

        # 3. Now, decide whether to create a new user or update the existing one.
        if not user:
            # If no user was found by ID or email, create a new one.
            user_create = UserCreate(
                email=email,
                github_id=github_user["id"],
                github_username=github_user["login"],
                full_name=github_user.get("name"),
                avatar_url=github_user.get("avatar_url"),
                github_access_token=access_token
            )
            user = self.create_user(user_create)
        else:
            # If a user was found (by either ID or email), update their record
            # with the new GitHub information to link the accounts.
            user.github_id = github_user["id"]
            user.github_username = github_user["login"]
            user.github_access_token = access_token
            if github_user.get("name"):
                 user.full_name = github_user.get("name")
            if github_user.get("avatar_url"):
                user.avatar_url = github_user.get("avatar_url")
            self.db.commit()
            self.db.refresh(user)
            
        # --- END OF MODIFIED LOGIC ---

        # Create JWT token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )

        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "github_username": user.github_username,
                "gitlab_username": user.gitlab_username,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url,
            }
        }

    async def authenticate_gitlab(self, code: str) -> Optional[dict]:
        """Authenticate user with GitLab OAuth and link accounts if email exists."""
        try:
            # Exchange code for access token
            access_token = await self.gitlab_service.exchange_code_for_token(code)
            if not access_token:
                logger.error("Failed to get access token from GitLab")
                return None
            
            # Get user info from GitLab
            gitlab_user = await self.gitlab_service.get_user_info(access_token)
            if not gitlab_user:
                logger.error("Failed to get user info from GitLab")
                return None
            
            email = gitlab_user.get("email")
            if not email:
                logger.error("No email found in GitLab user info")
                return None
            
            # --- MODIFIED LOGIC TO PREVENT DUPLICATE USERS ---
            
            # 1. First, try to find the user by their unique GitLab ID.
            user = self.db.query(User).filter(User.gitlab_id == str(gitlab_user["id"])).first()
            
            # 2. If no user is found by GitLab ID, check if a user exists with that email.
            if not user:
                user = self.db.query(User).filter(User.email == email).first()
            
            # 3. Now, decide whether to create a new user or update the existing one.
            if not user:
                # If no user was found, create a new one.
                user_create = UserCreate(
                    email=email,
                    gitlab_id=str(gitlab_user["id"]),
                    gitlab_username=gitlab_user.get("username"),
                    full_name=gitlab_user.get("name"),
                    avatar_url=gitlab_user.get("avatar_url"),
                    gitlab_access_token=access_token
                )
                user = self.create_user(user_create)
            else:
                # If a user was found, update their record with GitLab info.
                user.gitlab_id = str(gitlab_user["id"])
                user.gitlab_username = gitlab_user.get("username")
                user.gitlab_access_token = access_token
                if gitlab_user.get("name"):
                    user.full_name = gitlab_user.get("name")
                if gitlab_user.get("avatar_url"):
                    user.avatar_url = gitlab_user.get("avatar_url")
                self.db.commit()
                self.db.refresh(user)
            
            # --- END OF MODIFIED LOGIC ---
            
            # Create JWT token
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            jwt_token = create_access_token(
                data={"sub": str(user.id)}, expires_delta=access_token_expires
            )
            
            return {
                "access_token": jwt_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "github_username": user.github_username,
                    "gitlab_username": user.gitlab_username,
                    "full_name": user.full_name,
                    "avatar_url": user.avatar_url,
                }
            }
            
        except Exception as e:
            logger.error(f"Error in authenticate_gitlab: {str(e)}")
            return None

    # ADD THIS NEW METHOD FOR GOOGLE AUTHENTICATION
    async def authenticate_google(self, code: str) -> Optional[dict]:
        """Authenticate user with Google OAuth and link accounts if email exists."""
        try:
            # Exchange code for tokens
            token_data = await self.google_service.exchange_code_for_token(code)
            if not token_data or not token_data.get("access_token"):
                logger.error("Failed to get access token from Google")
                return None
            
            access_token = token_data["access_token"]
            refresh_token = token_data.get("refresh_token")
            
            # Get user info from Google
            google_user = await self.google_service.get_user_info(access_token)
            if not google_user:
                logger.error("Failed to get user info from Google")
                return None
            
            email = google_user.get("email")
            if not email:
                logger.error("No email found in Google user info")
                return None
            
            # --- MODIFIED LOGIC TO PREVENT DUPLICATE USERS ---
            
            # 1. First, try to find the user by their unique Google ID.
            user = self.db.query(User).filter(User.google_id == str(google_user["id"])).first()
            
            # 2. If no user is found by Google ID, check if a user exists with that email.
            if not user:
                user = self.db.query(User).filter(User.email == email).first()
            
            # 3. Now, decide whether to create a new user or update the existing one.
            if not user:
                # If no user was found, create a new one.
                user_create = UserCreate(
                    email=email,
                    google_id=str(google_user["id"]),
                    google_email=email,
                    full_name=google_user.get("name"),
                    avatar_url=google_user.get("picture"),
                    google_access_token=access_token,
                    google_refresh_token=refresh_token
                )
                user = self.create_user(user_create)
            else:
                # If a user was found, update their record with Google info.
                user.google_id = str(google_user["id"])
                user.google_email = email
                user.google_access_token = access_token
                user.google_refresh_token = refresh_token
                if google_user.get("name"):
                    user.full_name = google_user.get("name")
                if google_user.get("picture"):
                    user.avatar_url = google_user.get("picture")
                self.db.commit()
                self.db.refresh(user)
            
            # --- END OF MODIFIED LOGIC ---
            
            # Create JWT token
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            jwt_token = create_access_token(
                data={"sub": str(user.id)}, expires_delta=access_token_expires
            )
            
            return {
                "access_token": jwt_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "github_username": user.github_username,
                    "gitlab_username": user.gitlab_username,
                    "full_name": user.full_name,
                    "avatar_url": user.avatar_url,
                }
            }
            
        except Exception as e:
            logger.error(f"Error in authenticate_google: {str(e)}")
            return None
        
    async def authenticate_bitbucket(self, code: str) -> Optional[dict]:
        """Authenticate user with Bitbucket OAuth and link accounts if email exists."""
        try:
            bitbucket_service = BitbucketService()
            
            # Exchange code for access token
            access_token = await bitbucket_service.exchange_code_for_token(code)
            if not access_token:
                logger.error("Failed to exchange code for token")
                return None
            
            # Get user info from Bitbucket
            bitbucket_user = await bitbucket_service.get_user_info(access_token)
            if not bitbucket_user:
                logger.error("Failed to get user info from Bitbucket")
                return None
            
            # Get email (fallback if no email available)
            email = bitbucket_user.get("email")
            
            # --- MODIFIED LOGIC TO PREVENT DUPLICATE USERS (like other methods) ---
            
            # 1. First, try to find the user by their unique Bitbucket ID.
            user = self.db.query(User).filter(User.bitbucket_user_id == bitbucket_user.get("uuid")).first()
            
            # 2. If no user is found by Bitbucket ID, check if a user exists with that email.
            if not user and email:
                user = self.db.query(User).filter(User.email == email).first()
            
            # 3. Now, decide whether to create a new user or update the existing one.
            if not user:
                # If no user was found, create a new one.
                user_create = UserCreate(
                    email=email,
                    full_name=bitbucket_user.get("display_name"),
                    avatar_url=bitbucket_user.get("links", {}).get("avatar", {}).get("href"),
                    bitbucket_access_token=access_token,
                    bitbucket_username=bitbucket_user.get("username"),
                    bitbucket_user_id=bitbucket_user.get("uuid")
                )
                user = self.create_user(user_create)
            else:
                # If a user was found, update their record with Bitbucket info.
                user.bitbucket_access_token = access_token
                user.bitbucket_username = bitbucket_user.get("username")
                user.bitbucket_user_id = bitbucket_user.get("uuid")
                if bitbucket_user.get("display_name"):
                    user.full_name = bitbucket_user.get("display_name")
                if bitbucket_user.get("links", {}).get("avatar", {}).get("href"):
                    user.avatar_url = bitbucket_user.get("links", {}).get("avatar", {}).get("href")
                self.db.commit()
                self.db.refresh(user)
            
            # --- END OF MODIFIED LOGIC ---
            
            # Create JWT token (FIXED: use same pattern as other methods)
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            jwt_token = create_access_token(
                data={"sub": str(user.id)}, expires_delta=access_token_expires
            )
            
            return {
                "access_token": jwt_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "github_username": user.github_username,
                    "gitlab_username": user.gitlab_username,
                    "bitbucket_username": user.bitbucket_username,
                    "full_name": user.full_name,
                    "avatar_url": user.avatar_url,
                }
            }
            
        except Exception as e:
            logger.error(f"Error in authenticate_bitbucket: {str(e)}")
            return None
    def create_user(self, user_create: UserCreate) -> User:
        """Create new user - updated to handle GitHub, GitLab, Google, and Bitbucket"""
        db_user = User(
            email=user_create.email,
            full_name=user_create.full_name,
            avatar_url=user_create.avatar_url,
        )
        
        # Add GitHub fields if present
        if user_create.github_id:
            db_user.github_id = user_create.github_id
            db_user.github_username = user_create.github_username
            db_user.github_access_token = user_create.github_access_token
        
        # Add GitLab fields if present
        if user_create.gitlab_id:
            db_user.gitlab_id = str(user_create.gitlab_id)
            db_user.gitlab_username = user_create.gitlab_username
            db_user.gitlab_access_token = user_create.gitlab_access_token
        
        # Add Google fields if present
        if user_create.google_id:
            db_user.google_id = str(user_create.google_id)
            db_user.google_email = user_create.google_email
            db_user.google_access_token = user_create.google_access_token
            db_user.google_refresh_token = user_create.google_refresh_token
        
        # Add Bitbucket fields if present
        if user_create.bitbucket_user_id:
            db_user.bitbucket_user_id = user_create.bitbucket_user_id
            db_user.bitbucket_username = user_create.bitbucket_username
            db_user.bitbucket_access_token = user_create.bitbucket_access_token
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def create_user_with_gitlab(self, user_create: UserCreate) -> User:
        """Create new user from GitLab - using the main create_user method"""
        return self.create_user(user_create)

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_github_id(self, github_id: int) -> Optional[User]:
        """Get user by GitHub ID"""
        return self.db.query(User).filter(User.github_id == github_id).first()
    
    def get_user_by_gitlab_id(self, gitlab_id: int) -> Optional[User]:
        """Get user by GitLab ID"""
        return self.db.query(User).filter(User.gitlab_id == str(gitlab_id)).first()

    def get_user_by_google_id(self, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        return self.db.query(User).filter(User.google_id == str(google_id)).first()
    
    def get_user_by_bitbucket_id(self, bitbucket_user_id: str) -> Optional[User]:
        """Get user by Bitbucket user ID"""
        return self.db.query(User).filter(User.bitbucket_user_id == bitbucket_user_id).first()