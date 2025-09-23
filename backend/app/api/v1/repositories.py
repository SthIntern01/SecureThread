from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Union
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.services.github_service import GitHubService
from app.models.vulnerability import Scan
from pydantic import BaseModel
import logging
from datetime import datetime

router = APIRouter()

logger = logging.getLogger(__name__)


class ImportRepositoryRequest(BaseModel):
    repository_ids: List[Union[int, str]]  # Support both int (GitHub) and str (Bitbucket)


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
            Repository.owner_id == current_user.id,
            Repository.github_id.isnot(None)
        ).all()
    )
    
    # Mark which repositories are already imported
    for repo in repos:
        repo["is_imported"] = repo["id"] in imported_repo_ids
    
    return {"repositories": repos}


@router.get("/bitbucket/available")
async def get_available_bitbucket_repositories(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's Bitbucket repositories that can be imported"""
    if not current_user.bitbucket_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bitbucket access token not found"
        )
    
    from app.services.bitbucket_services import BitbucketService
    bitbucket_service = BitbucketService()
    repos = bitbucket_service.get_user_repositories(current_user.bitbucket_access_token)
    
    logger.error(f"DEBUG: Found {len(repos)} repositories from Bitbucket API")
    for repo in repos[:3]:  # Log first 3 repos
        logger.error(f"DEBUG: Repo: {repo.get('name')} - ID: {repo.get('id')}")
    
    # Get already imported repositories using bitbucket_id
    imported_repo_ids = set(
        repo.bitbucket_id for repo in db.query(Repository).filter(
            Repository.owner_id == current_user.id,
            Repository.bitbucket_id.isnot(None)
        ).all()
    )
    
    logger.error(f"DEBUG: Already imported repo IDs: {imported_repo_ids}")
    
    # Mark which repositories are already imported
    for repo in repos:
        repo["is_imported"] = repo["id"] in imported_repo_ids
        logger.error(f"DEBUG: {repo['name']} - is_imported: {repo['is_imported']}")
    
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
    
    # Convert to integers for GitHub
    repo_ids = [int(rid) for rid in import_request.repository_ids]
    
    # Filter repositories to import
    repos_to_import = [
        repo for repo in all_repos 
        if repo["id"] in repo_ids
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


@router.post("/bitbucket/import")
async def import_bitbucket_repositories(
    import_request: ImportRepositoryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import selected Bitbucket repositories for scanning"""
    if not current_user.bitbucket_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bitbucket access token not found"
        )
    
    from app.services.bitbucket_services import BitbucketService
    bitbucket_service = BitbucketService()
    all_repos = bitbucket_service.get_user_repositories(current_user.bitbucket_access_token)
    
    # Keep as strings for Bitbucket (UUID format)
    repo_ids = [str(rid) for rid in import_request.repository_ids]
    
    # Filter repositories to import
    repos_to_import = [
        repo for repo in all_repos 
        if repo["id"] in repo_ids
    ]
    
    imported_repos = []
    
    for repo_data in repos_to_import:
        # Check if repository already exists
        existing_repo = db.query(Repository).filter(
            Repository.bitbucket_id == repo_data["id"],
            Repository.owner_id == current_user.id
        ).first()
        
        if not existing_repo:
            new_repo = Repository(
                bitbucket_id=repo_data["id"],
                name=repo_data["name"],
                full_name=repo_data["full_name"],
                description=repo_data.get("description"),
                html_url=repo_data["html_url"],
                clone_url=repo_data["clone_url"],
                default_branch=repo_data["default_branch"],
                language=repo_data.get("language"),
                is_private=repo_data["is_private"],
                is_fork=repo_data.get("is_fork", False),
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
    """Get user's imported repositories with latest scan information"""
    repositories = db.query(Repository).filter(
        Repository.owner_id == current_user.id
    ).all()
    
    repo_list = []
    for repo in repositories:
        # Get latest scan for this repository
        latest_scan = db.query(Scan).filter(
            Scan.repository_id == repo.id
        ).order_by(Scan.started_at.desc()).first()
        
        repo_data = {
            "id": repo.id,
            "github_id": repo.github_id,
            "bitbucket_id": repo.bitbucket_id,
            "gitlab_id": repo.gitlab_id,
            "name": repo.name,
            "full_name": repo.full_name,
            "description": repo.description,
            "html_url": repo.html_url,
            "clone_url": repo.clone_url,
            "default_branch": repo.default_branch,
            "language": repo.language,
            "is_private": repo.is_private,
            "is_fork": repo.is_fork,
            "source": repo.source_type,  # Use the property from your model
            "created_at": repo.created_at.isoformat() if repo.created_at else None,
            "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
            # Add scan information
            "latest_scan": None,
            "vulnerabilities": None,
            "security_score": None,
            "code_coverage": None
        }

        if latest_scan:
            repo_data.update({
                "latest_scan": {
                    "id": latest_scan.id,
                    "status": latest_scan.status,
                    "started_at": latest_scan.started_at.isoformat() if latest_scan.started_at else None,
                    "completed_at": latest_scan.completed_at.isoformat() if latest_scan.completed_at else None,
                    "scan_duration": latest_scan.scan_duration
                },
                "vulnerabilities": {
                    "total": latest_scan.total_vulnerabilities,
                    "critical": latest_scan.critical_count,
                    "high": latest_scan.high_count,
                    "medium": latest_scan.medium_count,
                    "low": latest_scan.low_count
                },
                "security_score": latest_scan.security_score,
                "code_coverage": latest_scan.code_coverage
            })
        
        repo_list.append(repo_data)
    
    return {"repositories": repo_list}


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
    logger.info(f"Fetching content for repo {repo_id}, path: '{path}'")
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    try:
        if repository.source_type == "github":
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
        elif repository.source_type == "bitbucket":
            logger.info("Processing Bitbucket repository")
            if not current_user.bitbucket_access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bitbucket access token not found"
                )
            logger.info(f"Bitbucket token found: {current_user.bitbucket_access_token[:10]}...")

            from app.services.bitbucket_services import BitbucketService
            bitbucket_service = BitbucketService()

        # Extract workspace and repo_slug from full_name
            try:
                workspace, repo_slug = repository.full_name.split("/", 1)
                logger.info(f"Parsed workspace: {workspace}, repo_slug: {repo_slug}")
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid repository full_name format for Bitbucket"
                )
            
            # You'll need to implement this method in BitbucketService
            content = bitbucket_service.get_repository_content(
                current_user.bitbucket_access_token,
                workspace,
                repo_slug,
                path
            )
            logger.info(f"Bitbucket service returned: {content}")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Repository source '{repository.source_type}' not supported"
            )
        
        if content is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository content not found"
            )
        
        return {"content": content}
    
    except Exception as e:
        logger.error(f"Error fetching repository content for repo {repo_id}: {e}")
        logger.error(f"Repository source: {repository.source_type if 'repository' in locals() else 'unknown'}")
        logger.error(f"Path: {path}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch repository content: {str(e)}"
        )



