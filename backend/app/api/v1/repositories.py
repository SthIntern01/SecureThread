# backend/app/api/v1/repositories.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Union, Optional
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.services.github_service import GitHubService
from app.models.vulnerability import Scan, Vulnerability
from app.models.team_repository import TeamRepository
from app.models.team import TeamMember, MemberStatus
from pydantic import BaseModel
import logging
from datetime import datetime, timedelta
import requests
import base64
import urllib.parse

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


# Helper function to correctly verify access based on Workspace, not just Ownership
def get_authorized_repository(db: Session, repo_id: int, current_user: User) -> Repository:
    repository = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repository:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    
    if current_user.active_team_id:
        workspace_repo = db.query(TeamRepository).filter(
            TeamRepository.team_id == current_user.active_team_id,
            TeamRepository.repository_id == repo_id
        ).first()
        if not workspace_repo:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Repository not in active workspace")
    else:
        if repository.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
    return repository


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
    
    active_workspace_id = current_user.active_team_id
    
    if active_workspace_id:
        workspace_repo_ids = set(
            tr.repository.github_id for tr in db.query(TeamRepository).filter(
                TeamRepository.team_id == active_workspace_id
            ).join(Repository).filter(
                Repository.owner_id == current_user.id,
                Repository.github_id.isnot(None)
            ).all()
        )
    else:
        workspace_repo_ids = set(
            repo.github_id for repo in db.query(Repository).filter(
                Repository.owner_id == current_user.id,
                Repository.github_id.isnot(None),
                Repository.is_active == True
            ).all()
        )
    
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
    
    active_workspace_id = current_user.active_team_id
    
    if active_workspace_id:
        workspace_repo_ids = set(
            tr.repository.github_id for tr in db.query(TeamRepository).filter(
                TeamRepository.team_id == active_workspace_id
            ).join(Repository).filter(
                Repository.owner_id == current_user.id,
                Repository.github_id.isnot(None)
            ).all()
        )
    else:
        workspace_repo_ids = set(
            repo.github_id for repo in db.query(Repository).filter(
                Repository.owner_id == current_user.id,
                Repository.github_id.isnot(None),
                Repository.is_active == True
            ).all()
        )
    
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
    
    imported_repo_ids = set(
        repo.bitbucket_id for repo in db.query(Repository).filter(
            Repository.owner_id == current_user.id,
            Repository.bitbucket_id.isnot(None)
        ).all()
    )
    
    for repo in repos:
        repo["is_imported"] = repo["id"] in imported_repo_ids
    
    return {"repositories": repos}


