# backend/app/api/v1/workspace.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.workspace_service import WorkspaceService
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class WorkspaceCallbackRequest(BaseModel):
    code: str
    state: str


class WorkspaceCallbackResponse(BaseModel):
    github_token: str
    workspace_name: str
    message: str


class CreateWorkspaceRequest(BaseModel):
    name: str
    repository_ids: List[int]


class CreateWorkspaceResponse(BaseModel):
    workspace_id: int
    workspace_name: str
    repository_count: int
    message: str


class SwitchWorkspaceRequest(BaseModel):
    workspace_id: int


@router.get("/list")
async def get_user_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all workspaces for the current user.
    """
    try:
        workspace_service = WorkspaceService(db)
        workspaces = workspace_service.get_user_workspaces(current_user.id)
        
        return {
            "workspaces": workspaces,
            "active_workspace_id": current_user.active_team_id
        }
        
    except Exception as e:
        logger.error(f"Error fetching workspaces: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workspaces"
        )


@router.post("/switch")
async def switch_workspace(
    request: SwitchWorkspaceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Switch to a different workspace.
    """
    try:
        workspace_service = WorkspaceService(db)
        result = workspace_service.switch_workspace(
            user_id=current_user.id,
            workspace_id=request.workspace_id
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error switching workspace: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to switch workspace"
        )


@router.post("/callback", response_model=WorkspaceCallbackResponse)
async def workspace_oauth_callback(
    request: WorkspaceCallbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Handle GitHub OAuth callback for workspace creation.
    Exchange authorization code for access token.
    """
    try:
        workspace_service = WorkspaceService(db)
        
        result = await workspace_service.handle_workspace_oauth_callback(
            user_id=current_user.id,
            code=request.code,
            state=request.state
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error in workspace callback: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in workspace OAuth callback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process GitHub authorization"
        )


@router.get("/repositories")
async def get_user_repositories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's GitHub repositories for workspace creation.
    Uses the stored GitHub token from login.
    """
    try:
        if not current_user.github_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No GitHub token found. Please login with GitHub first."
            )
        
        workspace_service = WorkspaceService(db)
        repositories = workspace_service.get_user_repositories(current_user)
        
        return repositories
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error fetching repositories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch repositories from GitHub"
        )


@router.post("/create")
async def create_workspace_with_repos(
    request: CreateWorkspaceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new workspace with selected repositories.
    """
    try:
        if not request.repository_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one repository must be selected"
            )
        
        if not current_user.github_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub token not found. Please login with GitHub first."
            )
        
        workspace_service = WorkspaceService(db)
        
        result = workspace_service.create_workspace_with_repositories(
            user_id=current_user.id,
            workspace_name=request.name,
            repository_ids=request.repository_ids,
            github_token=current_user.github_token
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating workspace: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create workspace: {str(e)}"
        )


@router.get("/{workspace_id}/repositories")
async def get_workspace_repositories(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all repositories in a workspace.
    """
    try:
        workspace_service = WorkspaceService(db)
        
        repositories = workspace_service.get_workspace_repositories(
            workspace_id=workspace_id,
            user_id=current_user.id
        )
        
        return repositories
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error fetching workspace repositories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workspace repositories"
        )