from fastapi import APIRouter
from app.api.v1 import auth, repositories, scans

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(repositories.router, prefix="/repositories", tags=["repositories"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])