@router.post("/import")
async def import_repositories(
    import_request: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import selected GitHub repositories"""
    try:
        if current_user.active_team_id:
            member = db.query(TeamMember).filter(
                TeamMember.team_id == current_user.active_team_id,
                TeamMember.user_id == current_user.id,
                TeamMember.status == MemberStatus.active
            ).first()
            
            if not member or member.role.value not in ["Owner", "Admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only workspace Owners and Admins can import repositories."
                )

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
        
        for repo_data in repositories_data:
            try:
                repo_github_id = repo_data.get("github_id") or repo_data.get("id")
                
                if not repo_github_id:
                    logger.error(f"Repository {repo_data.get('name')} has no ID")
                    failed_repos.append({
                        "name": repo_data.get("name", "unknown"),
                        "error": "No repository ID provided"
                    })
                    continue
                
                existing_repo = db.query(Repository).filter(
                    Repository.github_id == repo_github_id,
                    Repository.owner_id == current_user.id
                ).first()
                
                if existing_repo:
                    logger.info(f"Repository {repo_data['name']} already exists in database")
                    
                    if current_user.active_team_id:
                        workspace_link = db.query(TeamRepository).filter(
                            TeamRepository.team_id == current_user.active_team_id,
                            TeamRepository.repository_id == existing_repo.id
                        ).first()
                        
                        if workspace_link:
                            continue
                        else:
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
                        continue
                
                new_repo = Repository(
                    github_id=repo_github_id,
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
                db.flush()
                
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
                
            except Exception as e:
                logger.error(f"❌ Error preparing repository {repo_data.get('name', 'unknown')}: {e}")
                failed_repos.append({
                    "name": repo_data.get("name", "unknown"),
                    "error": str(e)
                })
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in import_repositories: {e}")
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
    if current_user.active_team_id:
        member = db.query(TeamMember).filter(
            TeamMember.team_id == current_user.active_team_id,
            TeamMember.user_id == current_user.id,
            TeamMember.status == MemberStatus.active
        ).first()
        
        if not member or member.role.value not in ["Owner", "Admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only workspace Owners and Admins can import repositories."
            )

    if not current_user.bitbucket_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bitbucket access token not found"
        )
    
    from app.services.bitbucket_services import BitbucketService
    bitbucket_service = BitbucketService()
    all_repos = bitbucket_service.get_user_repositories(current_user.bitbucket_access_token)
    
    repo_ids = [str(rid) for rid in import_request.repository_ids]
    
    repos_to_import = [
        repo for repo in all_repos 
        if repo["id"] in repo_ids
    ]
    
    imported_repos = []
    
    for repo_data in repos_to_import:
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
            db.flush()
            
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
    """Get user's imported repositories with latest scan information and filtering"""
    
    active_workspace_id = current_user.active_team_id
    
    if active_workspace_id:
        workspace_repos = db.query(TeamRepository.repository_id).filter(
            TeamRepository.team_id == active_workspace_id
        ).all()
        repo_ids = [r[0] for r in workspace_repos]
        
        if not repo_ids:
            return {
                "repositories": [],
                "total_count": 0,
                "user_id": current_user.id,
                "workspace_id": active_workspace_id
            }
            
        query = db.query(Repository).filter(Repository.id.in_(repo_ids))
    else:
        query = db.query(Repository).filter(Repository.owner_id == current_user.id)
    
    if repository_id:
        query = query.filter(Repository.id == repository_id)
    
    repositories = query.all()
    
    repo_list = []
    for repo in repositories:
        scan_query = db.query(Scan).filter(Scan.repository_id == repo.id)
        
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
            "workspace_id": active_workspace_id,
            "created_at": repo.created_at.isoformat() if repo.created_at else None,
            "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
            "latest_scan": None,
            "vulnerabilities": None,
            "security_score": None,
            "code_coverage": None,
            "status": "pending"
        }

        if latest_scan:
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
        else:
            repo_data["status"] = "active"
        
        repo_list.append(repo_data)
    
    return {
        "repositories": repo_list,
        "total_count": len(repo_list),
        "user_id": current_user.id,
        "workspace_id": active_workspace_id
    }