@router.post("/{repo_id}/sync")
async def sync_repository(
    repo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Sync repository information with the appropriate service"""
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    try:
        if repository.source_type == "github":
            if not current_user.github_access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="GitHub access token not found"
                )
            
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
                
        elif repository.source_type == "bitbucket":
            if not current_user.bitbucket_access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bitbucket access token not found"
                )
            
            from app.services.bitbucket_services import BitbucketService
            bitbucket_service = BitbucketService()
            # Extract workspace and repo_slug from full_name (workspace/repo)
            workspace, repo_slug = repository.full_name.split("/", 1)
            repo_info = bitbucket_service.get_repository_details(
                current_user.bitbucket_access_token,
                workspace,
                repo_slug
            )
            
            if not repo_info:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Repository not found on Bitbucket"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Repository source '{repository.source_type}' not supported for sync"
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
    
    try:
        if repository.source_type == "github":
            if not current_user.github_access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="GitHub access token not found"
                )
            
            github_service = GitHubService()
            file_content = github_service.get_file_content(
                current_user.github_access_token,
                repository.full_name,
                file_path
            )
            
        elif repository.source_type == "bitbucket":
            if not current_user.bitbucket_access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bitbucket access token not found"
                )
            
            from app.services.bitbucket_services import BitbucketService
            bitbucket_service = BitbucketService()
            workspace, repo_slug = repository.full_name.split("/", 1)
            file_content = bitbucket_service.get_file_content(
                current_user.bitbucket_access_token,
                workspace,
                repo_slug,
                file_path,
                repository.default_branch
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Repository source '{repository.source_type}' not supported"
            )
        
        if file_content is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return {"content": file_content}
    
    except Exception as e:
        logger.error(f"Error fetching file content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch file content"
        )