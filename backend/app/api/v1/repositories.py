# backend/app/api/v1/repositories.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Union, Optional
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.services.github_service import GitHubService
from app.models.vulnerability import Scan
from app.models.team_repository import TeamRepository
from pydantic import BaseModel
import logging
from datetime import datetime, timedelta

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
    
    # Get repositories already in the CURRENT workspace
    active_workspace_id = current_user.active_team_id
    
    if active_workspace_id:
        # Get repos in current workspace
        workspace_repo_ids = set(
            tr.repository.github_id for tr in db.query(TeamRepository).filter(
                TeamRepository.team_id == active_workspace_id
            ).join(Repository).filter(
                Repository.owner_id == current_user.id,
                Repository.github_id.isnot(None)
            ).all()
        )
    else:
        # Fallback: get all user's repositories
        workspace_repo_ids = set(
            repo.github_id for repo in db.query(Repository).filter(
                Repository.owner_id == current_user.id,
                Repository.github_id.isnot(None),
                Repository.is_active == True
            ).all()
        )
    
    # Mark which repositories are already imported in THIS workspace
    for repo in repos:
        repo["is_imported"] = repo["id"] in workspace_repo_ids
    
    return {"repositories": repos}


@router.get("/github/search")
async def search_github_repositories(
    query: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search for public GitHub repositories"""
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub access token not found"
        )
    
    github_service = GitHubService()
    repos = github_service.search_public_repositories(current_user.github_access_token, query)
    
    # Get repositories already in the CURRENT workspace
    active_workspace_id = current_user.active_team_id
    
    if active_workspace_id:
        # Get repos in current workspace
        workspace_repo_ids = set(
            tr.repository.github_id for tr in db.query(TeamRepository).filter(
                TeamRepository.team_id == active_workspace_id
            ).join(Repository).filter(
                Repository.owner_id == current_user.id,
                Repository.github_id.isnot(None)
            ).all()
        )
    else:
        # Fallback: get all user's repositories
        workspace_repo_ids = set(
            repo.github_id for repo in db.query(Repository).filter(
                Repository.owner_id == current_user.id,
                Repository.github_id.isnot(None),
                Repository.is_active == True
            ).all()
        )
    
    # Mark which repositories are already imported in THIS workspace
    for repo in repos:
        repo["is_imported"] = repo["id"] in workspace_repo_ids
    
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
    import_request: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import selected GitHub repositories"""
    try:
        repositories_data = import_request.get("repositories", [])
        
        if not repositories_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No repositories provided"
            )
        
        if not current_user.github_access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub access token not found"
            )
        
        imported_repos = []
        failed_repos = []
        
        # Process all repositories in a single transaction
        for repo_data in repositories_data:
            try:
                # ✅ FIX: Support both github_id and id fields
                repo_github_id = repo_data.get("github_id") or repo_data.get("id")
                
                if not repo_github_id:
                    logger.error(f"Repository {repo_data.get('name')} has no ID")
                    failed_repos.append({
                        "name": repo_data.get("name", "unknown"),
                        "error": "No repository ID provided"
                    })
                    continue
                
                # Check if already imported
                existing_repo = db.query(Repository).filter(
                    Repository.github_id == repo_github_id,
                    Repository.owner_id == current_user.id
                ).first()
                
                if existing_repo:
                    logger.info(f"Repository {repo_data['name']} already exists in database")
                    
                    # ✅ Check if it's in the current workspace
                    if current_user.active_team_id:
                        workspace_link = db.query(TeamRepository).filter(
                            TeamRepository.team_id == current_user.active_team_id,
                            TeamRepository.repository_id == existing_repo.id
                        ).first()
                        
                        if workspace_link:
                            # Already in workspace, skip
                            logger.info(f"Repository {repo_data['name']} already in workspace")
                            continue
                        else:
                            # ✅ Re-add to workspace
                            logger.info(f"Re-adding repository {repo_data['name']} to workspace {current_user.active_team_id}")
                            team_repo = TeamRepository(
                                team_id=current_user.active_team_id,
                                repository_id=existing_repo.id
                            )
                            db.add(team_repo)
                            
                            imported_repos.append({
                                "id": existing_repo.id,
                                "name": existing_repo.name,
                                "full_name": existing_repo.full_name
                            })
                            continue
                    else:
                        # No workspace, skip
                        logger.info(f"Repository {repo_data['name']} already imported (no workspace)")
                        continue
                
                # ✅ Create new repository with proper ID
                new_repo = Repository(
                    github_id=repo_github_id,  # ✅ Use the extracted ID
                    name=repo_data["name"],
                    full_name=repo_data["full_name"],
                    description=repo_data.get("description"),
                    html_url=repo_data["html_url"],
                    clone_url=repo_data["clone_url"],
                    default_branch=repo_data.get("default_branch", "main"),
                    language=repo_data.get("language"),
                    is_private=repo_data.get("is_private", False),
                    is_fork=repo_data.get("is_fork", False),
                    owner_id=current_user.id,
                )
                
                db.add(new_repo)
                db.flush()  # ✅ Flush to get the ID
                
                # ✅ Add to active workspace if exists
                if current_user.active_team_id:
                    team_repo = TeamRepository(
                        team_id=current_user.active_team_id,
                        repository_id=new_repo.id
                    )
                    db.add(team_repo)
                
                imported_repos.append({
                    "id": new_repo.id,
                    "name": new_repo.name,
                    "full_name": new_repo.full_name
                })
                
                logger.info(f"✅ Prepared repository for import: {new_repo.full_name}")
                
            except Exception as e:
                logger.error(f"❌ Error preparing repository {repo_data.get('name', 'unknown')}: {e}")
                failed_repos.append({
                    "name": repo_data.get("name", "unknown"),
                    "error": str(e)
                })
        
        # Commit all successful imports at once
        try:
            db.commit()
            logger.info(f"✅ Successfully committed {len(imported_repos)} repositories")
                
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Error committing imports: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save imported repositories: {str(e)}"
            )
        
        return {
            "message": f"Imported {len(imported_repos)} repositories",
            "imported": imported_repos,
            "failed": failed_repos
        }
        
    except Exception as e:
        logger.error(f"Error in import_github_repositories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


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
            db.flush()  # Get the ID
            
            # Add to active workspace if exists
            if current_user.active_team_id:
                team_repo = TeamRepository(
                    team_id=current_user.active_team_id,
                    repository_id=new_repo.id,
                    added_by=current_user.id
                )
                db.add(team_repo)
            
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
    repository_id: Optional[int] = None,
    days_filter: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's imported repositories with latest scan information and filtering - WORKSPACE SCOPED"""
    
    logger.info(f"🎯 REPO API CALLED - User: {current_user.id}, RepoID: {repository_id}")
    
    # Get active workspace
    active_workspace_id = current_user.active_team_id
    
    # Base query - user scoped
    query = db.query(Repository).filter(
        Repository.owner_id == current_user.id
    )
    
    # Add workspace filter
    if active_workspace_id:
        # Get repository IDs for this workspace
        workspace_repo_ids = db.query(TeamRepository.repository_id).filter(
            TeamRepository.team_id == active_workspace_id
        ).all()
        repo_ids = [r[0] for r in workspace_repo_ids]
        
        if not repo_ids:
            logger.info(f"📦 No repositories in workspace {active_workspace_id}")
            return {
                "repositories": [],
                "total_count": 0,
                "user_id": current_user.id,
                "workspace_id": active_workspace_id
            }
        
        # Filter by workspace repositories
        query = query.filter(Repository.id.in_(repo_ids))
        logger.info(f"📦 Filtering by workspace {active_workspace_id} with {len(repo_ids)} repos")
    
    # Apply repository filter if specified
    if repository_id:
        query = query.filter(Repository.id == repository_id)
        logger.info(f"🎯 FILTERING BY REPOSITORY ID: {repository_id}")
    
    repositories = query.all()
    logger.info(f"📊 REPOSITORIES FOUND: {len(repositories)}")
    
    repo_list = []
    for repo in repositories:
        # Get latest scan for this repository
        scan_query = db.query(Scan).filter(Scan.repository_id == repo.id)
        
        # Apply time filter to scans if specified
        if days_filter:
            cutoff_date = datetime.utcnow() - timedelta(days=days_filter)
            scan_query = scan_query.filter(Scan.started_at >= cutoff_date)
        
        latest_scan = scan_query.order_by(Scan.started_at.desc()).first()
        
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
            "source": repo.source_type,
            "user_id": current_user.id,
            "workspace_id": active_workspace_id,  # Add workspace info
            "created_at": repo.created_at.isoformat() if repo.created_at else None,
            "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
            "latest_scan": None,
            "vulnerabilities": None,
            "security_score": None,
            "code_coverage": None,
            "status": "pending"
        }

        if latest_scan:
            # Determine repository status based on scan
            if latest_scan.status == "running":
                repo_status = "scanning"
            elif latest_scan.status == "completed":
                repo_status = "completed"
            elif latest_scan.status == "failed":
                repo_status = "failed"
            else:
                repo_status = "active"

            repo_data.update({
                "latest_scan": {
                    "id": latest_scan.id,
                    "status": latest_scan.status,
                    "scan_type": latest_scan.scan_type or "standard",
                    "started_at": latest_scan.started_at.isoformat() if latest_scan.started_at else None,
                    "completed_at": latest_scan.completed_at.isoformat() if latest_scan.completed_at else None,
                    "scan_duration": latest_scan.scan_duration,
                    "total_vulnerabilities": latest_scan.total_vulnerabilities or 0,
                    "critical_count": latest_scan.critical_count or 0,
                    "high_count": latest_scan.high_count or 0,
                    "medium_count": latest_scan.medium_count or 0,
                    "low_count": latest_scan.low_count or 0,
                    "total_files_scanned": latest_scan.total_files_scanned or 0,
                    "repository_id": repo.id,
                    "user_id": current_user.id
                },
                "vulnerabilities": {
                    "total": latest_scan.total_vulnerabilities or 0,
                    "critical": latest_scan.critical_count or 0,
                    "high": latest_scan.high_count or 0,
                    "medium": latest_scan.medium_count or 0,
                    "low": latest_scan.low_count or 0
                },
                "security_score": latest_scan.security_score,
                "code_coverage": latest_scan.code_coverage,
                "status": repo_status
            })
            
            logger.info(f"📊 REPO {repo.name} - Latest scan vulnerabilities: {latest_scan.total_vulnerabilities}")
        else:
            repo_data["status"] = "active"
            logger.info(f"📊 REPO {repo.name} - No scans found")
        
        repo_list.append(repo_data)
    
    logger.info(f"🎯 REPO API RESULT - Total repos: {len(repo_list)}, Workspace: {active_workspace_id}")
    
    return {
        "repositories": repo_list,
        "total_count": len(repo_list),
        "user_id": current_user.id,
        "workspace_id": active_workspace_id  # Add workspace info
    }


