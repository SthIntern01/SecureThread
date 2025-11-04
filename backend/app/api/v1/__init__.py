from fastapi import APIRouter
from app.api.v1 import auth, workspace  # Add workspace import

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(workspace.router, prefix="/workspace", tags=["workspace"])  # Add this