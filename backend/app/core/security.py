from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.core.settings import settings
from app.core.database import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str):
    """Verify password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str):
    """Hash password"""
    return pwd_context.hash(password)


async def get_current_user(
    token: Optional[str] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user from JWT token - returns None if no token or invalid token
    This allows endpoints to work with or without authentication
    """
    if not token:
        return None
    
    try:
        # Extract token from Bearer format
        if hasattr(token, 'credentials'):
            token_str = token.credentials
        else:
            token_str = str(token)
        
        # Decode JWT token using your existing SECRET_KEY and ALGORITHM
        payload = jwt.decode(
            token_str, 
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        
        # Get user ID from token
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
            
    except JWTError:
        return None
    
    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require authentication - raises exception if no valid user
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user