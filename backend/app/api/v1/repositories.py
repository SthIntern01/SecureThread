from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.services.github_service import GitHubService

router = APIRouter()


@router.get("/")
async def get_user_repositories(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's GitHub repositories"""
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub access token not found"
        )
    
    github_service = GitHubService()
    repos = github_service.get_user_repositories(current_user.github_access_token)
    
    # Update local database with repositories
    for repo_data in repos:
        existing_repo = db.query(Repository).filter(
            Repository.github_id == repo_data["id"]
        ).first()
        
        if not existing_repo:
            new_repo = Repository(
                github_id=repo_data["id"],
                name=repo_data["name"],
                full_name=repo_data["full_name"],
                description=repo_data["description"],
                html_url=repo_data["html_url"],
                clone_url=repo_data["clone_url"],
                default_branch=repo_data["default_branch"],
                language=repo_data["language"],
                is_private=repo_data["private"],
                is_fork=repo_data["fork"],
                owner_id=current_user.id
            )
            db.add(new_repo)
    
    db.commit()
    
    return {"repositories": repos}


@router.get("/{repo_id}")
async def get_repository(
    repo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific repository details"""
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    return repository


@router.get("/{repo_id}/content")
async def get_repository_content(
    repo_id: int,
    path: str = "",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get repository content for scanning"""
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub access token not found"
        )
    
    github_service = GitHubService()
    content = github_service.get_repository_content(
        current_user.github_access_token,
        repository.full_name,
        path
    )
    
    if content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository content not found"
        )
    
    return {"content": content}