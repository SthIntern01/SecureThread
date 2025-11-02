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

class UnifiedScanRequest(BaseModel):
    repository_id: int
    selected_rules: List[int] = []
    custom_rules: Optional[List[Dict[str, Any]]] = None
    enable_llm_enhancement: bool = True
    max_files_to_scan: int = 100
    scan_priority: str = 'comprehensive'
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

async def run_unified_scan_background(
    repository_id: int,
    access_token: str,
    provider_type: str,
    rules: List[Dict[str, Any]],
    use_llm_enhancement: bool,
    scan_config: Optional[Dict[str, Any]]
):
    """Background task to run unified LLM-enhanced rule scan"""
    from app.core.database import SessionLocal
    db = SessionLocal()
    scan = None
    
    try:
        from app.services.custom_scanner_service import CustomScannerService
        from datetime import datetime
        
        logger.info(f"🚀 Starting unified scan background task for repository {repository_id}")
        scanner_service = CustomScannerService(db)
        
        # Use the new unified scanning method
        scan = await scanner_service.unified_security_scan(
            repository_id,
            access_token,
            provider_type,
            rules,
            use_llm_enhancement,
            scan_config
        )
        
        # ✅ CRITICAL: Refresh and verify
        db.refresh(scan)
        logger.info(f"✅ Unified scan background task completed - scan_id: {scan.id}, status: {scan.status}")
        
    except Exception as e:
        logger.error(f"❌ Unified scan background task failed: {e}", exc_info=True)
        
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

