from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.services.github_service import GitHubService
from pydantic import BaseModel
import logging

router = APIRouter()

logger = logging.getLogger(__name__)



class ImportRepositoryRequest(BaseModel):
    repository_ids: List[int]


class RepositoryResponse(BaseModel):
    id: int
    github_id: int
    name: str
    full_name: str
    description: str
    html_url: str
    clone_url: str
    default_branch: str
    language: str
    is_private: bool
    is_fork: bool
    is_imported: bool = False

    class Config:
        from_attributes = True


@router.get("/github/available")
async def get_available_github_repositories(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's GitHub repositories that can be imported"""
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub access token not found"
        )
    
    github_service = GitHubService()
    repos = github_service.get_user_repositories(current_user.github_access_token)
    
    # Get already imported repositories
    imported_repo_ids = set(
        repo.github_id for repo in db.query(Repository).filter(
            Repository.owner_id == current_user.id
        ).all()
    )
    
    # Mark which repositories are already imported
    for repo in repos:
        repo["is_imported"] = repo["id"] in imported_repo_ids
    
    return {"repositories": repos}


@router.post("/import")
async def import_repositories(
    import_request: ImportRepositoryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import selected GitHub repositories for scanning"""
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub access token not found"
        )
    
    github_service = GitHubService()
    all_repos = github_service.get_user_repositories(current_user.github_access_token)
    
    # Filter repositories to import
    repos_to_import = [
        repo for repo in all_repos 
        if repo["id"] in import_request.repository_ids
    ]
    
    imported_repos = []
    
    for repo_data in repos_to_import:
        # Check if repository already exists
        existing_repo = db.query(Repository).filter(
            Repository.github_id == repo_data["id"],
            Repository.owner_id == current_user.id
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
            imported_repos.append(new_repo)
    
    db.commit()
    
    return {
        "message": f"Successfully imported {len(imported_repos)} repositories",
        "imported_repositories": [
            {
                "id": repo.id,
                "name": repo.name,
                "full_name": repo.full_name
            }
            for repo in imported_repos
        ]
    }


@router.get("/")
async def get_user_repositories(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's imported repositories"""
    repositories = db.query(Repository).filter(
        Repository.owner_id == current_user.id
    ).all()
    
    return {"repositories": repositories}


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


@router.delete("/{repo_id}")
async def remove_repository(
    repo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove repository from scanning"""
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    db.delete(repository)
    db.commit()
    
    return {"message": "Repository removed successfully"}


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
    
    try:
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
    
    except Exception as e:
        logger.error(f"Error fetching repository content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch repository content"
        )
        
@router.post("/{repo_id}/sync")
async def sync_repository(
    repo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Sync repository information with GitHub"""
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
    
    try:
        github_service = GitHubService()
        repo_info = github_service.get_repository_info(
            current_user.github_access_token,
            repository.full_name
        )
        
        if not repo_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found on GitHub"
            )
        
        # Update repository information
        repository.description = repo_info.get("description", repository.description)
        repository.default_branch = repo_info.get("default_branch", repository.default_branch)
        repository.language = repo_info.get("language", repository.language)
        
        db.commit()
        db.refresh(repository)
        
        return {
            "message": "Repository synced successfully",
            "repository": {
                "id": repository.id,
                "name": repository.name,
                "full_name": repository.full_name,
                "description": repository.description,
                "default_branch": repository.default_branch,
                "language": repository.language,
                "updated_at": repository.updated_at
            }
        }
    
    except Exception as e:
        logger.error(f"Error syncing repository: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync repository"
        )
        
@router.get("/{repo_id}/file")
async def get_file_content(
    repo_id: int,
    file_path: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific file content from repository"""
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
    
    try:
        github_service = GitHubService()
        file_content = github_service.get_file_content(
            current_user.github_access_token,
            repository.full_name,
            file_path
        )
        
        if file_content is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return file_content
    
    except Exception as e:
        logger.error(f"Error fetching file content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch file content"
        )