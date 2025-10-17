# Replace the file: backend/app/api/v1/scans.py

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime  # ADD THIS IMPORT
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


async def run_scan_background(
    repository_id: int,
    access_token: str,  # Generic token (not just GitHub)
    provider_type: str,  # "github", "bitbucket", "gitlab"
    scan_config: Optional[Dict[str, Any]],
    db: Session
):
    """Background task to run repository scan - FIXED MULTI-PROVIDER"""
    try:
        scanner_service = ScannerService(db)
        await scanner_service.start_repository_scan(
            repository_id, access_token, provider_type, scan_config  # FIXED: Use correct parameters
        )
    except Exception as e:
        logger.error(f"Background scan failed: {e}")
        # Update scan status to failed
        scan = db.query(Scan).filter(
            Scan.repository_id == repository_id,
            Scan.status == "running"
        ).first()
        if scan:
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.utcnow()
            db.commit()


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

    # NEW: Multi-provider access token detection
    access_token = None
    if repository.source_type == "github":
        access_token = current_user.github_access_token
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub access token not found"
            )
    elif repository.source_type == "bitbucket":
        access_token = current_user.bitbucket_access_token
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bitbucket access token not found"
            )
    elif repository.source_type == "gitlab":
        access_token = current_user.gitlab_access_token
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitLab access token not found"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Repository source '{repository.source_type}' not supported for scanning"
        )

    
    
    # Check if there's already a running scan
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
        # Create initial scan record with pending status
        scan = Scan(
            repository_id=scan_request.repository_id,
            status="pending",
            scan_config=scan_request.scan_config or {},
            scan_metadata={}  # Initialize with empty dict
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        # Start background scan
        # CORRECT - use the multi-provider token:
        background_tasks.add_task(
            run_scan_background,
            scan_request.repository_id,
            access_token,  # <- Use the detected token
            repository.source_type,  # <- Also pass the provider type
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
            error_message=scan.error_message,
            scan_metadata=scan.scan_metadata or {}
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
        error_message=scan.error_message,
        scan_metadata=getattr(scan, 'scan_metadata', {}) or {}  # Safe access
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
    
    # Get file scan results from scanner service
    scanner_service = ScannerService(db)
    file_results = scanner_service.get_file_scan_results(scan_id)
    
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


# Update the get_detailed_scan_results function in backend/app/api/v1/scans.py

# Update for backend/app/api/v1/scans.py - Ensure detailed endpoint works correctly

# Update for backend/app/api/v1/scans.py - Ensure detailed endpoint works correctly

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
            
            # Convert to list of dicts for JSON response
            file_vulnerabilities = []
            for vuln in file_vulnerabilities_from_db:
                file_vulnerabilities.append({
                    "id": vuln.id,
                    "title": vuln.title,
                    "description": vuln.description,
                    "severity": vuln.severity,
                    "category": vuln.category,
                    "line_number": vuln.line_number,
                    "code_snippet": vuln.code_snippet,
                    "recommendation": vuln.recommendation,
                    "risk_score": vuln.risk_score
                })
            
            # Determine final status
            status = file_result.get("status", "unknown")
            reason = file_result.get("reason", "")
            
            # Adjust status based on vulnerabilities found
            if status == "scanned" and len(file_vulnerabilities) > 0:
                status = "vulnerable"
                reason = f"Found {len(file_vulnerabilities)} vulnerabilities"
            elif status == "scanned" and len(file_vulnerabilities) == 0:
                reason = "Scan OK - no vulnerabilities found"
            elif status == "skipped":
                reason = "Did not scan due to API constraints"
            elif status == "error":
                reason = "Scan Failed"
            
            file_results.append(FileStatusResponse(
                file_path=file_result.get("file_path", ""),
                status=status,
                reason=reason,
                vulnerability_count=len(file_vulnerabilities),
                file_size=file_result.get("file_size", 0)  # Ensure we have a default value
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
        scan_metadata=getattr(scan, 'scan_metadata', {}) or {}
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
            error_message=scan.error_message,
            scan_metadata=getattr(scan, 'scan_metadata', {}) or {}
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
    """Stop a running scan"""
    
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
            detail="Scan is not currently running"
        )
    
    # Update scan status to stopped
    scan.status = "stopped"
    scan.completed_at = datetime.utcnow()  # Now datetime is imported
    scan.error_message = "Scan stopped by user"
    
    db.commit()
    db.refresh(scan)
    
    return {"message": "Scan stopped successfully"}

@router.get("/{scan_id}/details", response_model=ScanDetailedResponse)
async def get_scan_details_legacy(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Legacy endpoint - redirect to detailed"""
    return await get_detailed_scan_results(scan_id, current_user, db)


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

# Add this to your scans.py file after the existing endpoints

@router.get("/custom/", response_model=dict)
async def get_custom_scans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)  # ✅ CORRECT
):
    """Get all custom scan results"""
    try:
        # ✅ FIX: Use proper JSONB query for PostgreSQL/MySQL
        from sqlalchemy import cast, String
        
        # Query scans with custom rules - FIXED
        all_scans = db.query(Scan).all()
        
        # Filter in Python instead of SQL (more reliable for JSONB)
        custom_scans = [
            scan for scan in all_scans 
            if scan.scan_metadata 
            and isinstance(scan.scan_metadata, dict)
            and scan.scan_metadata.get('scan_type') == 'custom_rules'
        ]
        
        # Sort by started_at
        custom_scans.sort(key=lambda x: x.started_at, reverse=True)
        
        logger.info(f"Found {len(custom_scans)} custom scans")
        
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


# Also add this endpoint for custom scan details
@router.get("/custom/{scan_id}", response_model=dict)
async def get_custom_scan_details(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific custom scan"""
    try:
        # ✅ FIX: Verify scan ownership without JSONB filter first
        scan = db.query(Scan).join(Repository).filter(
            Scan.id == scan_id,
            Repository.owner_id == current_user.id
        ).first()
        
        if not scan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found"
            )
        
        # ✅ Then verify it's a custom scan in Python
        if not scan.scan_metadata or scan.scan_metadata.get('scan_type') != 'custom_rules':
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