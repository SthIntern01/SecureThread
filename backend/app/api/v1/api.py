from fastapi import APIRouter
from app.api.v1 import auth, repositories, scans, gitlab_auth
from app.api.v1 import ai_chat
from app.api.v1 import google_auth
from app.api.v1 import bitbucket_auth
from app.api.v1 import feedback
from app.api.v1 import teams
from app.api.v1 import scan_rules

import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_router = APIRouter()

# Include routers - separate GitHub and GitLab authentication
api_router.include_router(auth.router, prefix="/auth", tags=["GitHub Authentication"])
api_router.include_router(gitlab_auth.router, prefix="/auth", tags=["GitLab Authentication"])
api_router.include_router(repositories.router, prefix="/repositories", tags=["repositories"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(ai_chat.router, prefix="/ai-chat", tags=["ai-chat"])
api_router.include_router(google_auth.router, prefix="/auth", tags=["google-auth"])
api_router.include_router(bitbucket_auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(scan_rules.router, prefix="/scan-rules", tags=["scan-rules"])


logger.info("✅ All routers included successfully - GitHub and GitLab separate")