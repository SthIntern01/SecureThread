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
import tempfile
import subprocess
import shutil
import os

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.models.scan_rule import ScanRule
from app.models.team_repository import TeamRepository  # ✅ ADDED FOR WORKSPACE FIX
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
    status: str
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
# WORKSPACE AUTHORIZATION HELPERS (✅ FIXING THE GHOST TOWN BUG)
# ═══════════════════════════════════════════════════════════════════════════

def get_authorized_scan(db: Session, scan_id: int, current_user: User) -> Scan:
    """Ensure the user can access this scan via direct ownership OR workspace membership"""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    
    if current_user.active_team_id:
        workspace_repo = db.query(TeamRepository).filter(
            TeamRepository.team_id == current_user.active_team_id,
            TeamRepository.repository_id == scan.repository_id
        ).first()
        if not workspace_repo:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Scan not in active workspace")
    else:
        repo = db.query(Repository).filter(Repository.id == scan.repository_id).first()
        if not repo or repo.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return scan

def get_authorized_repository(db: Session, repo_id: int, current_user: User) -> Repository:
    """Ensure the user can access this repository via direct ownership OR workspace membership"""
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
        
    if current_user.active_team_id:
        workspace_repo = db.query(TeamRepository).filter(
            TeamRepository.team_id == current_user.active_team_id,
            TeamRepository.repository_id == repo_id
        ).first()
        if not workspace_repo:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Repository not in active workspace")
    else:
        if repo.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return repo


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
    try:
        logger.info(f"🚀 Starting background scan for scan_id={scan_id}")
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if user and user.slack_bot_token:
            try:
                repository = db.query(Repository).filter(Repository.id == repository_id).first()
                if repository:
                    user_custom_count = len([r for r in rules_data if r.get('user_id') == user_id])
                    global_count = len([r for r in rules_data if r.get('user_id') is None])
                    
                    await slack_service.send_scan_started_notification(
                        user=user,
                        scan_id=scan_id,
                        repository_name=repository.full_name,
                        rules_count=len(rules_data),
                        user_custom_rules=user_custom_count,
                        global_rules=global_count
                    )
            except Exception as slack_error:
                logger.error(f"Failed to send scan started notification: {slack_error}")
        
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
        
        if user and user.slack_bot_token:
            try:
                repository = db.query(Repository).filter(Repository.id == repository_id).first()
                if repository:
                    await slack_service.send_scan_complete_notification(
                        user=user,
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
                    )
            except Exception as slack_error:
                logger.error(f"Failed to send Slack notification: {slack_error}")
    
    except Exception as e:
        logger.error(f"❌ Background scan {scan_id} failed: {e}", exc_info=True)
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan: 
            if scan.status != "stopped": 
                scan.status = "failed"
                scan.error_message = str(e)
                scan.completed_at = datetime.now(timezone.utc)
                
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


