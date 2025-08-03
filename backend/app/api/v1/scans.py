from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.services.scanner_service import ScannerService
from pydantic import BaseModel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class ScanRequest(BaseModel):
    repository_id: int
    scan_config: Optional[Dict[str, Any]] = None


class ScanResponse(BaseModel):
    id: int
    repository_id: int
    status: str
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

    class Config:
        from_attributes = True


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


class ScanDetailResponse(ScanResponse):
    vulnerabilities: List[VulnerabilityResponse]
    scan_metadata: Optional[Dict[str, Any]] = None


async def run_scan_background(
    repository_id: int,
    github_access_token: str,
    scan_config: Optional[Dict[str, Any]],
    db: Session
):
    """Background task to run repository scan"""
    try:
        scanner_service = ScannerService(db)
        await scanner_service.start_repository_scan(
            repository_id, github_access_token, scan_config
        )
    except Exception as e:
        logger.error(f"Background scan failed: {e}")


@router.post("/start", response_model=ScanResponse)
async def start_repository_scan(
    scan_request: ScanRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a security scan for a repository"""
    
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
    
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub access token not found"
        )
    
    # Check if there's already a running scan
    existing_scan = db.query(Scan).filter(
        Scan.repository_id == scan_request.repository_id,
        Scan.status == "running"
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
            scan_config=scan_request.scan_config or {}
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        # Start background scan
        background_tasks.add_task(
            run_scan_background,
            scan_request.repository_id,
            current_user.github_access_token,
            scan_request.scan_config,
            db
        )
        
        return ScanResponse(
            id=scan.id,
            repository_id=scan.repository_id,
            status=scan.status,
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
            error_message=scan.error_message
        )
    
    except Exception as e:
        logger.error(f"Error starting scan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start scan"
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
        error_message=scan.error_message
    )
    
@router.get("/{scan_id}/file-status")
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
    
    # Get file scan results from scanner service
    scanner_service = ScannerService(db)
    file_results = scanner_service.get_file_scan_results(scan_id)
    
    return {
        "scan_id": scan_id,
        "file_results": file_results,
        "summary": {
            "total_files": len(file_results),
            "scanned": len([f for f in file_results if f.get("status") == "scanned"]),
            "vulnerable": len([f for f in file_results if f.get("status") == "vulnerable"]),
            "skipped": len([f for f in file_results if f.get("status") == "skipped"]),
            "error": len([f for f in file_results if f.get("status") == "error"])
        }
    }


@router.get("/{scan_id}/vulnerabilities", response_model=List[VulnerabilityResponse])
async def get_scan_vulnerabilities(
    scan_id: int,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get vulnerabilities for a specific scan"""
    
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


@router.get("/{scan_id}/details", response_model=ScanDetailResponse)
async def get_scan_details(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get complete scan details including vulnerabilities and metadata"""
    
    scan = db.query(Scan).join(Repository).filter(
        Scan.id == scan_id,
        Repository.owner_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found"
        )
    
    vulnerabilities = db.query(Vulnerability).filter(
        Vulnerability.scan_id == scan_id
    ).order_by(
        Vulnerability.severity.desc(),
        Vulnerability.risk_score.desc()
    ).all()
    
    vulnerability_responses = [
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
    
    return ScanDetailResponse(
        id=scan.id,
        repository_id=scan.repository_id,
        status=scan.status,
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
        vulnerabilities=vulnerability_responses,
        scan_metadata=scan.scan_metadata
    )


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
            error_message=scan.error_message
        )
        for scan in scans
    ]


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
    if scan.status == "running":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a running scan"
        )
    
    db.delete(scan)
    db.commit()
    
    return {"message": "Scan deleted successfully"}