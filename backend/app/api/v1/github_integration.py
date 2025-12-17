# backend/app/api/v1/github_integration.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import logging

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.github_pr_service import GitHubPRService

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class PATTokenRequest(BaseModel):
    """Request to save GitHub PAT token"""
    token: str

class PATTokenResponse(BaseModel):
    """Response after saving PAT token"""
    success: bool
    message: str
    github_username: Optional[str] = None
    token_created_at: Optional[str] = None

class PATStatusResponse(BaseModel):
    """Check if user has PAT token saved"""
    has_token: bool
    created_at: Optional[str] = None
    is_valid: Optional[bool] = None

class FileContentRequest(BaseModel):
    """Request to fetch file content from GitHub"""
    repository_id: int
    file_path: str
    branch: Optional[str] = None

class FileContentResponse(BaseModel):
    """File content from GitHub"""
    success: bool
    content: Optional[str] = None
    file_path: str
    sha: Optional[str] = None
    error: Optional[str] = None

class VulnerabilityFixRequest(BaseModel):
    """Request to save a vulnerability fix"""
    vulnerability_id: int
    file_path: str
    original_code: str
    fixed_code: str
    fix_type: str  # "manual" or "ai_suggested"

class VulnerabilityFixResponse(BaseModel):
    """Response after saving fix"""
    success: bool
    fix_id: int
    message: str

class CreatePRRequest(BaseModel):
    """Request to create a pull request"""
    repository_id: int
    vulnerability_fix_ids: List[int]
    branch_name: Optional[str] = None
    pr_title: Optional[str] = None
    pr_description: Optional[str] = None

class CreatePRResponse(BaseModel):
    """Response after creating PR"""
    success: bool
    pr_number: Optional[int] = None
    pr_url: Optional[str] = None
    branch_name: Optional[str] = None
    files_changed: Optional[List[str]] = None
    error: Optional[str] = None

class PendingFixesResponse(BaseModel):
    """List of pending fixes"""
    fixes: List[dict]
    total_count: int

class PRHistoryResponse(BaseModel):
    """Pull request history"""
    pull_requests: List[dict]
    total_count: int