@router.get("/{repo_id}")
async def get_repository(
    repo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific repository details"""
    repository = get_authorized_repository(db, repo_id, current_user)
    return repository


@router.delete("/{repo_id}")
async def remove_repository(
    repo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove repository from workspace"""
    repository = get_authorized_repository(db, repo_id, current_user)
    
    active_workspace_id = current_user.active_team_id
    if active_workspace_id:
        workspace_repo = db.query(TeamRepository).filter(
            TeamRepository.team_id == active_workspace_id,
            TeamRepository.repository_id == repo_id
        ).first()
        
        if workspace_repo:
            db.delete(workspace_repo)
            db.commit()
            return {"message": "Repository removed from workspace successfully"}
    
    repository.is_active = False
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
    repository = get_authorized_repository(db, repo_id, current_user)
    
    try:
        # Prevent double-encoding by unquoting whatever came from the frontend
        clean_path = urllib.parse.unquote(urllib.parse.unquote(path))
        
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
                clean_path
            )
            
        elif repository.source_type == "bitbucket":
            if not current_user.bitbucket_access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bitbucket access token not found"
                )

            from app.services.bitbucket_services import BitbucketService
            bitbucket_service = BitbucketService()

            try:
                workspace, repo_slug = repository.full_name.split("/", 1)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid repository full_name format for Bitbucket: {repository.full_name}"
                )
            
            content = bitbucket_service.get_repository_content(
                current_user.bitbucket_access_token,
                workspace,
                repo_slug,
                clean_path
            )
            
            if content is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Repository content not found or branch doesn't exist"
                )
            
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
        logger.error(f"Error fetching repository content: {e}")
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
    repository = get_authorized_repository(db, repo_id, current_user)
    
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
    repository = get_authorized_repository(db, repo_id, current_user)
    
    try:
        # Prevent double-encoding by unquoting whatever came from the frontend
        clean_path = urllib.parse.unquote(urllib.parse.unquote(file_path))
        
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
                clean_path
            )
            
            return {
                "content": file_content,
                "encoding": "utf-8",
                "file_path": clean_path
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
                clean_path,
                repository.default_branch
            )
            
            return {
                "content": file_content,
                "encoding": "utf-8",
                "file_path": clean_path
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
    

@router.post("/ai/fix-file")
async def get_ai_fix_for_file(
    request: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated fix using the Surgical Snippet approach"""
    from app.services.llm_service import LLMService
    import urllib.parse
    
    file_path = request.get("file_path")
    content = request.get("content")
    vulnerabilities = request.get("vulnerabilities", [])
    
    if not file_path or not content: 
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_path and content are required"
        )
    
    try:
        clean_path = urllib.parse.unquote(urllib.parse.unquote(file_path))
        llm_service = LLMService()
        
        lines = content.split('\n')
        
        # 1. Find the exact lines we need to fix
        target_lines = [v.get('line') for v in vulnerabilities if v.get('line')]
        
        if target_lines:
            # === SURGICAL SNIPPET MODE ===
            min_line = min(target_lines) - 1  # 0-indexed
            max_line = max(target_lines) - 1
            
            # Grab 10 lines above and 10 lines below for context
            start_idx = max(0, min_line - 10)
            end_idx = min(len(lines), max_line + 11) 
            
            snippet = '\n'.join(lines[start_idx:end_idx])
            
            vuln_list = "\n".join([
                f"- Line {v.get('line')}: {v.get('title')} ({v.get('severity')})"
                for v in vulnerabilities
            ])
            
            prompt = f"""You are a world-class Security Engineer acting as an automated code fixer.
I am providing you with a specific, small snippet of a file ({clean_path}) and a list of vulnerabilities found within it.

Your task: Fix ONLY the vulnerabilities listed. Do NOT refactor or change any other logic.

Vulnerabilities to fix:
{vuln_list}

Here is the snippet (Lines {start_idx + 1} to {end_idx}):
{snippet}

Return the ENTIRE fixed snippet. 
DO NOT include markdown code blocks (like ```javascript). 
DO NOT add explanations. 
Return ONLY the raw, perfectly indented fixed code so it can be directly injected back into the file."""
            
            # This will be blazingly fast because it's only generating ~20 lines
            raw_fixed_snippet = await llm_service._call_deepseek_api(prompt, max_tokens=1500)
            
            if not raw_fixed_snippet:
                raise ValueError("Failed to get response from DeepSeek API.")
                
            fixed_snippet = llm_service._clean_ai_response(raw_fixed_snippet)
            
            # 2. Mathematically stitch the fixed snippet back into the original file
            final_lines = lines[:start_idx] + fixed_snippet.split('\n') + lines[end_idx:]
            fixed_content = '\n'.join(final_lines)
            
        else:
            # === GLOBAL FILE MODE (Fallback if no line numbers are provided) ===
            vuln_list = "\n".join([
                f"- {v.get('title')} ({v.get('severity')})"
                for v in vulnerabilities
            ])
            
            prompt = f"""You are a world-class Security Engineer acting as an automated code fixer.
I am providing you with a full file ({clean_path}).

Your task: Fix ONLY the vulnerabilities listed below. Do NOT refactor or change any other logic. Leave all other code exactly as it is.

Vulnerabilities to fix:
{vuln_list}

Original Code:
{content}

Return the ENTIRE fixed file. 
DO NOT include markdown code blocks. 
DO NOT add explanations. 
Return ONLY the raw fixed code."""
            
            raw_fixed_code = await llm_service._call_deepseek_api(prompt, max_tokens=4000)
            
            if not raw_fixed_code:
                raise ValueError("Failed to get response from DeepSeek API.")
                
            fixed_content = llm_service._clean_ai_response(raw_fixed_code)

        return {
            "fixed_content": fixed_content,
            "file_path": clean_path
        }
        
    except Exception as e: 
        logger.error(f"Error getting AI fix: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI fix: {str(e)}"
        )


@router.get("/{repo_id}/vulnerabilities")
async def get_repository_vulnerabilities(
    repo_id: int,
    file_path: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get vulnerabilities for a specific repository, optionally filtered by file"""
    repository = get_authorized_repository(db, repo_id, current_user)
    
    # Get the latest completed scan for this repository
    latest_scan = db.query(Scan).filter(
        Scan.repository_id == repo_id,
        Scan.status == 'completed'
    ).order_by(Scan.started_at.desc()).first()
    
    if not latest_scan:
        return []
        
    # Get vulnerabilities from the latest scan
    query = db.query(Vulnerability).filter(Vulnerability.scan_id == latest_scan.id)
    
    # Filter by file if requested by the Code Editor
    if file_path:
        # Prevent double encoding issues from frontend
        clean_path = urllib.parse.unquote(urllib.parse.unquote(file_path))
        query = query.filter(Vulnerability.file_path == clean_path)
        
    vulnerabilities = query.order_by(Vulnerability.severity.desc()).all()
    
    # Return formatted vulnerability data
    return [
        {
            "id": v.id,
            "title": v.title,
            "description": v.description,
            "severity": v.severity,
            "category": v.category,
            "file_path": v.file_path,
            "line_number": v.line_number,
            "line_end_number": v.line_end_number,
            "code_snippet": v.code_snippet,
            "recommendation": v.recommendation,
            "status": v.status
        }
        for v in vulnerabilities
    ]


@router.post("/{repo_id}/create-pr")
async def create_fix_pull_request(
    repo_id: int,
    request: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a pull request with vulnerability fixes manually using the GitHub API"""
    
    repository = get_authorized_repository(db, repo_id, current_user)
    
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
            
            # ✅ COMPLETELY CLEAN THE FILE PATH
            # 1. Unquote any double-encoded URLs from frontend (e.g. src%252Fmain -> src/main)
            raw_path = urllib.parse.unquote(urllib.parse.unquote(file_path))
            clean_file_path = raw_path.lstrip('/')
            
            # 2. Re-encode it SAFELY for GitHub's API (keep slashes as slashes)
            encoded_file_path = urllib.parse.quote(clean_file_path, safe='/')
            
            branch_name = f"security-fix-{int(datetime.utcnow().timestamp())}"
            title = f"Fix security vulnerabilities in {clean_file_path.split('/')[-1]}"
            body = f"This PR fixes {len(vulnerability_ids)} security vulnerabilities found in `{clean_file_path}`."
            
            headers = {
                "Authorization": f"Bearer {current_user.github_access_token}",
                "Accept": "application/vnd.github.v3+json"
            }
            
            # 1. Get default branch SHA
            repo_url = f"https://api.github.com/repos/{repository.full_name}"
            repo_resp = requests.get(repo_url, headers=headers)
            if not repo_resp.ok:
                raise ValueError(f"Failed to fetch repo info: {repo_resp.text}")
            default_branch = repo_resp.json()["default_branch"]
            
            ref_url = f"https://api.github.com/repos/{repository.full_name}/git/refs/heads/{default_branch}"
            ref_resp = requests.get(ref_url, headers=headers)
            if not ref_resp.ok:
                raise ValueError(f"Failed to fetch branch ref: {ref_resp.text}")
            base_sha = ref_resp.json()["object"]["sha"]
            
            # 2. Create new branch
            new_ref_url = f"https://api.github.com/repos/{repository.full_name}/git/refs"
            new_ref_resp = requests.post(new_ref_url, json={
                "ref": f"refs/heads/{branch_name}",
                "sha": base_sha
            }, headers=headers)
            if not new_ref_resp.ok:
                raise ValueError(f"Failed to create branch: {new_ref_resp.text}")
                
            # 3. Get file SHA (Fetch from DEFAULT branch to avoid race conditions!)
            file_url = f"https://api.github.com/repos/{repository.full_name}/contents/{encoded_file_path}?ref={default_branch}"
            file_resp = requests.get(file_url, headers=headers)
            
            if not file_resp.ok:
                raise ValueError(f"Failed to find original file to update. GitHub API response: {file_resp.text}")
                
            file_data = file_resp.json()
            if isinstance(file_data, list):
                raise ValueError("Target path is a directory, not a file.")
                
            file_sha = file_data.get("sha")
            if not file_sha:
                raise ValueError("Could not extract file SHA from GitHub response.")
            
            # 4. Update file
            update_data = {
                "message": title,
                "content": base64.b64encode(new_content.encode("utf-8")).decode("utf-8"),
                "branch": branch_name,
                "sha": file_sha  # We now guarantee the SHA is passed
            }
                
            update_url = f"https://api.github.com/repos/{repository.full_name}/contents/{encoded_file_path}"
            update_resp = requests.put(update_url, json=update_data, headers=headers)
            if not update_resp.ok:
                raise ValueError(f"Failed to update file: {update_resp.text}")
                
            # 5. Create PR
            pr_url_api = f"https://api.github.com/repos/{repository.full_name}/pulls"
            pr_resp = requests.post(pr_url_api, json={
                "title": title,
                "body": body,
                "head": branch_name,
                "base": default_branch
            }, headers=headers)
            
            if not pr_resp.ok:
                raise ValueError(f"Failed to create PR: {pr_resp.text}")
                
            pr_url = pr_resp.json()["html_url"]
            
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
        logger.error(f"Error creating PR: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pull request: {str(e)}"
        )