# ═══════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def cleanup_temp_directory(temp_dir: str, scan_id: int):
    import time
    import stat
    time.sleep(15)
    
    def handle_remove_readonly(func, path, exc):
        import os
        import stat
        if not os.access(path, os.W_OK):
            os.chmod(path, stat.S_IWUSR | stat.S_IRUSR)
            func(path)
        else:
            raise
    
    try:
        if os.path.exists(temp_dir):
            if os.name == 'nt':
                for root, dirs, files in os.walk(temp_dir):
                    for dir_name in dirs:
                        try:
                            dir_path = os.path.join(root, dir_name)
                            os.chmod(dir_path, stat.S_IWUSR | stat.S_IRUSR | stat.S_IXUSR)
                        except: pass
                    for file_name in files:
                        try:
                            file_path = os.path.join(root, file_name)
                            os.chmod(file_path, stat.S_IWUSR | stat.S_IRUSR)
                        except: pass
                shutil.rmtree(temp_dir, onerror=handle_remove_readonly)
            else:
                shutil.rmtree(temp_dir)
            logger.info(f"🗑️ Cleaned up temp directory for scan {scan_id}: {temp_dir}")
    except Exception as e:
        logger.warning(f"⚠️ Could not delete temp directory {temp_dir}: {e}")


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
    try:
        # ✅ FIXED: Use the helper to check workspace access
        repository = get_authorized_repository(db, scan_request.repository_id, current_user)
        
        existing_scan = db.query(Scan).filter(
            Scan.repository_id == scan_request.repository_id,
            Scan.status.in_(["running", "pending"])
        ).first()
        
        if existing_scan:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A scan is already {existing_scan.status} for this repository"
            )
        
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
        
        rules_query = db.query(ScanRule).filter(ScanRule.is_active == True)
        
        if scan_request.include_user_rules:
            rules_query = rules_query.filter(
                (ScanRule.user_id == None) | (ScanRule.user_id == current_user.id)
            )
        else:
            rules_query = rules_query.filter(ScanRule.user_id == None)
        
        rules = rules_query.order_by(ScanRule.execution_priority.desc()).all()
        
        if not rules:
            raise HTTPException(status_code=400, detail="No active scan rules found.")
        
        rules_data = []
        user_custom_count = 0
        global_count = 0
        
        for rule in rules:
            rules_data.append({
                'id': rule.id, 'user_id': rule.user_id, 'name': rule.name,
                'description': rule.description, 'category': rule.category,
                'severity': rule.severity, 'rule_content': rule.rule_content,
                'cwe_id': rule.cwe_id, 'owasp_category': rule.owasp_category,
                'language': rule.language, 'confidence_level': rule.confidence_level
            })
            if rule.user_id: user_custom_count += 1
            else: global_count += 1
        
        new_scan = Scan(
            repository_id=repository.id,
            user_id=current_user.id,
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
        
        background_tasks.add_task(
            run_custom_scan_background,
            db, new_scan.id, repository.id, access_token, provider_type,
            rules_data, current_user.id, scan_request.use_llm_enhancement
        )
        
        return CustomScanResponse(
            scan_id=new_scan.id, repository_id=repository.id,
            repository_name=repository.full_name, status="pending",
            message="Scan initiated successfully. Processing in background...",
            rules_count=len(rules_data), user_custom_rules=user_custom_count,
            global_rules=global_count
        )
        
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error starting custom scan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start scan: {str(e)}")


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan_status(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # ✅ FIXED: Use workspace-aware helper
    scan = get_authorized_scan(db, scan_id, current_user)
    
    return ScanResponse(
        id=scan.id, repository_id=scan.repository_id, status=scan.status,
        scan_type=scan.scan_metadata.get('scan_type') if scan.scan_metadata else None,
        started_at=scan.started_at.isoformat(),
        completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
        total_files_scanned=scan.total_files_scanned,
        scan_duration=scan.scan_duration, total_vulnerabilities=scan.total_vulnerabilities,
        critical_count=scan.critical_count, high_count=scan.high_count,
        medium_count=scan.medium_count, low_count=scan.low_count,
        security_score=scan.security_score, code_coverage=scan.code_coverage,
        error_message=scan.error_message, scan_metadata=scan.scan_metadata or {}
    )


@router.get("/{scan_id}/file-status", response_model=List[FileStatusResponse])
async def get_scan_file_status(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # ✅ FIXED: Use workspace-aware helper
    scan = get_authorized_scan(db, scan_id, current_user)
    
    file_results = []
    if scan.scan_metadata and "file_scan_results" in scan.scan_metadata:
        file_results = scan.scan_metadata["file_scan_results"]
    
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
    # ✅ FIXED: Use workspace-aware helper
    scan = get_authorized_scan(db, scan_id, current_user)
    
    file_results = []
    if scan.scan_metadata and "file_scan_results" in scan.scan_metadata:
        metadata_file_results = scan.scan_metadata["file_scan_results"]
        for file_result in metadata_file_results:
            file_vulnerabilities_from_db = db.query(Vulnerability).filter(
                Vulnerability.scan_id == scan_id,
                Vulnerability.file_path == file_result.get("file_path", "")
            ).all()
            
            status_value = file_result.get("status", "unknown")
            reason = file_result.get("reason", "")
            
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
                status=status_value, reason=reason,
                vulnerability_count=len(file_vulnerabilities_from_db),
                file_size=file_result.get("file_size", 0)
            ))
    
    vulnerabilities = db.query(Vulnerability).filter(
        Vulnerability.scan_id == scan_id
    ).order_by(Vulnerability.severity.desc(), Vulnerability.risk_score.desc()).all()
    
    vuln_list = []
    for vuln in vulnerabilities:
        vuln_list.append({
            "id": vuln.id, "title": vuln.title, "description": vuln.description,
            "severity": vuln.severity, "category": vuln.category, "cwe_id": vuln.cwe_id,
            "owasp_category": vuln.owasp_category, "file_path": vuln.file_path,
            "line_number": vuln.line_number, "line_end_number": vuln.line_end_number,
            "code_snippet": vuln.code_snippet, "recommendation": vuln.recommendation,
            "fix_suggestion": vuln.fix_suggestion, "risk_score": vuln.risk_score,
            "exploitability": vuln.exploitability, "impact": vuln.impact,
            "status": vuln.status, "detected_at": vuln.detected_at.isoformat()
        })
    
    scan_response = ScanResponse(
        id=scan.id, repository_id=scan.repository_id, status=scan.status,
        scan_type=scan.scan_metadata.get('scan_type') if scan.scan_metadata else None,
        started_at=scan.started_at.isoformat(),
        completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
        total_files_scanned=scan.total_files_scanned, scan_duration=scan.scan_duration,
        total_vulnerabilities=scan.total_vulnerabilities, critical_count=scan.critical_count,
        high_count=scan.high_count, medium_count=scan.medium_count, low_count=scan.low_count,
        security_score=scan.security_score, code_coverage=scan.code_coverage,
        error_message=scan.error_message, scan_metadata=scan.scan_metadata or {}
    )
    
    return ScanDetailedResponse(
        scan=scan_response, file_results=file_results, vulnerabilities=vuln_list
    )


@router.get("/{scan_id}/vulnerabilities", response_model=List[VulnerabilityResponse])
async def get_scan_vulnerabilities(
    scan_id: int,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # ✅ FIXED: Use workspace-aware helper
    scan = get_authorized_scan(db, scan_id, current_user)
    
    query = db.query(Vulnerability).filter(Vulnerability.scan_id == scan_id)
    if severity: query = query.filter(Vulnerability.severity == severity)
    if category: query = query.filter(Vulnerability.category == category)
    
    vulnerabilities = query.order_by(Vulnerability.severity.desc(), Vulnerability.risk_score.desc()).all()
    
    return [
        VulnerabilityResponse(
            id=vuln.id, title=vuln.title, description=vuln.description,
            severity=vuln.severity, category=vuln.category, cwe_id=vuln.cwe_id,
            owasp_category=vuln.owasp_category, file_path=vuln.file_path,
            line_number=vuln.line_number, line_end_number=vuln.line_end_number,
            code_snippet=vuln.code_snippet, recommendation=vuln.recommendation,
            fix_suggestion=vuln.fix_suggestion, risk_score=vuln.risk_score,
            exploitability=vuln.exploitability, impact=vuln.impact,
            status=vuln.status, detected_at=vuln.detected_at.isoformat()
        ) for vuln in vulnerabilities
    ]


@router.get("/repository/{repository_id}", response_model=List[ScanResponse])
async def get_repository_scans(
    repository_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # ✅ FIXED: Use workspace-aware helper
    repository = get_authorized_repository(db, repository_id, current_user)
    
    scans = db.query(Scan).filter(Scan.repository_id == repository_id).order_by(Scan.started_at.desc()).all()
    
    return [
        ScanResponse(
            id=scan.id, repository_id=scan.repository_id, status=scan.status,
            scan_type=scan.scan_metadata.get('scan_type') if scan.scan_metadata else None,
            started_at=scan.started_at.isoformat(),
            completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
            total_files_scanned=scan.total_files_scanned, scan_duration=scan.scan_duration,
            total_vulnerabilities=scan.total_vulnerabilities, critical_count=scan.critical_count,
            high_count=scan.high_count, medium_count=scan.medium_count, low_count=scan.low_count,
            security_score=scan.security_score, code_coverage=scan.code_coverage,
            error_message=scan.error_message, scan_metadata=scan.scan_metadata or {}
        ) for scan in scans
    ]


@router.get("/repository/{repository_id}/latest", response_model=ScanResponse)
async def get_latest_repository_scan(
    repository_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # ✅ FIXED: Use workspace-aware helper
    repository = get_authorized_repository(db, repository_id, current_user)
    
    latest_scan = db.query(Scan).filter(Scan.repository_id == repository_id).order_by(Scan.started_at.desc()).first()
    if not latest_scan:
        raise HTTPException(status_code=404, detail="No scans found for this repository")
    
    return ScanResponse(
        id=latest_scan.id, repository_id=latest_scan.repository_id, status=latest_scan.status,
        scan_type=latest_scan.scan_metadata.get('scan_type') if latest_scan.scan_metadata else None,
        started_at=latest_scan.started_at.isoformat(),
        completed_at=latest_scan.completed_at.isoformat() if latest_scan.completed_at else None,
        total_files_scanned=latest_scan.total_files_scanned, scan_duration=latest_scan.scan_duration,
        total_vulnerabilities=latest_scan.total_vulnerabilities, critical_count=latest_scan.critical_count,
        high_count=latest_scan.high_count, medium_count=latest_scan.medium_count, low_count=latest_scan.low_count,
        security_score=latest_scan.security_score, code_coverage=latest_scan.code_coverage,
        error_message=latest_scan.error_message, scan_metadata=latest_scan.scan_metadata or {}
    )


@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # ✅ FIXED: Use workspace-aware helper
    scan = get_authorized_scan(db, scan_id, current_user)
    
    if scan.status in ["running", "pending"]:
        raise HTTPException(status_code=400, detail="Cannot delete a running scan")
    
    db.delete(scan)
    db.commit()
    return {"message": "Scan deleted successfully"}


@router.post("/{scan_id}/stop")
async def stop_scan(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # ✅ FIXED: Use workspace-aware helper
    scan = get_authorized_scan(db, scan_id, current_user)
    
    if scan.status not in ["running", "pending"]:
        raise HTTPException(status_code=400, detail=f"Cannot stop scan with status '{scan.status}'")
    
    scan.status = "stopped"
    scan.completed_at = datetime.now(timezone.utc)
    scan.error_message = "Scan stopped by user"
    
    if scan.started_at.tzinfo is None:
        start_time = scan.started_at.replace(tzinfo=timezone.utc)
    else:
        start_time = scan.started_at
    
    duration = datetime.now(timezone.utc) - start_time
    total_seconds = int(duration.total_seconds())
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    scan.scan_duration = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
    
    if scan.scan_metadata:
        scan.scan_metadata['stopped_by_user'] = True
        scan.scan_metadata['stop_time'] = datetime.now(timezone.utc).isoformat()
    
    db.commit()
    return {"message": "Scan stop requested", "scan_id": scan_id, "status": scan.status}


# ═══════════════════════════════════════════════════════════════════════════
# WORKSPACE-SCOPED ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/list/all", response_model=dict)
async def get_all_custom_scans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        active_workspace_id = current_user.active_team_id
        
        if active_workspace_id:
            workspace_repo_ids = db.query(TeamRepository.repository_id).filter(
                TeamRepository.team_id == active_workspace_id
            ).all()
            repo_ids = [r[0] for r in workspace_repo_ids]
            
            if not repo_ids:
                return {"scans": [], "total_count": 0, "user_id": current_user.id, "workspace_id": active_workspace_id}
            
            query = db.query(Scan).join(Repository).filter(
                Repository.id.in_(repo_ids),
                Scan.scan_metadata.isnot(None)
            )
        else:
            query = db.query(Scan).join(Repository).filter(
                Repository.owner_id == current_user.id,
                Scan.scan_metadata.isnot(None)
            )
        
        all_scans = query.all()
        custom_scans = [s for s in all_scans if s.scan_metadata and isinstance(s.scan_metadata, dict) and s.scan_metadata.get('scan_type') in ['custom_rules', 'unified_rule_based_with_language_filter']]
        custom_scans.sort(key=lambda x: x.started_at or datetime.min, reverse=True)
        
        scans_data = []
        for scan in custom_scans:
            repo = db.query(Repository).filter(Repository.id == scan.repository_id).first()
            repo_name = repo.full_name if repo else "Unknown Repository"
            
            scans_data.append({
                'id': scan.id, 'repository_id': scan.repository_id, 'repository_name': repo_name,
                'status': scan.status, 'started_at': scan.started_at.isoformat() if scan.started_at else None,
                'completed_at': scan.completed_at.isoformat() if scan.completed_at else None,
                'total_vulnerabilities': scan.total_vulnerabilities or 0, 'critical_count': scan.critical_count or 0,
                'high_count': scan.high_count or 0, 'medium_count': scan.medium_count or 0, 'low_count': scan.low_count or 0,
                'security_score': scan.security_score or 0, 'user_id': current_user.id,
                'scan_metadata': {
                    'scan_type': scan.scan_metadata.get('scan_type', 'custom_rules'),
                    'rules_count': scan.scan_metadata.get('rules_count', 0),
                    'user_custom_rules': scan.scan_metadata.get('user_custom_rules', 0),
                    'global_rules': scan.scan_metadata.get('global_rules', 0),
                    'files_scanned': scan.total_files_scanned or 0,
                    'language_filtering_enabled': scan.scan_metadata.get('language_filtering_enabled', False)
                }
            })
        
        return {"scans": scans_data, "total_count": len(scans_data), "user_id": current_user.id, "workspace_id": active_workspace_id}
        
    except Exception as e:
        logger.error(f"Error fetching custom scans: {e}")
        return {"scans": [], "total_count": 0, "user_id": current_user.id, "workspace_id": current_user.active_team_id}


# ═══════════════════════════════════════════════════════════════════════════
# UTILITY & DEBUG ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/{scan_id}/debug")
async def debug_scan_metadata(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # ✅ FIXED: Use workspace-aware helper
    scan = get_authorized_scan(db, scan_id, current_user)
    
    return {
        "scan_id": scan.id, "status": scan.status, "total_files_scanned": scan.total_files_scanned,
        "total_vulnerabilities": scan.total_vulnerabilities,
        "scan_metadata_keys": list(scan.scan_metadata.keys()) if scan.scan_metadata else [],
        "scan_metadata": scan.scan_metadata, "has_file_scan_results": "file_scan_results" in (scan.scan_metadata or {}),
        "file_scan_results_count": len(scan.scan_metadata.get("file_scan_results", [])) if scan.scan_metadata else 0
    }

@router.post("/admin/cleanup-stuck-scans")
async def cleanup_stuck_scans(
    max_runtime_minutes: int = 60,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=max_runtime_minutes)
    stuck_scans = db.query(Scan).filter(Scan.status.in_(["running", "pending"]), Scan.started_at < cutoff_time).all()
    
    fixed_count = 0
    fixed_scan_ids = []
    
    for scan in stuck_scans:
        try:
            scan.status = "failed"
            scan.error_message = f"Scan timed out after {max_runtime_minutes} minutes"
            scan.completed_at = datetime.now(timezone.utc)
            
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
        except Exception as e: pass
    
    db.commit()
    return {"message": f"Successfully cleaned up {fixed_count} stuck scans", "fixed_scan_ids": fixed_scan_ids, "cutoff_time": cutoff_time.isoformat()}


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
    try:
        # Security check logic handled inside latex_service, but we should wrap it to be safe
        scan = get_authorized_scan(db, scan_id, current_user)
        
        latex_service = LaTeXReportService()
        pdf_content = await latex_service.generate_security_report(
            scan_id=scan.id, db=db, user=current_user, report_type=report_type
        )
        
        filename = f"security-report-scan-{scan_id}-{report_type}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_content), media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}", "Content-Length": str(len(pdf_content))}
        )
    except Exception as e:
        logger.error(f"Error generating PDF report for scan {scan_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")


# ═══════════════════════════════════════════════════════════════════════════
# LLM-BASED SCANNING ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/llm-scan", response_model=LLMScanResponse)
async def initiate_llm_scan(
    config: LLMScanConfigRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # ✅ FIXED: Use workspace-aware helper
        repository = get_authorized_repository(db, config.repository_id, current_user)
        
        scan = Scan(
            repository_id=repository.id, user_id=current_user.id, scan_type='llm_based',
            status='pending', max_files=config.max_files, priority_level=config.priority_level,
            llm_enhancement_enabled=True
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        access_token = current_user.github_access_token or current_user.github_token
        if not access_token:
            scan.status = 'failed'
            scan.error_message = 'GitHub access token not found'
            db.commit()
            raise HTTPException(status_code=400, detail="GitHub access token required")
        
        temp_dir = tempfile.mkdtemp(prefix=f"securethread_llm_scan_{scan.id}_")
        
        try:
            repo_url = repository.clone_url
            auth_url = repo_url.replace("https://", f"https://{access_token}@") if "github.com" in repo_url else repo_url
            
            result = subprocess.run(["git", "clone", "--depth=1", "--single-branch", auth_url, temp_dir], capture_output=True, text=True, timeout=120)
            if result.returncode != 0:
                scan.status = 'failed'
                scan.error_message = f'Failed to clone repository: {result.stderr}'
                db.commit()
                if os.path.exists(temp_dir): shutil.rmtree(temp_dir, ignore_errors=True)
                raise HTTPException(status_code=500, detail=f"Failed to clone repository")
        except Exception as clone_error:
            scan.status = 'failed'
            scan.error_message = f'Clone error: {str(clone_error)}'
            db.commit()
            if os.path.exists(temp_dir): shutil.rmtree(temp_dir, ignore_errors=True)
            raise HTTPException(status_code=500, detail=f"Failed to clone repository")
        
        llm_service = LLMScanService(db)
        estimated_time = llm_service.estimate_scan_time(config.max_files, config.priority_level)
        
        background_tasks.add_task(llm_service.perform_llm_scan, scan.id, repository, config.max_files, config.priority_level, temp_dir)
        background_tasks.add_task(cleanup_temp_directory, temp_dir, scan.id)
        
        return LLMScanResponse(
            scan_id=scan.id, message="LLM-based scan initiated successfully", repository_id=repository.id,
            scan_type='llm_based', priority_level=config.priority_level, max_files=config.max_files, estimated_time_seconds=estimated_time
        )
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.get("/llm-scan/{scan_id}", response_model=LLMScanResultResponse)
async def get_llm_scan_results(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # ✅ FIXED: Use workspace-aware helper
        scan = get_authorized_scan(db, scan_id, current_user)
        if scan.scan_type != 'llm_based':
            raise HTTPException(status_code=400, detail="This is not an LLM scan")
            
        repository = db.query(Repository).filter(Repository.id == scan.repository_id).first()
        vulnerabilities = db.query(Vulnerability).filter(Vulnerability.scan_id == scan_id).all()
        
        vuln_details = [
            LLMVulnerabilityDetail(
                id=v.id, title=v.title, description=v.description, severity=v.severity, category=v.category,
                file_path=v.file_path, line_number=v.line_number, line_end_number=v.line_end_number,
                code_snippet=v.code_snippet, llm_explanation=v.llm_explanation, llm_solution=v.llm_solution,
                llm_code_example=v.llm_code_example, confidence_score=v.confidence_score,
                detection_method=v.detection_method, status=v.status, created_at=v.created_at
            ) for v in vulnerabilities
        ]
        
        return LLMScanResultResponse(
            scan_id=scan.id, scan_type=scan.scan_type, status=scan.status, repository_name=repository.name,
            total_files_scanned=scan.total_files_scanned or 0, total_vulnerabilities=scan.total_vulnerabilities or 0,
            critical_count=scan.critical_count or 0, high_count=scan.high_count or 0, medium_count=scan.medium_count or 0,
            low_count=scan.low_count or 0, llm_model_used=scan.llm_model_used or "deepseek-chat",
            total_tokens_used=scan.total_tokens_used or 0, estimated_cost=scan.estimated_cost or 0.0,
            scan_duration_seconds=scan.scan_duration_seconds, started_at=scan.started_at,
            completed_at=scan.completed_at, vulnerabilities=vuln_details
        )
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.get("/scan-status/{scan_id}")
async def get_scan_status_detailed(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # ✅ FIXED: Use workspace-aware helper
        scan = get_authorized_scan(db, scan_id, current_user)
        
        return {
            "scan_id": scan.id, "scan_type": scan.scan_type, "status": scan.status,
            "progress": {"files_scanned": scan.total_files_scanned or 0, "vulnerabilities_found": scan.total_vulnerabilities or 0},
            "started_at": scan.started_at.isoformat() if scan.started_at else None,
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            "error_message": scan.error_message
        }
    except HTTPException: raise
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))