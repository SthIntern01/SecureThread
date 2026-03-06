"""
Custom Scans API - Complete scanning system with rule-based vulnerability detection
Merged from scans.py and custom_scans.py for unified scanning functionality
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import io
import logging
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.models.scan_rule import ScanRule
from app.services.custom_scanner_service import CustomScannerService
from app.services.latex_report_service import LaTeXReportService
from app.services.slack_service import slack_service
from fastapi.responses import StreamingResponse
from app.schemas.llm_scan import (
    LLMScanConfigRequest,
    LLMScanResponse,
    LLMScanResultResponse,
    LLMVulnerabilityDetail
)
from app.services.llm_scan_service import LLMScanService

router = APIRouter()
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════

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


class ScanResponse(BaseModel):
    id: int
    repository_id: int
    status: str
    scan_type: Optional[str] = None
    started_at: str
    completed_at: Optional[str] = None
    total_files_scanned: int
    scan_duration: Optional[str] = None
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    security_score: Optional[float] = None
    code_coverage: Optional[float] = None
    error_message: Optional[str] = None
    scan_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class FileStatusResponse(BaseModel):
    file_path: str
    status: str  # "scanned", "vulnerable", "skipped", "error"
    reason: str
    vulnerability_count: int
    file_size: Optional[int] = None


class ScanDetailedResponse(BaseModel):
    scan: ScanResponse
    file_results: List[FileStatusResponse]
    vulnerabilities: List[Dict[str, Any]]


class VulnerabilityResponse(BaseModel):
    id: int
    title: str
    description: str
    severity: str
    category: str
    cwe_id: Optional[str] = None
    owasp_category: Optional[str] = None
    file_path: str
    line_number: Optional[int] = None
    line_end_number: Optional[int] = None
    code_snippet: Optional[str] = None
    recommendation: str
    fix_suggestion: Optional[str] = None
    risk_score: Optional[float] = None
    exploitability: Optional[str] = None
    impact: Optional[str] = None
    status: str
    detected_at: str

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════════
# BACKGROUND SCAN TASK
# ═══════════════════════════════════════════════════════════════════════════

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
    Background task to run the custom scan with rule-based detection
    """
    try:
        logger.info(f"🚀 Starting background scan for scan_id={scan_id}")
        logger.info(f"📋 Using {len(rules_data)} rules for scanning")
        
        # ✅ GET USER OBJECT (needed for Slack notifications)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found - cannot send Slack notifications")
        
        # ✅ SEND SCAN STARTED NOTIFICATION
        if user and user.slack_bot_token:
            try:
                # Get repository details
                repository = db.query(Repository).filter(Repository.id == repository_id).first()
                
                if repository:
                    # Count rule types
                    user_custom_count = len([r for r in rules_data if r.get('user_id') == user_id])
                    global_count = len([r for r in rules_data if r.get('user_id') is None])
                    
                    await slack_service.send_scan_started_notification(
                        user=user,  # ✅ ADD USER PARAMETER
                        scan_id=scan_id,
                        repository_name=repository.full_name,
                        rules_count=len(rules_data),
                        user_custom_rules=user_custom_count,
                        global_rules=global_count
                    )
                    logger.info(f"📢 Sent scan started notification to Slack")
            except Exception as slack_error:
                logger.error(f"Failed to send scan started notification: {slack_error}")
        # ✅ END OF SCAN STARTED NOTIFICATION
        
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
        logger.info(f"📊 Found {scan.total_vulnerabilities} vulnerabilities")
        
        # ✅ SEND SCAN COMPLETE NOTIFICATION
        if user and user.slack_bot_token:
            try:
                # Get repository details
                repository = db.query(Repository).filter(Repository.id == repository_id).first()
                
                if repository:
                    await slack_service.send_scan_complete_notification(
                        user=user,  # ✅ ADD USER PARAMETER
                        scan_id=scan.id,
                        repository_id=repository.id,
                        repository_name=repository.full_name,
                        status=scan.status,
                        total_vulnerabilities=scan.total_vulnerabilities or 0,
                        critical_count=scan.critical_count or 0,
                        high_count=scan.high_count or 0,
                        medium_count=scan.medium_count or 0,
                        low_count=scan.low_count or 0,
                        security_score=scan.security_score or 0.0,
                        scan_duration=scan.scan_duration or "N/A"
                        # ✅ REMOVED db_session=db
                    )
                    logger.info(f"📢 Slack notification sent for scan {scan_id}")
            except Exception as slack_error:
                logger.error(f"Failed to send Slack notification: {slack_error}")
        else:
            logger.info(f"⏭️ User {user_id} doesn't have Slack connected - skipping notification")
    
    except Exception as e:
        logger.error(f"❌ Background scan {scan_id} failed: {e}", exc_info=True)
        
        # Update scan as failed (ONLY if not already stopped by user)
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan: 
            # ✅ DON'T overwrite "stopped" status
            if scan.status != "stopped": 
                scan.status = "failed"
                scan.error_message = str(e)
                scan.completed_at = datetime.now(timezone.utc)
                
                # Calculate duration
                if scan.started_at.tzinfo is None:
                    start_time = scan.started_at.replace(tzinfo=timezone.utc)
                else:
                    start_time = scan.started_at
                
                duration = datetime.now(timezone.utc) - start_time
                total_seconds = int(duration.total_seconds())
                minutes = total_seconds // 60
                seconds = total_seconds % 60
                scan.scan_duration = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
                
                db.commit()
            else:
                logger.info(f"Scan {scan_id} was stopped by user, keeping stopped status")


