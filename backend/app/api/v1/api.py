from fastapi import APIRouter
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
    scan_rules,
    custom_scans
)
from app.api.v1 import auth, workspace, projects

import logging

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

# Feature routers
api_router.include_router(repositories.router, prefix="/repositories", tags=["repositories"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(ai_chat.router, prefix="/ai-chat", tags=["ai-chat"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(scan_rules.router, prefix="/scan-rules", tags=["scan-rules"])
api_router.include_router(custom_scans.router, prefix="/custom-scans", tags=["custom-scans"])

logger.info("✅ All routers included successfully")