# ============================================================================
# PAT TOKEN MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/pat/save", response_model=PATTokenResponse)
async def save_github_pat(
    request: PATTokenRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Save GitHub Personal Access Token for the current user
    
    - Validates the token with GitHub
    - Encrypts and stores it securely
    - Returns GitHub username on success
    """
    try:
        github_service = GitHubPRService(db)
        
        # Validate and save token
        success = await github_service.save_pat_token(current_user.id, request.token)
        
        if success: 
            # Get updated user info
            db.refresh(current_user)
            
            # Validate to get GitHub username
            validation = await github_service.validate_pat_token(request.token)
            
            logger.info(f"PAT token saved for user {current_user.id}")
            
            return PATTokenResponse(
                success=True,
                message="GitHub PAT token saved successfully",
                github_username=validation.get("github_username"),
                token_created_at=current_user.github_pat_created_at.isoformat() if current_user.github_pat_created_at else None
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to save PAT token"
            )
            
    except ValueError as e:
        logger.error(f"Invalid PAT token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error saving PAT token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/pat/status", response_model=PATStatusResponse)
async def check_pat_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Check if current user has a GitHub PAT token saved
    
    - Returns whether token exists
    - Returns when it was created
    - Optionally validates if it's still valid
    """
    try:
        has_token = current_user.github_pat_encrypted is not None
        
        # If token exists, optionally validate it
        is_valid = None
        if has_token: 
            github_service = GitHubPRService(db)
            pat_token = await github_service.get_pat_token(current_user.id)
            
            if pat_token: 
                validation = await github_service.validate_pat_token(pat_token)
                is_valid = validation.get("valid", False)
        
        return PATStatusResponse(
            has_token=has_token,
            created_at=current_user.github_pat_created_at.isoformat() if current_user.github_pat_created_at else None,
            is_valid=is_valid
        )
        
    except Exception as e:
        logger.error(f"Error checking PAT status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/pat/delete")
async def delete_github_pat(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete saved GitHub PAT token
    
    - Removes token from database
    - Cannot be undone
    """
    try:
        github_service = GitHubPRService(db)
        success = await github_service.delete_pat_token(current_user.id)
        
        if success:
            logger.info(f"PAT token deleted for user {current_user.id}")
            return {"success": True, "message": "PAT token deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No PAT token found"
            )
            
    except Exception as e:
        logger.error(f"Error deleting PAT token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# ============================================================================
# FILE CONTENT FETCHING
# ============================================================================

@router.post("/file/content", response_model=FileContentResponse)
async def fetch_file_content(
    request: FileContentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Fetch file content from GitHub repository
    
    - Requires PAT token to be saved
    - Returns file content for editing
    - Returns file SHA for later commits
    """
    try: 
        github_service = GitHubPRService(db)
        
        # Get PAT token
        pat_token = await github_service.get_pat_token(current_user.id)
        if not pat_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub PAT token not found. Please add it in settings."
            )
        
        # Get repository info
        from app.models.repository import Repository
        repository = db.query(Repository).filter(
            Repository.id == request.repository_id,
            Repository.owner_id == current_user.id
        ).first()
        
        if not repository:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found"
            )
        
        # Parse owner/repo
        owner, repo_name = repository.full_name.split("/")
        branch = request.branch or repository.default_branch or "main"
        
        # Fetch file content
        result = await github_service.get_file_content(
            owner, repo_name, request.file_path, branch, pat_token
        )
        
        if result.get("success"):
            return FileContentResponse(
                success=True,
                content=result.get("content"),
                file_path=request.file_path,
                sha=result.get("sha")
            )
        else:
            return FileContentResponse(
                success=False,
                file_path=request.file_path,
                error=result.get("error")
            )
            
    except HTTPException: 
        raise
    except Exception as e:
        logger.error(f"Error fetching file content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# ============================================================================
# VULNERABILITY FIX MANAGEMENT
# ============================================================================

@router.post("/fix/save", response_model=VulnerabilityFixResponse)
async def save_vulnerability_fix(
    request: VulnerabilityFixRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Save a vulnerability fix (draft or ready for PR)
    
    - Stores original and fixed code
    - Can be manual or AI-suggested
    - Status starts as 'draft'
    """
    try:
        from app.models.vulnerability import VulnerabilityFix
        
        # Validate fix_type
        if request.fix_type not in ["manual", "ai_suggested"]: 
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="fix_type must be 'manual' or 'ai_suggested'"
            )
        
        # Create fix record
        fix = VulnerabilityFix(
            vulnerability_id=request.vulnerability_id,
            user_id=current_user.id,
            file_path=request.file_path,
            original_code=request.original_code,
            fixed_code=request.fixed_code,
            fix_type=request.fix_type,
            status="draft"
        )
        
        db.add(fix)
        db.commit()
        db.refresh(fix)
        
        logger.info(f"Vulnerability fix saved: {fix.id} for user {current_user.id}")
        
        return VulnerabilityFixResponse(
            success=True,
            fix_id=fix.id,
            message="Fix saved successfully"
        )
        
    except Exception as e: 
        db.rollback()
        logger.error(f"Error saving vulnerability fix: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/fixes/pending", response_model=PendingFixesResponse)
async def get_pending_fixes(
    repository_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all pending fixes for current user
    
    - Filters by repository if provided
    - Only returns fixes with status 'draft' or 'pending_pr'
    - Ordered by creation date (newest first)
    """
    try:
        from app.models.vulnerability import VulnerabilityFix, Vulnerability
        
        query = db.query(VulnerabilityFix).filter(
            VulnerabilityFix.user_id == current_user.id,
            VulnerabilityFix.status.in_(["draft", "pending_pr"])
        )
        
        # Filter by repository if specified
        if repository_id: 
            query = query.join(Vulnerability).filter(
                Vulnerability.repository_id == repository_id
            )
        
        fixes = query.order_by(VulnerabilityFix.created_at.desc()).all()
        
        # Format response
        fixes_data = []
        for fix in fixes:
            vuln = fix.vulnerability if hasattr(fix, 'vulnerability') else None
            fixes_data.append({
                "id": fix.id,
                "vulnerability_id": fix.vulnerability_id,
                "file_path": fix.file_path,
                "fix_type": fix.fix_type,
                "status": fix.status,
                "created_at": fix.created_at.isoformat(),
                "vulnerability_title": vuln.title if vuln else None,
                "vulnerability_severity": vuln.severity if vuln else None
            })
        
        return PendingFixesResponse(
            fixes=fixes_data,
            total_count=len(fixes_data)
        )
        
    except Exception as e:
        logger.error(f"Error fetching pending fixes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# ============================================================================
# PULL REQUEST CREATION
# ============================================================================

@router.post("/pr/create", response_model=CreatePRResponse)
async def create_pull_request(
    request: CreatePRRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a GitHub Pull Request with vulnerability fixes
    
    - Can include single or multiple fixes
    - Creates new branch automatically
    - Commits all fixes
    - Opens PR with detailed description
    """
    try: 
        github_service = GitHubPRService(db)
        
        # Validate user has fixes
        if not request.vulnerability_fix_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fixes provided"
            )
        
        # Create PR
        result = await github_service.create_fix_pull_request(
            user_id=current_user.id,
            repository_id=request.repository_id,
            vulnerability_fix_ids=request.vulnerability_fix_ids,
            branch_name=request.branch_name,
            pr_title=request.pr_title,
            pr_description=request.pr_description
        )
        
        if result.get("success"):
            logger.info(f"PR created successfully: {result.get('pr_url')}")
            return CreatePRResponse(
                success=True,
                pr_number=result.get("pr_number"),
                pr_url=result.get("pr_url"),
                branch_name=result.get("branch_name"),
                files_changed=result.get("files_changed")
            )
        else:
            return CreatePRResponse(
                success=False,
                error=result.get("error")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating pull request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/pr/history", response_model=PRHistoryResponse)
async def get_pr_history(
    repository_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get pull request history for current user
    
    - Shows all PRs created via SecureThread
    - Filters by repository if provided
    - Includes PR status and metadata
    """
    try: 
        from app.models.vulnerability import PullRequest
        
        query = db.query(PullRequest).filter(
            PullRequest.user_id == current_user.id
        )
        
        if repository_id:
            query = query.filter(PullRequest.repository_id == repository_id)
        
        prs = query.order_by(PullRequest.created_at.desc()).all()
        
        # Format response
        pr_data = []
        for pr in prs:
            pr_data.append({
                "id": pr.id,
                "repository_id": pr.repository_id,
                "pr_number": pr.pr_number,
                "pr_url": pr.pr_url,
                "branch_name": pr.branch_name,
                "title": pr.title,
                "status": pr.status,
                "fixes_count": len(pr.fixes_included),
                "created_at": pr.created_at.isoformat()
            })
        
        return PRHistoryResponse(
            pull_requests=pr_data,
            total_count=len(pr_data)
        )
        
    except Exception as e: 
        logger.error(f"Error fetching PR history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/fix/{fix_id}")
async def delete_vulnerability_fix(
    fix_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a saved vulnerability fix
    
    - Only owner can delete
    - Cannot delete if already in PR
    """
    try: 
        from app.models.vulnerability import VulnerabilityFix
        
        fix = db.query(VulnerabilityFix).filter(
            VulnerabilityFix.id == fix_id,
            VulnerabilityFix.user_id == current_user.id
        ).first()
        
        if not fix: 
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fix not found"
            )
        
        # Check if already in PR
        if fix.status == "pr_created":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete fix that's already in a PR"
            )
        
        db.delete(fix)
        db.commit()
        
        logger.info(f"Vulnerability fix deleted: {fix_id}")
        
        return {"success": True, "message": "Fix deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting fix: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )