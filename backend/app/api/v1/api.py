# backend/app/api/v1/api.py

from fastapi import APIRouter
import logging

# Consolidated imports to avoid redundancy
from app.api.v1 import (
    auth,
    workspace,
    repositories,
    scans,
    gitlab_auth,
    ai_chat,
    google_auth,
    bitbucket_auth,
    feedback,
    teams,
    metrics,
    scan_rules,
    custom_scans,
    projects,
    github_integration  # ✅ ADD THIS LINE
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_router = APIRouter()

# Authentication routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(gitlab_auth.router, prefix="/auth", tags=["GitLab Authentication"])
api_router.include_router(google_auth.router, prefix="/auth", tags=["Google Authentication"])
api_router.include_router(bitbucket_auth.router, prefix="/auth", tags=["Bitbucket Authentication"])

# Workspace router
api_router.include_router(workspace.router, prefix="/workspace", tags=["workspace"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])

# Metrics router
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])

# Feature routers
api_router.include_router(repositories.router, prefix="/repositories", tags=["repositories"])
# Fixed syntax error below (removed space in scans.router)
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(ai_chat.router, prefix="/ai-chat", tags=["ai-chat"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(scan_rules.router, prefix="/scan-rules", tags=["scan-rules"])
api_router.include_router(custom_scans.router, prefix="/custom-scans", tags=["custom-scans"])

# ✅ ADD THIS LINE - GitHub Integration for PR creation
api_router.include_router(github_integration.router, prefix="/github", tags=["GitHub Integration"])

logger.info("✅ All routers included successfully")