# backend/app/api/v1/projects.py (create this file if it doesn't exist)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.team_repository import TeamRepository
from app.models.repository import Repository
from app.api.deps import get_current_user
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_workspace_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all projects (repositories) in the current active workspace.
    """
    try:
        if not current_user.active_team_id:
            return {"projects": [], "message": "No active workspace"}
        
        # Get repositories linked to the active workspace
        team_repos = db.query(TeamRepository).filter(
            TeamRepository.team_id == current_user.active_team_id
        ).all()
        
        projects = []
        for tr in team_repos:
            repo = tr.repository
            projects.append({
                "id": repo.id,
                "name": repo.name,
                "full_name": repo.full_name,
                "description": repo.description,
                "html_url": repo.html_url,
                "language": repo.language,
                "is_private": repo.is_private,
                "source": repo.source_type,
                "default_branch": repo.default_branch,
                # Add scan/vulnerability info here if available
            })
        
        return {"projects": projects}
        
    except Exception as e:
        logger.error(f"Error fetching workspace projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))