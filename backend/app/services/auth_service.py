from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import create_access_token
from app.services.github_service import GitHubService
from datetime import timedelta
from app.config.settings import settings


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.github_service = GitHubService()

    async def authenticate_github(self, code: str) -> Optional[dict]:
        """Authenticate user with GitHub OAuth"""
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

        # Check if user exists
        user = self.db.query(User).filter(User.github_id == github_user["id"]).first()
        
        if not user:
            # Create new user
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
            # Update existing user
            user.github_access_token = access_token
            user.full_name = github_user.get("name", user.full_name)
            user.avatar_url = github_user.get("avatar_url", user.avatar_url)
            self.db.commit()
            self.db.refresh(user)

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
                "full_name": user.full_name,
                "avatar_url": user.avatar_url,
            }
        }

    def create_user(self, user_create: UserCreate) -> User:
        """Create new user"""
        db_user = User(
            email=user_create.email,
            github_id=user_create.github_id,
            github_username=user_create.github_username,
            full_name=user_create.full_name,
            avatar_url=user_create.avatar_url,
            github_access_token=user_create.github_access_token,
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_github_id(self, github_id: int) -> Optional[User]:
        """Get user by GitHub ID"""
        return self.db.query(User).filter(User.github_id == github_id).first()