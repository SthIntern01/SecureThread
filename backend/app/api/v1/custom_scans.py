from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.models.scan_rule import ScanRule
from app.services.custom_scanner_service import CustomScannerService
from pydantic import BaseModel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class CustomScanRequest(BaseModel):
    repository_id: int
    selected_rules: List[int] = []
    custom_rules: Optional[List[Dict[str, Any]]] = None
    scan_config: Optional[Dict[str, Any]] = None

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

async def run_custom_scan_background(
    repository_id: int,
    access_token: str,
    provider_type: str,
    rules: List[Dict[str, Any]],
    scan_config: Optional[Dict[str, Any]]
):
    """Background task to run custom rule scan"""
    from app.core.database import SessionLocal
    db = SessionLocal()
    scan = None
    
    try:
        from app.services.custom_scanner_service import CustomScannerService
        from datetime import datetime
        
        logger.info(f"🚀 Starting custom scan background task for repository {repository_id}")
        scanner_service = CustomScannerService(db)
        
        scan = await scanner_service.scan_with_custom_rules(
            repository_id,
            access_token,
            provider_type,
            rules,
            scan_config
        )
        
        # ✅ CRITICAL: Refresh and verify
        db.refresh(scan)
        logger.info(f"✅ Custom scan background task completed - scan_id: {scan.id}, status: {scan.status}")
        
    except Exception as e:
        logger.error(f"❌ Custom scan background task failed: {e}", exc_info=True)
        
        # ✅ Update scan status to failed with proper error handling
        try:
            from app.models.vulnerability import Scan
            from datetime import datetime, timezone
            
            if not scan:
                scan = db.query(Scan).filter(
                    Scan.repository_id == repository_id
                ).order_by(Scan.id.desc()).first()
            
            if scan and scan.status in ["running", "pending"]:
                scan.status = "failed"
                scan.error_message = str(e)
                scan.completed_at = datetime.now(timezone.utc)
                db.commit()
                logger.info(f"✅ Marked scan {scan.id} as failed")
            
        except Exception as update_error:
            logger.error(f"❌ Failed to update scan failure status: {update_error}", exc_info=True)
    
    finally:
        db.close()

@router.post("/start", response_model=ScanResponse)
async def start_custom_scan(
    scan_request: CustomScanRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a custom rule-based security scan"""
    
    # Verify repository ownership
    repository = db.query(Repository).filter(
        Repository.id == scan_request.repository_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found"
        )

    # Get access token based on provider
    access_token = None
    if repository.source_type == "github":
        access_token = current_user.github_access_token
    elif repository.source_type == "bitbucket":
        access_token = current_user.bitbucket_access_token
    elif repository.source_type == "gitlab":
        access_token = current_user.gitlab_access_token
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{repository.source_type} access token not found"
        )
    
    # Check for existing running scans
    existing_scan = db.query(Scan).filter(
        Scan.repository_id == scan_request.repository_id,
        Scan.status.in_(["running", "pending"])
    ).first()
    
    if existing_scan:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A scan is already running for this repository"
        )
    
    try:
        # Create initial scan record
        scan = Scan(
            repository_id=scan_request.repository_id,
            status="pending",
            scan_type="custom",
            scan_config=scan_request.scan_config or {},
            scan_metadata={
                'scan_type': 'custom_rules',
                'selected_rules_count': len(scan_request.selected_rules),
                'custom_rules_count': len(scan_request.custom_rules) if scan_request.custom_rules else 0
            }
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        # Start background custom scan
        background_tasks.add_task(
            run_custom_scan_background,
            scan_request.repository_id,
            access_token,
            repository.source_type,
            scan_request.selected_rules,
            scan_request.custom_rules,
            scan_request.scan_config,
            db
        )
        
        return ScanResponse(
            id=scan.id,
            repository_id=scan.repository_id,
            status=scan.status,
            scan_type=scan.scan_type,
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
    
    except Exception as e:
        logger.error(f"Error starting custom scan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start custom scan"
        )

@router.get("/", response_model=dict)
async def get_custom_scans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all custom scan results"""
    try:
        # Query scans with custom rules
        custom_scans = db.query(Scan).join(Repository).filter(
            Repository.owner_id == current_user.id,
            Scan.scan_metadata.contains({'scan_type': 'custom_rules'})
        ).order_by(Scan.started_at.desc()).all()
        
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
                'total_vulnerabilities': scan.total_vulnerabilities,
                'critical_count': scan.critical_count,
                'high_count': scan.high_count,
                'medium_count': scan.medium_count,
                'low_count': scan.low_count,
                'security_score': scan.security_score,
                'scan_metadata': scan.scan_metadata or {}
            }
            scans_data.append(scan_data)
        
        return {
            "scans": scans_data,
            "total_count": len(scans_data)
        }
        
    except Exception as e:
        logger.error(f"Error fetching custom scans: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch custom scans"
        )

@router.get("/{scan_id}", response_model=dict)
async def get_custom_scan_details(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific custom scan"""
    try:
        # Verify scan ownership and that it's a custom scan
        scan = db.query(Scan).join(Repository).filter(
            Scan.id == scan_id,
            Repository.owner_id == current_user.id,
            Scan.scan_metadata.contains({'scan_type': 'custom_rules'})
        ).first()
        
        if not scan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Custom scan not found"
            )
        
        # Get repository info
        repo = db.query(Repository).filter(Repository.id == scan.repository_id).first()
        
        # Get vulnerabilities for this scan
        vulnerabilities = db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).all()
        
        vuln_data = []
        for vuln in vulnerabilities:
            vuln_data.append({
                'id': vuln.id,
                'title': vuln.title,
                'description': vuln.description,
                'severity': vuln.severity,
                'category': vuln.category,
                'file_path': vuln.file_path,
                'line_number': vuln.line_number,
                'risk_score': vuln.risk_score,
                'status': vuln.status
            })
        
        return {
            'scan': {
                'id': scan.id,
                'repository_id': scan.repository_id,
                'repository_name': repo.full_name if repo else 'Unknown',
                'status': scan.status,
                'started_at': scan.started_at.isoformat() if scan.started_at else None,
                'completed_at': scan.completed_at.isoformat() if scan.completed_at else None,
                'total_files_scanned': scan.total_files_scanned,
                'total_vulnerabilities': scan.total_vulnerabilities,
                'critical_count': scan.critical_count,
                'high_count': scan.high_count,
                'medium_count': scan.medium_count,
                'low_count': scan.low_count,
                'security_score': scan.security_score,
                'code_coverage': scan.code_coverage,
                'scan_duration': scan.scan_duration,
                'scan_metadata': scan.scan_metadata or {}
            },
            'vulnerabilities': vuln_data,
            'vulnerability_count': len(vuln_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching custom scan details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch custom scan details"
        )