@router.get("/{repo_id}")
async def get_repository(
    repo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific repository details - WORKSPACE SCOPED"""
    
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    # Check workspace access
    active_workspace_id = current_user.active_team_id
    if active_workspace_id:
        workspace_repo = db.query(TeamRepository).filter(
            TeamRepository.team_id == active_workspace_id,
            TeamRepository.repository_id == repo_id
        ).first()
        
        if not workspace_repo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Repository not in active workspace"
            )
    
    return repository


@router.delete("/{repo_id}")
async def remove_repository(
    repo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove repository from workspace - KEEPS repository data intact"""
    
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    # Check workspace access
    active_workspace_id = current_user.active_team_id
    if active_workspace_id:
        workspace_repo = db.query(TeamRepository).filter(
            TeamRepository.team_id == active_workspace_id,
            TeamRepository.repository_id == repo_id
        ).first()
        
        if not workspace_repo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Repository not in active workspace"
            )
        
        # Only remove from workspace, don't delete repository
        db.delete(workspace_repo)
        db.commit()
        
        logger.info(f"Repository {repo_id} removed from workspace {active_workspace_id}")
        return {"message": "Repository removed from workspace successfully"}
    
    # If no workspace (shouldn't happen), mark as inactive instead of deleting
    repository.is_active = False
    db.commit()
    
    logger.info(f"Repository {repo_id} marked as inactive")
    return {"message": "Repository removed successfully"}


