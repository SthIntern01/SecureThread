# backend/app/api/v1/projects.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.team_repository import TeamRepository
from app.models.repository import Repository
from app.models.vulnerability import Scan  # ✅ ADDED THIS IMPORT
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
            
            # ✅ ADDED: Fetch the latest scan for the repository
            latest_scan = db.query(Scan).filter(
                Scan.repository_id == repo.id
            ).order_by(Scan.started_at.desc()).first()

            repo_data = {
                "id": repo.id,
                "name": repo.name,
                "full_name": repo.full_name,
                "description": repo.description,
                "html_url": repo.html_url,
                "language": repo.language,
                "is_private": repo.is_private,
                "source": repo.source_type,
                "default_branch": repo.default_branch,
                "status": "pending",
                "latest_scan": None,
                "vulnerabilities": None,
                "security_score": None
            }

            # ✅ ADDED: Map the scan data to the response so the UI cards populate
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
                    "status": repo_status,
                    "security_score": latest_scan.security_score,
                    "vulnerabilities": {
                        "total": latest_scan.total_vulnerabilities or 0,
                        "critical": latest_scan.critical_count or 0,
                        "high": latest_scan.high_count or 0,
                        "medium": latest_scan.medium_count or 0,
                        "low": latest_scan.low_count or 0
                    },
                    "latest_scan": {
                        "id": latest_scan.id,
                        "status": latest_scan.status,
                        "scan_type": latest_scan.scan_type or "standard",
                        "started_at": latest_scan.started_at.isoformat() if latest_scan.started_at else None,
                        "completed_at": latest_scan.completed_at.isoformat() if latest_scan.completed_at else None,
                        "total_vulnerabilities": latest_scan.total_vulnerabilities or 0,
                    }
                })
            else:
                repo_data["status"] = "active"

            projects.append(repo_data)
        
        return {"projects": projects}
        
    except Exception as e:
        logger.error(f"Error fetching workspace projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))