@router.post("/unified/start", response_model=ScanResponse)
async def start_unified_scan(
    scan_request: UnifiedScanRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a unified LLM-enhanced rule-based security scan"""
    
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
        # Get selected built-in rules
        selected_rules = []
        if scan_request.selected_rules:
            selected_rules = db.query(ScanRule).filter(
                ScanRule.id.in_(scan_request.selected_rules),
                ScanRule.is_active == True
            ).all()
        else:
            # Default to high-priority rules if none selected
            selected_rules = db.query(ScanRule).filter(
                ScanRule.is_active == True,
                ScanRule.severity.in_(['critical', 'high'])
            ).limit(10).all()
        
        # Combine with custom rules
        all_rules = []
        for rule in selected_rules:
            all_rules.append({
                'id': rule.id,
                'name': rule.name,
                'content': rule.rule_content,
                'category': rule.category,
                'severity': rule.severity,
                'type': 'built_in'
            })
        
        # Add custom rules if provided
        if scan_request.custom_rules:
            for i, custom_rule in enumerate(scan_request.custom_rules):
                all_rules.append({
                    'id': f'custom_{i}',
                    'name': custom_rule.get('name', f'Custom Rule {i+1}'),
                    'content': custom_rule.get('rule_content', ''),
                    'category': custom_rule.get('category', 'custom'),
                    'severity': custom_rule.get('severity', 'medium'),
                    'type': 'custom'
                })
        
        if not all_rules:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No rules selected for scanning"
            )

        # Create initial scan record
        scan = Scan(
            repository_id=scan_request.repository_id,
            status="pending",
            scan_type="unified_llm_rules",
            scan_config=scan_request.scan_config or {},
            scan_metadata={
                'scan_type': 'unified_llm_rules',
                'rules_count': len(all_rules),
                'built_in_rules_count': len(selected_rules),
                'custom_rules_count': len(scan_request.custom_rules) if scan_request.custom_rules else 0,
                'llm_enhancement_enabled': scan_request.enable_llm_enhancement,
                'max_files_to_scan': scan_request.max_files_to_scan,
                'scan_priority': scan_request.scan_priority
            }
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
        # Start background unified scan
        background_tasks.add_task(
            run_unified_scan_background,
            scan_request.repository_id,
            access_token,
            repository.source_type,
            all_rules,
            scan_request.enable_llm_enhancement,
            scan_request.scan_config
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
        logger.error(f"Error starting unified scan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_INTERNAL_ERROR,
            detail="Failed to start unified scan"
        )

# Keep existing endpoints for backward compatibility
@router.post("/start", response_model=ScanResponse)
async def start_custom_scan(
    scan_request: UnifiedScanRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Legacy endpoint - redirects to unified scan"""
    return await start_unified_scan(scan_request, background_tasks, current_user, db)

@router.get("/", response_model=dict)
async def get_custom_scans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all unified and custom scan results"""
    try:
        # Query scans with unified or custom rules
        unified_scans = db.query(Scan).join(Repository).filter(
            Repository.owner_id == current_user.id,
            Scan.scan_metadata.isnot(None)
        ).all()
        
        # Filter for relevant scan types
        relevant_scans = []
        for scan in unified_scans:
            if (scan.scan_metadata 
                and isinstance(scan.scan_metadata, dict)
                and scan.scan_metadata.get('scan_type') in ['custom_rules', 'unified_llm_rules']):
                relevant_scans.append(scan)
        
        # Sort by started_at (most recent first)
        relevant_scans.sort(key=lambda x: x.started_at or datetime.min, reverse=True)
        
        logger.info(f"Found {len(relevant_scans)} unified/custom scans for user {current_user.id}")
        
        scans_data = []
        for scan in relevant_scans:
            # Get repository name
            repo = db.query(Repository).filter(Repository.id == scan.repository_id).first()
            repo_name = repo.full_name if repo else "Unknown Repository"
            
            scan_data = {
                'id': scan.id,
                'repository_id': scan.repository_id,
                'repository_name': repo_name,
                'status': scan.status,
                'scan_type': scan.scan_type,
                'started_at': scan.started_at.isoformat() if scan.started_at else None,
                'completed_at': scan.completed_at.isoformat() if scan.completed_at else None,
                'total_vulnerabilities': scan.total_vulnerabilities or 0,
                'critical_count': scan.critical_count or 0,
                'high_count': scan.high_count or 0,
                'medium_count': scan.medium_count or 0,
                'low_count': scan.low_count or 0,
                'security_score': scan.security_score or 0,
                'code_coverage': scan.code_coverage or 0,
                'user_id': current_user.id,
                'scan_metadata': scan.scan_metadata or {}
            }
            scans_data.append(scan_data)
        
        return {
            "scans": scans_data,
            "total_count": len(scans_data),
            "user_id": current_user.id
        }
        
    except Exception as e:
        logger.error(f"Error fetching scans for user {current_user.id}: {e}")
        return {
            "scans": [],
            "total_count": 0,
            "user_id": current_user.id
        }

@router.get("/{scan_id}", response_model=dict)
async def get_scan_details(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific unified/custom scan"""
    try:
        # Verify scan ownership through repository ownership
        scan = db.query(Scan).join(Repository).filter(
            Scan.id == scan_id,
            Repository.owner_id == current_user.id
        ).first()
        
        if not scan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found or access denied"
            )
        
        # Verify it's a relevant scan type
        if (not scan.scan_metadata 
            or scan.scan_metadata.get('scan_type') not in ['custom_rules', 'unified_llm_rules']):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scan not found"
            )
        
        # Get repository info
        repo = db.query(Repository).filter(Repository.id == scan.repository_id).first()
        
        # Get vulnerabilities for this scan
        vulnerabilities = db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).order_by(
            Vulnerability.severity.desc(),
            Vulnerability.risk_score.desc()
        ).all()
        
        vuln_data = []
        for vuln in vulnerabilities:
            vuln_data.append({
                'id': vuln.id,
                'title': vuln.title,
                'description': vuln.description,
                'severity': vuln.severity,
                'category': vuln.category,
                'cwe_id': vuln.cwe_id,
                'owasp_category': vuln.owasp_category,
                'file_path': vuln.file_path,
                'line_number': vuln.line_number,
                'line_end_number': vuln.line_end_number,
                'code_snippet': vuln.code_snippet,
                'recommendation': vuln.recommendation,
                'fix_suggestion': vuln.fix_suggestion,
                'risk_score': vuln.risk_score,
                'exploitability': vuln.exploitability,
                'impact': vuln.impact,
                'status': vuln.status,
                'detected_at': vuln.detected_at.isoformat() if vuln.detected_at else None
            })
        
        return {
            'scan': {
                'id': scan.id,
                'repository_id': scan.repository_id,
                'repository_name': repo.full_name if repo else 'Unknown',
                'status': scan.status,
                'scan_type': scan.scan_type,
                'started_at': scan.started_at.isoformat() if scan.started_at else None,
                'completed_at': scan.completed_at.isoformat() if scan.completed_at else None,
                'total_files_scanned': scan.total_files_scanned or 0,
                'total_vulnerabilities': scan.total_vulnerabilities or 0,
                'critical_count': scan.critical_count or 0,
                'high_count': scan.high_count or 0,
                'medium_count': scan.medium_count or 0,
                'low_count': scan.low_count or 0,
                'security_score': scan.security_score or 0,
                'code_coverage': scan.code_coverage or 0,
                'scan_duration': scan.scan_duration,
                'user_id': current_user.id,
                'scan_metadata': scan.scan_metadata or {}
            },
            'vulnerabilities': vuln_data,
            'vulnerability_count': len(vuln_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching scan details for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch scan details"
        )