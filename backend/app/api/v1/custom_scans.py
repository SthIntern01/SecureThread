"""
Custom Scans API - Trigger rule-based scans with user custom rules
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan
from app.models.scan_rule import ScanRule
from app.services.custom_scanner_service import CustomScannerService
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter()
logger = logging.getLogger(__name__)


class CustomScanRequest(BaseModel):
    repository_id: int
    use_llm_enhancement: bool = True
    include_user_rules: bool = True


class CustomScanResponse(BaseModel):
    scan_id: int
    repository_id: int
    repository_name: str
    status: str
    message: str
    rules_count: int
    user_custom_rules: int
    global_rules: int


@router.post("/start", response_model=CustomScanResponse)
async def start_custom_scan(
    scan_request: CustomScanRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Start a custom rule-based security scan
    Uses global rules + user custom rules
    """
    try:
        # Get repository and verify ownership
        repository = db.query(Repository).filter(
            Repository.id == scan_request.repository_id,
            Repository.owner_id == current_user.id
        ).first()
        
        if not repository:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found or you don't have access"
            )
        
        # Check for existing running scan
        existing_scan = db.query(Scan).filter(
            Scan.repository_id == scan_request.repository_id,
            Scan.status.in_(["running", "pending"])
        ).first()
        
        if existing_scan:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A scan is already {existing_scan.status} for this repository"
            )
        
        # Get appropriate access token based on repository source
        access_token = None
        provider_type = repository.source_type
        
        if provider_type == "github":
            access_token = current_user.github_access_token
        elif provider_type == "bitbucket":
            access_token = current_user.bitbucket_access_token
        elif provider_type == "gitlab":
            access_token = current_user.gitlab_access_token
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No {provider_type} access token found. Please reconnect your account."
            )
        
        # Load rules (global + user custom)
        rules_query = db.query(ScanRule).filter(ScanRule.is_active == True)
        
        if scan_request.include_user_rules:
            # Include both global rules and user custom rules
            rules_query = rules_query.filter(
                (ScanRule.user_id == None) | (ScanRule.user_id == current_user.id)
            )
        else:
            # Only global rules
            rules_query = rules_query.filter(ScanRule.user_id == None)
        
        rules = rules_query.order_by(ScanRule.execution_priority.desc()).all()
        
        if not rules:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active scan rules found. Please add custom rules or enable global rules."
            )
        
        # Convert rules to dict format
        rules_data = []
        user_custom_count = 0
        global_count = 0
        
        for rule in rules:
            rules_data.append({
                'id': rule.id,
                'user_id': rule.user_id,
                'name': rule.name,
                'description': rule.description,
                'category': rule.category,
                'severity': rule.severity,
                'rule_content': rule.rule_content,
                'cwe_id': rule.cwe_id,
                'owasp_category': rule.owasp_category,
                'language': rule.language,
                'confidence_level': rule.confidence_level
            })
            
            if rule.user_id:
                user_custom_count += 1
            else:
                global_count += 1
        
        # Create scan record
        new_scan = Scan(
            repository_id=repository.id,
            status="pending",
            started_at=datetime.now(timezone.utc),
            scan_metadata={
                'scan_type': 'custom_rule_based',
                'rules_count': len(rules_data),
                'user_custom_rules': user_custom_count,
                'global_rules': global_count,
                'llm_enhancement': scan_request.use_llm_enhancement,
                'initiated_by': current_user.id,
                'provider_type': provider_type
            }
        )
        
        db.add(new_scan)
        db.commit()
        db.refresh(new_scan)
        
        logger.info(f"✅ Created scan {new_scan.id} for repository {repository.full_name}")
        logger.info(f"📋 Using {len(rules_data)} rules ({global_count} global, {user_custom_count} custom)")
        
        # Start scan in background
        background_tasks.add_task(
            run_custom_scan_background,
            db,
            new_scan.id,
            repository.id,
            access_token,
            provider_type,
            rules_data,
            current_user.id,
            scan_request.use_llm_enhancement
        )
        
        return CustomScanResponse(
            scan_id=new_scan.id,
            repository_id=repository.id,
            repository_name=repository.full_name,
            status="pending",
            message="Scan initiated successfully. Processing in background...",
            rules_count=len(rules_data),
            user_custom_rules=user_custom_count,
            global_rules=global_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting custom scan: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scan: {str(e)}"
        )


async def run_custom_scan_background(
    db: Session,
    scan_id: int,
    repository_id: int,
    access_token: str,
    provider_type: str,
    rules_data: list,
    user_id: int,
    use_llm_enhancement: bool
):
    """
    Background task to run the custom scan
    """
    try:
        logger.info(f"🚀 Starting background scan for scan_id={scan_id}")
        
        scanner_service = CustomScannerService(db)
        
        scan = await scanner_service.unified_security_scan(
            repository_id=repository_id,
            access_token=access_token,
            provider_type=provider_type,
            rules=rules_data,
            user_id=user_id,
            use_llm_enhancement=use_llm_enhancement
        )
        
        logger.info(f"✅ Scan {scan_id} completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Background scan {scan_id} failed: {e}", exc_info=True)
        
        # Update scan as failed
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.now(timezone.utc)
            db.commit()


@router.get("/{scan_id}/status")
async def get_scan_status(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the status of a running scan
    """
    scan = db.query(Scan).join(Repository).filter(
        Scan.id == scan_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    return {
        "scan_id": scan.id,
        "status": scan.status,
        "started_at": scan.started_at,
        "completed_at": scan.completed_at,
        "duration": scan.scan_duration,
        "total_vulnerabilities": scan.total_vulnerabilities,
        "security_score": scan.security_score,
        "metadata": scan.scan_metadata
    }