# backend/app/api/v1/workspace.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core. database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.workspace_service import WorkspaceService
from pydantic import BaseModel
from typing import List, Optional
from app.models.team import Team, TeamMember, MemberStatus
from app.models.team_repository import TeamRepository
from app.models.team import Team, TeamMember, MemberStatus, TeamInvitation 
import traceback
import logging
from datetime import datetime



logger = logging.getLogger(__name__)

router = APIRouter()

# Use get_current_user as get_current_active_user
get_current_active_user = get_current_user

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
    repository_ids:  List[int]


class CreateWorkspaceResponse(BaseModel):
    workspace_id: int
    workspace_name: str
    repository_count: int
    message:  str


class SwitchWorkspaceRequest(BaseModel):
    workspace_id: int


# ✅ NEW: Update Workspace Request Model
class UpdateWorkspaceRequest(BaseModel):
    name: str


@router.get("/list")
async def get_user_workspaces(
    current_user:  User = Depends(get_current_user),
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
        logger. error(f"Error fetching workspaces: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workspaces"
        )


@router.post("/switch")
async def switch_workspace(
    request:  SwitchWorkspaceRequest,
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
                detail="No GitHub token found.  Please login with GitHub first."
            )
        
        workspace_service = WorkspaceService(db)
        repositories = workspace_service. get_user_repositories(current_user)
        
        return repositories
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error fetching repositories: {e}")
        raise HTTPException(
            status_code=status. HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch repositories from GitHub"
        )


@router.post("/create")
async def create_workspace_with_repos(
    request:  CreateWorkspaceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new workspace with selected repositories.
    """
    try:
        if not request. repository_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one repository must be selected"
            )
        
        if not current_user.github_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub token not found.  Please login with GitHub first."
            )
        
        workspace_service = WorkspaceService(db)
        
        result = workspace_service.create_workspace_with_repositories(
            user_id=current_user.id,
            workspace_name=request.name,
            repository_ids=request. repository_ids,
            github_token=current_user.github_token
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger. error(f"Error creating workspace:  {e}")
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
        
        repositories = workspace_service. get_workspace_repositories(
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


# ✅ NEW: Update Workspace Name Endpoint
@router.put("/{workspace_id}")
async def update_workspace(
    workspace_id: int,
    request: UpdateWorkspaceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update workspace name (only owner and admin can update)"""
    try:
        logger.info(f"📝 User {current_user. id} attempting to update workspace {workspace_id}")
        
        # Get the team/workspace
        team = db.query(Team).filter(Team.id == workspace_id).first()
        
        if not team:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        # Check if user is owner or admin
        member = db.query(TeamMember).filter(
            TeamMember. team_id == workspace_id,
            TeamMember.user_id == current_user.id,
            TeamMember.status == MemberStatus.active
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=403,
                detail="You are not a member of this workspace"
            )
        
        # Only Owner or Admin can update
        if member.role. value not in ["Owner", "Admin"]:
            raise HTTPException(
                status_code=403,
                detail="Only workspace owners and admins can update workspace name"
            )
        
        # Check if name is empty
        if not request.name or not request.name.strip():
            raise HTTPException(
                status_code=400,
                detail="Workspace name cannot be empty"
            )
        
        # Update the workspace name
        team.name = request.name. strip()
        team.updated_at = datetime.utcnow()
        
        db.add(team)
        db.commit()
        db.refresh(team)
        
        # Count repositories and members
        repo_count = db.query(TeamRepository).filter(
            TeamRepository.team_id == team.id
        ).count()
        
        member_count = db.query(TeamMember).filter(
            TeamMember.team_id == team.id,
            TeamMember.status == MemberStatus.active
        ).count()
        
        logger. info(f"✅ Workspace {workspace_id} name updated to '{team.name}'")
        
        return {
            "id": team.id,
            "name": team.name,
            "owner_id": team.created_by,
            "created_at": team.created_at. isoformat() if team.created_at else None,
            "updated_at":  team.updated_at.isoformat() if team.updated_at else None,
            "plan": "Pro Trial",
            "member_count": member_count,
            "repository_count": repo_count
        }
        
    except HTTPException: 
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"❌ Error updating workspace:  {str(e)}")
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a workspace (only owner can delete)"""
    try:
        logger.info(f"🗑️ User {current_user.id} attempting to delete workspace {workspace_id}")
        
        # Get the team/workspace
        team = db.query(Team).filter(Team.id == workspace_id).first()
        
        if not team:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        # Check if user is the owner
        if team.created_by != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Only the workspace owner can delete it"
            )
        
        # Check if this is the user's last workspace
        user_workspaces = db.query(Team).join(TeamMember).filter(
            TeamMember.user_id == current_user.id,
            TeamMember.status == MemberStatus.active
        ).all()
        
        if len(user_workspaces) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete your last workspace.  Create another workspace first."
            )
        
        # ✅ Delete related data in order
        
        # 1. Delete team repositories
        db.query(TeamRepository).filter(TeamRepository.team_id == workspace_id).delete()
        
        # 2. Delete team invitations
        db.query(TeamInvitation).filter(TeamInvitation.team_id == workspace_id).delete()
        
        # 3. Delete team members
        db.query(TeamMember).filter(TeamMember.team_id == workspace_id).delete()
        
        # 4. If this was the user's active workspace, switch to another one
        if current_user.active_team_id == workspace_id:
            # Find another workspace
            other_workspace = db.query(TeamMember).filter(
                TeamMember.user_id == current_user.id,
                TeamMember.team_id != workspace_id,
                TeamMember.status == MemberStatus.active
            ).first()
            
            if other_workspace:
                current_user.active_team_id = other_workspace.team_id
                db.add(current_user)
        
        # 5. Delete the team itself
        db.delete(team)
        
        db.commit()
        
        logger.info(f"✅ Workspace {workspace_id} deleted successfully")
        
        return {
            "message": "Workspace deleted successfully",
            "deleted_workspace_id": workspace_id,
            "new_active_workspace_id": current_user.active_team_id
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting workspace: {str(e)}")
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{workspace_id}/available-repositories")
async def get_available_repositories(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get repositories that can be added to workspace"""
    try:
        workspace_service = WorkspaceService(db)
        repositories = workspace_service.get_available_repositories(
            user_id=current_user.id,
            workspace_id=workspace_id
        )
        return repositories
    except Exception as e: 
        logger.error(f"Error getting available repositories: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/{workspace_id}/repositories")
async def add_repository_to_workspace(
    workspace_id: int,
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add a repository to workspace"""
    try:
        repository_id = request.get('repository_id')
        if not repository_id:
            raise HTTPException(status_code=400, detail="repository_id is required")
        
        workspace_service = WorkspaceService(db)
        result = workspace_service.add_repository_to_workspace(
            workspace_id=workspace_id,
            repository_id=repository_id,
            user_id=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding repository: {e}")
        raise HTTPException(status_code=500, detail=str(e))