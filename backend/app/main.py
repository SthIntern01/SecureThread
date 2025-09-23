from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings # Changed from app.config.settings
from app.api.v1.api import api_router
from app.core.database import Base, engine
from app.config.settings import settings


# Debug print to verify settings
print(f"DEBUG: CORS Origins: {settings.BACKEND_CORS_ORIGINS}")
print(f"DEBUG: Frontend URL: {settings.FRONTEND_URL}")

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME, # Changed from APP_NAME to PROJECT_NAME
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS - Temporary fix for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "SecureThread API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/debug/settings")
async def debug_settings():
    return {
        "API_V1_STR": settings.API_V1_STR,
        "app_routes_count": len(app.routes)
    }