@router.get("/{repo_id}/content")
async def get_repository_content(
    repo_id: int,
    path: str = "",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get repository content for scanning - WORKSPACE SCOPED"""
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
    
    # Check workspace access
    active_workspace_id = current_user.active_team_id
    if active_workspace_id:
        workspace_repo = db.query(TeamRepository).filter(
            TeamRepository.team_id == active_workspace_id,
            TeamRepository.repository_id == repo_id
        ).first()
        
        if not workspace_repo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Repository not in active workspace"
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
            except ValueError as e:
                logger.error(f"Failed to parse full_name '{repository.full_name}': {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid repository full_name format for Bitbucket: {repository.full_name}"
                )
            
            # Get repository content
            content = bitbucket_service.get_repository_content(
                current_user.bitbucket_access_token,
                workspace,
                repo_slug,
                path
            )
            
            if content is None:
                logger.error(f"Bitbucket service returned None for {workspace}/{repo_slug}, path: {path}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Repository content not found or branch doesn't exist"
                )
            
            logger.info(f"Bitbucket service returned {len(content)} items")
            
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
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching repository content for repo {repo_id}: {e}")
        logger.error(f"Repository source: {repository.source_type if repository else 'unknown'}")
        logger.error(f"Repository full_name: {repository.full_name if repository else 'unknown'}")
        logger.error(f"Path: {path}")
        logger.exception("Full traceback:")
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
    """Sync repository information with the appropriate service - WORKSPACE SCOPED"""
    
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    # Check workspace access
    active_workspace_id = current_user.active_team_id
    if active_workspace_id:
        workspace_repo = db.query(TeamRepository).filter(
            TeamRepository.team_id == active_workspace_id,
            TeamRepository.repository_id == repo_id
        ).first()
        
        if not workspace_repo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Repository not in active workspace"
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
    """Get specific file content from repository - WORKSPACE SCOPED"""
    
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    # Check workspace access
    active_workspace_id = current_user.active_team_id
    if active_workspace_id:
        workspace_repo = db.query(TeamRepository).filter(
            TeamRepository.team_id == active_workspace_id,
            TeamRepository.repository_id == repo_id
        ).first()
        
        if not workspace_repo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Repository not in active workspace"
            )
    
    try:
        if repository.source_type == "github": 
            if not current_user.github_access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="GitHub access token not found"
                )
            
            github_service = GitHubService()
            
            # ✅ Get RAW file content (not base64)
            file_content = github_service.get_file_content(
                current_user.github_access_token,
                repository.full_name,
                file_path
            )
            
            # ✅ Return as plain text, not base64
            return {
                "content": file_content,  # Already decoded string
                "encoding": "utf-8",
                "file_path": file_path
            }
            
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
            
            # ✅ Return as plain text
            return {
                "content": file_content,
                "encoding": "utf-8",
                "file_path": file_path
            }
        else: 
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Repository source '{repository.source_type}' not supported"
            )
        
    except Exception as e: 
        logger.error(f"Error fetching file content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch file content: {str(e)}"
        )
    
@router.get("/{repo_id}/vulnerabilities")
async def get_file_vulnerabilities(
    repo_id: int,
    file_path: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get vulnerabilities for a specific file"""
    from app.models.vulnerability import Vulnerability, Scan
    
    # Get repository
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    # Get latest scan
    latest_scan = db.query(Scan).filter(
        Scan.repository_id == repo_id,
        Scan.status == "completed"
    ).order_by(Scan.started_at.desc()).first()
    
    if not latest_scan:
        return []
    
    # Get vulnerabilities for this file
    vulnerabilities = db.query(Vulnerability).filter(
        Vulnerability.scan_id == latest_scan.id,
        Vulnerability.file_path == file_path
    ).all()
    
    return [
        {
            "id": v.id,
            "title": v.title,
            "description": v.description,
            "severity": v.severity,
            "line_number": v.line_number,
            "recommendation": v.recommendation,
            "fix_suggestion": v.ai_explanation if v.ai_explanation else None
        }
        for v in vulnerabilities
    ]

@router.post("/ai/fix-file")
async def get_ai_fix_for_file(
    request: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated fix for all vulnerabilities in a file"""
    from app.services.llm_service import LLMService
    
    file_path = request.get("file_path")
    content = request.get("content")
    vulnerabilities = request.get("vulnerabilities", [])
    
    if not file_path or not content: 
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_path and content are required"
        )
    
    try:
        llm_service = LLMService()
        
        # Build prompt for AI
        vuln_list = "\n".join([
            f"- Line {v['line']}: {v['title']} ({v['severity']})"
            for v in vulnerabilities
        ])
        
        prompt = f"""Fix all security vulnerabilities in this code file. 

File: {file_path}

Vulnerabilities to fix:
{vuln_list}

Original Code:

{content}

Please provide the COMPLETE fixed code with all vulnerabilities resolved. Return ONLY the code, no explanations."""
        
        fixed_code = llm_service.get_completion(prompt)
        
        return {
            "fixed_content": fixed_code,
            "file_path": file_path
        }
        
    except Exception as e: 
        logger.error(f"Error getting AI fix: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI fix: {str(e)}"
        )
    
@router.post("/{repo_id}/create-pr")
async def create_fix_pull_request(
    repo_id: int,
    request: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a pull request with vulnerability fixes"""
    
    # Get repository
    repository = db.query(Repository).filter(
        Repository.id == repo_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    file_path = request.get("file_path")
    new_content = request.get("new_content")
    vulnerability_ids = request.get("vulnerability_ids", [])
    
    if not file_path or not new_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_path and new_content are required"
        )
    
    try:
        if repository.source_type == "github": 
            if not current_user.github_access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="GitHub access token not found"
                )
            
            github_service = GitHubService()
            
            # Create a new branch
            branch_name = f"security-fix-{file_path.replace('/', '-')}-{int(datetime.utcnow().timestamp())}"
            
            # Create PR
            pr_url = github_service.create_fix_pull_request(
                current_user.github_access_token,
                repository.full_name,
                file_path,
                new_content,
                branch_name,
                f"Fix security vulnerabilities in {file_path}",
                f"This PR fixes {len(vulnerability_ids)} security vulnerabilities found in {file_path}"
            )
            
            return {
                "pr_url": pr_url,
                "branch_name": branch_name,
                "message": "Pull request created successfully"
            }
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PR creation not supported for {repository.source_type}"
            )
            
    except Exception as e:
        logger.error(f"Error creating PR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pull request: {str(e)}"
        )