# ═══════════════════════════════════════════════════════════════════════════
# SCAN MANAGEMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/start", response_model=CustomScanResponse)
async def start_custom_scan(
    scan_request: CustomScanRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Start a custom rule-based security scan
    Uses global rules + user custom rules with language-based filtering
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
                'scan_type': 'custom_rules',
                'rules_count': len(rules_data),
                'user_custom_rules': user_custom_count,
                'global_rules': global_count,
                'llm_enhancement': scan_request.use_llm_enhancement,
                'language_filtering_enabled': True,
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


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan_status(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get scan status and basic information"""
    
    scan = db.query(Scan).join(Repository).filter(
        Scan.id == scan_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    return ScanResponse(
        id=scan.id,
        repository_id=scan.repository_id,
        status=scan.status,
        scan_type=scan.scan_metadata.get('scan_type') if scan.scan_metadata else None,
        started_at=scan.started_at.isoformat(),
        completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
        total_files_scanned=scan.total_files_scanned,
        scan_duration=scan.scan_duration,
        total_vulnerabilities=scan.total_vulnerabilities,
        critical_count=scan.critical_count,
        high_count=scan.high_count,
        medium_count=scan.medium_count,
        low_count=scan.low_count,
        security_score=scan.security_score,
        code_coverage=scan.code_coverage,
        error_message=scan.error_message,
        scan_metadata=scan.scan_metadata or {}
    )


@router.get("/{scan_id}/file-status", response_model=List[FileStatusResponse])
async def get_scan_file_status(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed file scan status for a specific scan"""
    
    # Verify scan ownership
    scan = db.query(Scan).join(Repository).filter(
        Scan.id == scan_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    # Get file scan results from scan metadata
    file_results = []
    if scan.scan_metadata and "file_scan_results" in scan.scan_metadata:
        file_results = scan.scan_metadata["file_scan_results"]
    
    # Transform to response format
    file_status_list = []
    for file_result in file_results:
        vulnerability_count = len(file_result.get("vulnerabilities", []))
        file_status_list.append(FileStatusResponse(
            file_path=file_result.get("file_path", ""),
            status=file_result.get("status", "unknown"),
            reason=file_result.get("reason", ""),
            vulnerability_count=vulnerability_count,
            file_size=file_result.get("file_size")
        ))
    
    return file_status_list


@router.get("/{scan_id}/detailed", response_model=ScanDetailedResponse)
async def get_detailed_scan_results(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get complete scan results including file status and vulnerabilities"""
    
    # Verify scan ownership
    scan = db.query(Scan).join(Repository).filter(
        Scan.id == scan_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    # Get file results from scan metadata
    file_results = []
    if scan.scan_metadata and "file_scan_results" in scan.scan_metadata:
        metadata_file_results = scan.scan_metadata["file_scan_results"]
        logger.info(f"Found {len(metadata_file_results)} file results in scan metadata")
        
        # Transform to proper format
        for file_result in metadata_file_results:
            # Get vulnerabilities for this file from the database
            file_vulnerabilities_from_db = db.query(Vulnerability).filter(
                Vulnerability.scan_id == scan_id,
                Vulnerability.file_path == file_result.get("file_path", "")
            ).all()
            
            # Determine final status
            status_value = file_result.get("status", "unknown")
            reason = file_result.get("reason", "")
            
            # Adjust status based on vulnerabilities found
            if status_value == "scanned" and len(file_vulnerabilities_from_db) > 0:
                status_value = "vulnerable"
                reason = f"Found {len(file_vulnerabilities_from_db)} vulnerabilities"
            elif status_value == "scanned" and len(file_vulnerabilities_from_db) == 0:
                reason = "No vulnerabilities found"
            elif status_value == "skipped":
                reason = file_result.get("reason", "File was skipped")
            elif status_value == "error":
                reason = file_result.get("reason", "Scan error")
            
            file_results.append(FileStatusResponse(
                file_path=file_result.get("file_path", ""),
                status=status_value,
                reason=reason,
                vulnerability_count=len(file_vulnerabilities_from_db),
                file_size=file_result.get("file_size", 0)
            ))
    else:
        logger.warning(f"No file scan results found in scan {scan_id} metadata")
    
    # Get vulnerabilities from database
    vulnerabilities = db.query(Vulnerability).filter(
        Vulnerability.scan_id == scan_id
    ).order_by(
        Vulnerability.severity.desc(),
        Vulnerability.risk_score.desc()
    ).all()
    
    logger.info(f"Found {len(vulnerabilities)} vulnerabilities for scan {scan_id}")
    
    # Transform vulnerabilities
    vuln_list = []
    for vuln in vulnerabilities:
        vuln_list.append({
            "id": vuln.id,
            "title": vuln.title,
            "description": vuln.description,
            "severity": vuln.severity,
            "category": vuln.category,
            "cwe_id": vuln.cwe_id,
            "owasp_category": vuln.owasp_category,
            "file_path": vuln.file_path,
            "line_number": vuln.line_number,
            "line_end_number": vuln.line_end_number,
            "code_snippet": vuln.code_snippet,
            "recommendation": vuln.recommendation,
            "fix_suggestion": vuln.fix_suggestion,
            "risk_score": vuln.risk_score,
            "exploitability": vuln.exploitability,
            "impact": vuln.impact,
            "status": vuln.status,
            "detected_at": vuln.detected_at.isoformat()
        })
    
    # Create scan response
    scan_response = ScanResponse(
        id=scan.id,
        repository_id=scan.repository_id,
        status=scan.status,
        scan_type=scan.scan_metadata.get('scan_type') if scan.scan_metadata else None,
        started_at=scan.started_at.isoformat(),
        completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
        total_files_scanned=scan.total_files_scanned,
        scan_duration=scan.scan_duration,
        total_vulnerabilities=scan.total_vulnerabilities,
        critical_count=scan.critical_count,
        high_count=scan.high_count,
        medium_count=scan.medium_count,
        low_count=scan.low_count,
        security_score=scan.security_score,
        code_coverage=scan.code_coverage,
        error_message=scan.error_message,
        scan_metadata=scan.scan_metadata or {}
    )
    
    logger.info(f"Returning scan details: {len(file_results)} files, {len(vuln_list)} vulnerabilities")
    
    return ScanDetailedResponse(
        scan=scan_response,
        file_results=file_results,
        vulnerabilities=vuln_list
    )


@router.get("/{scan_id}/vulnerabilities", response_model=List[VulnerabilityResponse])
async def get_scan_vulnerabilities(
    scan_id: int,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get vulnerabilities for a specific scan with optional filters"""
    
    # Verify scan ownership
    scan = db.query(Scan).join(Repository).filter(
        Scan.id == scan_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    # Build query for vulnerabilities
    query = db.query(Vulnerability).filter(Vulnerability.scan_id == scan_id)
    
    if severity:
        query = query.filter(Vulnerability.severity == severity)
    
    if category:
        query = query.filter(Vulnerability.category == category)
    
    vulnerabilities = query.order_by(
        Vulnerability.severity.desc(),
        Vulnerability.risk_score.desc()
    ).all()
    
    return [
        VulnerabilityResponse(
            id=vuln.id,
            title=vuln.title,
            description=vuln.description,
            severity=vuln.severity,
            category=vuln.category,
            cwe_id=vuln.cwe_id,
            owasp_category=vuln.owasp_category,
            file_path=vuln.file_path,
            line_number=vuln.line_number,
            line_end_number=vuln.line_end_number,
            code_snippet=vuln.code_snippet,
            recommendation=vuln.recommendation,
            fix_suggestion=vuln.fix_suggestion,
            risk_score=vuln.risk_score,
            exploitability=vuln.exploitability,
            impact=vuln.impact,
            status=vuln.status,
            detected_at=vuln.detected_at.isoformat()
        )
        for vuln in vulnerabilities
    ]


@router.get("/repository/{repository_id}", response_model=List[ScanResponse])
async def get_repository_scans(
    repository_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all scans for a repository"""
    
    # Verify repository ownership
    repository = db.query(Repository).filter(
        Repository.id == repository_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    scans = db.query(Scan).filter(
        Scan.repository_id == repository_id
    ).order_by(Scan.started_at.desc()).all()
    
    return [
        ScanResponse(
            id=scan.id,
            repository_id=scan.repository_id,
            status=scan.status,
            scan_type=scan.scan_metadata.get('scan_type') if scan.scan_metadata else None,
            started_at=scan.started_at.isoformat(),
            completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
            total_files_scanned=scan.total_files_scanned,
            scan_duration=scan.scan_duration,
            total_vulnerabilities=scan.total_vulnerabilities,
            critical_count=scan.critical_count,
            high_count=scan.high_count,
            medium_count=scan.medium_count,
            low_count=scan.low_count,
            security_score=scan.security_score,
            code_coverage=scan.code_coverage,
            error_message=scan.error_message,
            scan_metadata=scan.scan_metadata or {}
        )
        for scan in scans
    ]

@router.get("/repository/{repository_id}/latest", response_model=ScanResponse)
async def get_latest_repository_scan(
    repository_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the LATEST scan for a specific repository
    Use this to avoid showing duplicate scans in the UI
    """
    
    # Verify repository ownership
    repository = db.query(Repository).filter(
        Repository.id == repository_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository: 
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )
    
    # Get latest scan (most recent)
    latest_scan = db.query(Scan).filter(
        Scan.repository_id == repository_id
    ).order_by(Scan.started_at.desc()).first()
    
    if not latest_scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No scans found for this repository"
        )
    
    return ScanResponse(
        id=latest_scan.id,
        repository_id=latest_scan.repository_id,
        status=latest_scan.status,
        scan_type=latest_scan.scan_metadata.get('scan_type') if latest_scan.scan_metadata else None,
        started_at=latest_scan.started_at.isoformat(),
        completed_at=latest_scan.completed_at.isoformat() if latest_scan.completed_at else None,
        total_files_scanned=latest_scan.total_files_scanned,
        scan_duration=latest_scan.scan_duration,
        total_vulnerabilities=latest_scan.total_vulnerabilities,
        critical_count=latest_scan.critical_count,
        high_count=latest_scan.high_count,
        medium_count=latest_scan.medium_count,
        low_count=latest_scan.low_count,
        security_score=latest_scan.security_score,
        code_coverage=latest_scan.code_coverage,
        error_message=latest_scan.error_message,
        scan_metadata=latest_scan.scan_metadata or {}
    )

@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a scan and its vulnerabilities"""
    
    scan = db.query(Scan).join(Repository).filter(
        Scan.id == scan_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    # Don't allow deletion of running scans
    if scan.status in ["running", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a running scan"
        )
    
    db.delete(scan)
    db.commit()
    
    return {"message": "Scan deleted successfully"}


@router.post("/{scan_id}/stop")
async def stop_scan(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Stop a running scan
    The background task will detect the status change and stop gracefully
    """
    
    # Verify scan ownership
    scan = db.query(Scan).join(Repository).filter(
        Scan.id == scan_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    if scan.status not in ["running", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot stop scan with status '{scan.status}'. Only running or pending scans can be stopped."
        )
    
    # Update scan status to stopped
    scan.status = "stopped"
    scan.completed_at = datetime.now(timezone.utc)
    scan.error_message = "Scan stopped by user"
    
    # Calculate duration
    if scan.started_at.tzinfo is None:
        start_time = scan.started_at.replace(tzinfo=timezone.utc)
    else:
        start_time = scan.started_at
    
    duration = datetime.now(timezone.utc) - start_time
    total_seconds = int(duration.total_seconds())
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    scan.scan_duration = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
    
    # Update metadata
    if scan.scan_metadata:
        scan.scan_metadata['stopped_by_user'] = True
        scan.scan_metadata['stop_time'] = datetime.now(timezone.utc).isoformat()
    
    db.commit()
    db.refresh(scan)
    
    logger.info(f"⏹️ Scan {scan_id} marked as stopped by user {current_user.id}")
    
    return {
        "message": "Scan stop requested. The scan will stop after the current file completes.",
        "scan_id": scan_id,
        "status": scan.status
    }


# ═══════════════════════════════════════════════════════════════════════════
# WORKSPACE-SCOPED ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/list/all", response_model=dict)
async def get_all_custom_scans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's custom scan results - WORKSPACE SCOPED"""
    try:
        # Get user's active workspace
        active_workspace_id = current_user.active_team_id
        
        # Get repository IDs for active workspace
        if active_workspace_id:
            from app.models.team_repository import TeamRepository
            
            workspace_repo_ids = db.query(TeamRepository.repository_id).filter(
                TeamRepository.team_id == active_workspace_id
            ).all()
            repo_ids = [r[0] for r in workspace_repo_ids]
            
            if not repo_ids:
                # No repositories in workspace
                logger.info(f"No repositories in workspace {active_workspace_id}")
                return {
                    "scans": [],
                    "total_count": 0,
                    "user_id": current_user.id,
                    "workspace_id": active_workspace_id
                }
            
            # Filter scans by workspace repositories
            query = db.query(Scan).join(Repository).filter(
                Repository.owner_id == current_user.id,
                Repository.id.in_(repo_ids),
                Scan.scan_metadata.isnot(None)
            )
        else:
            # No active workspace - show all user's scans
            query = db.query(Scan).join(Repository).filter(
                Repository.owner_id == current_user.id,
                Scan.scan_metadata.isnot(None)
            )
        
        # Get all scans
        all_scans = query.all()
        
        # Filter for custom scans in Python (more reliable for JSONB)
        custom_scans = []
        for scan in all_scans:
            if (scan.scan_metadata 
                and isinstance(scan.scan_metadata, dict)
                and scan.scan_metadata.get('scan_type') in ['custom_rules', 'unified_rule_based_with_language_filter']):
                custom_scans.append(scan)
        
        # Sort by started_at (most recent first)
        custom_scans.sort(key=lambda x: x.started_at or datetime.min, reverse=True)
        
        logger.info(f"Found {len(custom_scans)} custom scans for user {current_user.id} in workspace {active_workspace_id}")
        
        scans_data = []
        for scan in custom_scans:
            # Get repository name
            repo = db.query(Repository).filter(Repository.id == scan.repository_id).first()
            repo_name = repo.full_name if repo else "Unknown Repository"
            
            scan_data = {
                'id': scan.id,
                'repository_id': scan.repository_id,
                'repository_name': repo_name,
                'status': scan.status,
                'started_at': scan.started_at.isoformat() if scan.started_at else None,
                'completed_at': scan.completed_at.isoformat() if scan.completed_at else None,
                'total_vulnerabilities': scan.total_vulnerabilities or 0,
                'critical_count': scan.critical_count or 0,
                'high_count': scan.high_count or 0,
                'medium_count': scan.medium_count or 0,
                'low_count': scan.low_count or 0,
                'security_score': scan.security_score or 0,
                'user_id': current_user.id,
                'scan_metadata': {
                    'scan_type': scan.scan_metadata.get('scan_type', 'custom_rules'),
                    'rules_count': scan.scan_metadata.get('rules_count', 0),
                    'user_custom_rules': scan.scan_metadata.get('user_custom_rules', 0),
                    'global_rules': scan.scan_metadata.get('global_rules', 0),
                    'files_scanned': scan.total_files_scanned or 0,
                    'language_filtering_enabled': scan.scan_metadata.get('language_filtering_enabled', False)
                }
            }
            scans_data.append(scan_data)
        
        return {
            "scans": scans_data,
            "total_count": len(scans_data),
            "user_id": current_user.id,
            "workspace_id": active_workspace_id
        }
        
    except Exception as e:
        logger.error(f"Error fetching custom scans for user {current_user.id}: {e}")
        # Return empty result instead of error for better UX
        return {
            "scans": [],
            "total_count": 0,
            "user_id": current_user.id,
            "workspace_id": current_user.active_team_id
        }


# ═══════════════════════════════════════════════════════════════════════════
# UTILITY & DEBUG ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{scan_id}/debug")
async def debug_scan_metadata(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Debug endpoint to check scan metadata"""
    
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
        "total_files_scanned": scan.total_files_scanned,
        "total_vulnerabilities": scan.total_vulnerabilities,
        "scan_metadata_keys": list(scan.scan_metadata.keys()) if scan.scan_metadata else [],
        "scan_metadata": scan.scan_metadata,
        "has_file_scan_results": "file_scan_results" in (scan.scan_metadata or {}),
        "file_scan_results_count": len(scan.scan_metadata.get("file_scan_results", [])) if scan.scan_metadata else 0
    }


@router.post("/admin/cleanup-stuck-scans")
async def cleanup_stuck_scans(
    max_runtime_minutes: int = 60,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Administrative endpoint to cleanup scans stuck in running/pending status
    Marks scans as failed if they've been running longer than max_runtime_minutes
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=max_runtime_minutes)
    
    # Find stuck scans
    stuck_scans = db.query(Scan).filter(
        Scan.status.in_(["running", "pending"]),
        Scan.started_at < cutoff_time
    ).all()
    
    fixed_count = 0
    fixed_scan_ids = []
    
    for scan in stuck_scans:
        try:
            scan.status = "failed"
            scan.error_message = f"Scan timed out after {max_runtime_minutes} minutes - automatically marked as failed"
            scan.completed_at = datetime.now(timezone.utc)
            
            # Calculate duration
            if scan.started_at.tzinfo is None:
                start_time = scan.started_at.replace(tzinfo=timezone.utc)
            else:
                start_time = scan.started_at
            
            duration = datetime.now(timezone.utc) - start_time
            minutes = int(duration.total_seconds() // 60)
            seconds = int(duration.total_seconds() % 60)
            scan.scan_duration = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
            
            fixed_count += 1
            fixed_scan_ids.append(scan.id)
            
        except Exception as e:
            logger.error(f"Error fixing scan {scan.id}: {e}")
            continue
    
    db.commit()
    
    logger.info(f"Cleaned up {fixed_count} stuck scans: {fixed_scan_ids}")
    
    return {
        "message": f"Successfully cleaned up {fixed_count} stuck scans",
        "fixed_scan_ids": fixed_scan_ids,
        "cutoff_time": cutoff_time.isoformat()
    }


# ═══════════════════════════════════════════════════════════════════════════
# PDF REPORT GENERATION
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{scan_id}/report/pdf")
async def export_scan_report_pdf(
    scan_id: int,
    report_type: str = "comprehensive",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export scan report as professional PDF"""
    
    try:
        # Initialize PDF service
        latex_service = LaTeXReportService()
        
        # Generate PDF
        pdf_content = await latex_service. generate_security_report(
            scan_id=scan_id,
            db=db,
            user=current_user,
            report_type=report_type
        )
        
        # Prepare response
        filename = f"security-report-scan-{scan_id}-{report_type}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(pdf_content))
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating PDF report for scan {scan_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF report"
        )
    
@router.post("/llm-scan", response_model=LLMScanResponse)
async def initiate_llm_scan(
    config: LLMScanConfigRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Initiate LLM-based vulnerability scan
    """
    try:
        # Verify repository access
        repository = db.query(Repository).filter(
            Repository.id == config.repository_id,
            Repository.owner_id == current_user.id
        ).first()
        
        if not repository:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        # Create scan record
        scan = Scan(
            repository_id=repository.id,
            user_id=current_user.id,
            scan_type='llm_based',
            status='pending',
            max_files=config.max_files,
            priority_level=config.priority_level,
            llm_enhancement_enabled=True
        )
        
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        # Get repository path (adjust based on your setup)
        # TODO: Update this path logic based on where you clone repositories
        repo_path = f"./repos/{current_user.id}/{repository.name}"
        
        # If repository not cloned yet, you may need to clone it first
        # For now, we'll assume the path exists
        
        # Initialize LLM scan service
        llm_service = LLMScanService(db)
        
        # Estimate time
        estimated_time = llm_service.estimate_scan_time(config.max_files, config.priority_level)
        
        # Start scan in background
        background_tasks.add_task(
            llm_service.perform_llm_scan,
            scan.id,
            repository,
            config.max_files,
            config.priority_level,
            repo_path
        )
        
        logger.info(f"🚀 LLM scan initiated: scan_id={scan.id}, repo={repository.name}, priority={config.priority_level}")
        
        return LLMScanResponse(
            scan_id=scan.id,
            message="LLM-based scan initiated successfully",
            repository_id=repository.id,
            scan_type='llm_based',
            priority_level=config.priority_level,
            max_files=config.max_files,
            estimated_time_seconds=estimated_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating LLM scan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initiate scan: {str(e)}")


@router.get("/llm-scan/{scan_id}", response_model=LLMScanResultResponse)
async def get_llm_scan_results(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get LLM scan results with full details
    """
    try:
        scan = db.query(Scan).filter(
            Scan.id == scan_id,
            Scan.user_id == current_user.id,
            Scan.scan_type == 'llm_based'
        ).first()
        
        if not scan:
            raise HTTPException(status_code=404, detail="LLM scan not found")
        
        # Get vulnerabilities
        vulnerabilities = db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).all()
        
        vuln_details = [
            LLMVulnerabilityDetail(
                id=v.id,
                title=v.title,
                description=v.description,
                severity=v.severity,
                category=v.category,
                file_path=v.file_path,
                line_number=v.line_number,
                line_end_number=v.line_end_number,
                code_snippet=v.code_snippet,
                llm_explanation=v.llm_explanation,
                llm_solution=v.llm_solution,
                llm_code_example=v.llm_code_example,
                confidence_score=v.confidence_score,
                detection_method=v.detection_method,
                status=v.status,
                created_at=v.created_at
            )
            for v in vulnerabilities
        ]
        
        return LLMScanResultResponse(
            scan_id=scan.id,
            scan_type=scan.scan_type,
            status=scan.status,
            repository_name=scan.repository.name,
            total_files_scanned=scan.total_files_scanned,
            total_vulnerabilities=scan.total_vulnerabilities,
            critical_count=scan.critical_count,
            high_count=scan.high_count,
            medium_count=scan.medium_count,
            low_count=scan.low_count,
            llm_model_used=scan.llm_model_used,
            total_tokens_used=scan.total_tokens_used or 0,
            estimated_cost=scan.estimated_cost or 0.0,
            scan_duration_seconds=scan.scan_duration_seconds,
            started_at=scan.started_at,
            completed_at=scan.completed_at,
            vulnerabilities=vuln_details
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting LLM scan results: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get scan results: {str(e)}")


@router.get("/scan-status/{scan_id}")
async def get_scan_status(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current status of any scan (rule-based or LLM-based)
    """
    try:
        scan = db.query(Scan).filter(
            Scan.id == scan_id,
            Scan.user_id == current_user.id
        ).first()
        
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        return {
            "scan_id": scan.id,
            "scan_type": scan.scan_type,
            "status": scan.status,
            "progress": {
                "files_scanned": scan.total_files_scanned,
                "vulnerabilities_found": scan.total_vulnerabilities,
            },
            "started_at": scan.started_at.isoformat() if scan.started_at else None,
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            "error_message": scan.error_message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scan status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))