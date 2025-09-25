from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import uuid
from pathlib import Path
import logging
from fastapi.responses import FileResponse
from app.core.database import get_db
from app.services.feedback_service import FeedbackService
from app.schemas.feedback import (
    FeedbackCreate, FeedbackResponse, FeedbackDetail, FeedbackList, 
    FeedbackStats, FeedbackStatusUpdate, FileUploadResponse
)
from app.models.user import User
from app.core.security import get_current_user, get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter()

# File upload configuration
UPLOAD_DIRECTORY = "uploads/feedback"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf", ".txt", ".log", ".json", ".yaml", ".yml"}

# Ensure upload directory exists
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

async def save_uploaded_file(file: UploadFile) -> dict:
    """Save uploaded file and return file info"""
    # Validate file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file_extension} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validate file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    return {
        "filename": file.filename,
        "saved_filename": unique_filename,
        "size": file_size,
        "path": file_path,
        "url": f"/uploads/feedback/{unique_filename}"  # URL to access file
    }

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    # Form data fields
    type: str = Form(...),
    severity: Optional[str] = Form("Medium"),
    description: str = Form(...),
    stepsToReproduce: Optional[str] = Form(None),
    userEmail: Optional[str] = Form(None),
    # File uploads
    attachments: List[UploadFile] = File(None),
    # Dependencies
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # Optional auth - works with or without login
):
    """Submit new feedback with optional file attachments"""
    try:
        # Validate required fields
        if not type or not description:
            raise HTTPException(status_code=400, detail="Type and description are required")
        
        if len(description.strip()) < 10:
            raise HTTPException(status_code=400, detail="Description must be at least 10 characters")
        
        # Handle file uploads
        uploaded_files = []
        if attachments:
            for file in attachments[:5]:  # Limit to 5 files
                if file.filename:  # Skip empty files
                    try:
                        file_info = await save_uploaded_file(file)
                        uploaded_files.append(file_info)
                    except Exception as e:
                        logger.error(f"Error uploading file {file.filename}: {str(e)}")
                        # Continue with other files, don't fail the entire request
        
        # Prepare feedback data
        feedback_data = {
            "type": type,
            "severity": severity,
            "description": description.strip(),
            "stepsToReproduce": stepsToReproduce.strip() if stepsToReproduce else None,
            "userEmail": userEmail.strip() if userEmail else None,
            "attachments": uploaded_files
        }
        
        # Create feedback
        feedback_service = FeedbackService(db)
        feedback = feedback_service.create_feedback(
            feedback_data, 
            user_id=current_user.id if current_user else None
        )
        
        return FeedbackResponse(
            tracking_id=feedback.tracking_id,
            message="Feedback submitted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/feedback/{tracking_id}", response_model=FeedbackDetail)
async def get_feedback(
    tracking_id: str,
    db: Session = Depends(get_db)
):
    """Get feedback by tracking ID - no authentication required"""
    feedback_service = FeedbackService(db)
    feedback = feedback_service.get_feedback_by_tracking_id(tracking_id)
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    # Parse attachments JSON
    attachments = []
    if feedback.attachments:
        try:
            attachments = json.loads(feedback.attachments)
        except:
            attachments = []
    
    return FeedbackDetail(
        id=feedback.id,
        tracking_id=feedback.tracking_id,
        type=feedback.type,
        severity=feedback.severity,
        description=feedback.description,
        steps_to_reproduce=feedback.steps_to_reproduce,
        user_email=feedback.user_email,
        status=feedback.status,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        attachments=attachments
    )

@router.get("/feedback", response_model=FeedbackList)
async def list_feedback(
    page: int = 1,
    per_page: int = 20,
    status: Optional[str] = None,
    feedback_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # Require authentication
):
    """List feedback - requires authentication"""
    feedback_service = FeedbackService(db)
    
    # For now, return user's own feedback. In production, add admin role check
    feedback_list = feedback_service.get_user_feedback(current_user.id, limit=per_page)
    
    # Convert to response format
    items = []
    for feedback in feedback_list:
        attachments = []
        if feedback.attachments:
            try:
                attachments = json.loads(feedback.attachments)
            except:
                attachments = []
        
        items.append(FeedbackDetail(
            id=feedback.id,
            tracking_id=feedback.tracking_id,
            type=feedback.type,
            severity=feedback.severity,
            description=feedback.description,
            steps_to_reproduce=feedback.steps_to_reproduce,
            user_email=feedback.user_email,
            status=feedback.status,
            created_at=feedback.created_at,
            updated_at=feedback.updated_at,
            attachments=attachments
        ))
    
    return FeedbackList(
        items=items,
        total=len(items),
        page=page,
        per_page=per_page
    )

@router.get("/feedback/stats", response_model=FeedbackStats)
async def get_feedback_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # Require authentication
):
    """Get feedback statistics - requires authentication"""
    feedback_service = FeedbackService(db)
    stats = feedback_service.get_feedback_stats()
    return FeedbackStats(**stats)

@router.patch("/feedback/{tracking_id}/status")
async def update_feedback_status(
    tracking_id: str,
    status_update: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # Require authentication
):
    """Update feedback status - requires authentication"""
    feedback_service = FeedbackService(db)
    
    feedback = feedback_service.update_feedback_status(
        tracking_id, 
        status_update.status
    )
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return {"message": "Status updated successfully", "tracking_id": tracking_id}

@router.get("/files/{filename}")
async def get_uploaded_file(filename: str):
        """Serve uploaded feedback files"""
        file_path = os.path.join(UPLOAD_DIRECTORY, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

    
        return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )