# Create: backend/app/api/v1/scan_rules.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.scan_rule import ScanRule, UserCustomRule
from pydantic import BaseModel
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# NEW FUNCTION - ADD THIS ENTIRE BLOCK
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
    
    try:
        from app.services.custom_scanner_service import CustomScannerService
        from datetime import datetime
        
        logger.info(f"Starting custom scan background task for repository {repository_id}")
        scanner_service = CustomScannerService(db)
        
        await scanner_service.scan_with_custom_rules(
            repository_id,
            access_token,
            provider_type,
            rules,
            scan_config
        )
        logger.info(f"Custom scan background task completed for repository {repository_id}")
        
    except Exception as e:
        logger.error(f"Custom scan background task failed: {e}", exc_info=True)
        # Update scan status to failed
        from app.models.vulnerability import Scan
        scan = db.query(Scan).filter(
            Scan.repository_id == repository_id,
            Scan.status == "running"
        ).first()
        if scan:
            from datetime import datetime, timezone
            scan.status = "failed"
            scan.error_message = str(e)
            scan.completed_at = datetime.now(timezone.utc)
            db.commit()
    
    finally:
        db.close()

class ScanRuleResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    severity: str
    rule_content: str
    is_active: bool

    class Config:
        from_attributes = True


class CustomRuleUpload(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = "custom"
    severity: Optional[str] = "medium"
    rule_content: str


class CustomScanRequest(BaseModel):
    repository_id: int
    selected_rule_ids: List[int]
    custom_rules: Optional[List[Dict[str, Any]]] = None
    scan_config: Optional[Dict[str, Any]] = None


@router.get("/", response_model=Dict[str, List[ScanRuleResponse]])
async def get_scan_rules(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all active built-in scan rules grouped by category"""
    query = db.query(ScanRule).filter(ScanRule.is_active == True)
    
    if category:
        query = query.filter(ScanRule.category == category)
    
    rules = query.order_by(ScanRule.category, ScanRule.name).all()
    
    # Group rules by category
    rules_by_category = {}
    for rule in rules:
        if rule.category not in rules_by_category:
            rules_by_category[rule.category] = []
        rules_by_category[rule.category].append(ScanRuleResponse(
            id=rule.id,
            name=rule.name,
            description=rule.description,
            category=rule.category,
            severity=rule.severity,
            rule_content=rule.rule_content,
            is_active=rule.is_active
        ))
    
    # ✅ FIXED: Properly flatten the rules list
    all_rules = []
    for category_rules in rules_by_category.values():
        all_rules.extend(category_rules)

    logger.info(f"✅ Returning {len(all_rules)} rules to frontend")
    return {"rules": all_rules}


@router.get("/categories")
async def get_rule_categories(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all available rule categories with counts"""
    categories = db.query(
        ScanRule.category,
        db.func.count(ScanRule.id).label('count')
    ).filter(ScanRule.is_active == True).group_by(ScanRule.category).all()
    
    return {
        "categories": [
            {
                "name": cat.category,
                "count": cat.count,
                "display_name": cat.category.replace('_', ' ').title()
            }
            for cat in categories
        ]
    }


@router.post("/custom/upload")
async def upload_custom_rules(
    rules_data: List[CustomRuleUpload],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload custom rules from JSON data"""
    uploaded_rules = []
    
    for rule_data in rules_data:
        try:
            # Validate rule content (basic YARA syntax check)
            if not rule_data.rule_content.strip().startswith('rule '):
                logger.warning(f"Rule {rule_data.name} doesn't start with 'rule'")
            
            custom_rule = UserCustomRule(
                uploaded_by=current_user.id,
                name=rule_data.name,
                description=rule_data.description or "",
                category=rule_data.category or "custom",
                severity=rule_data.severity or "medium",
                rule_content=rule_data.rule_content,
                is_active=True,
                is_approved=True  # Auto-approve for now, add moderation later
            )
            
            db.add(custom_rule)
            uploaded_rules.append(custom_rule)
            
        except Exception as e:
            logger.error(f"Error uploading rule {rule_data.name}: {e}")
            continue
    
    db.commit()
    
    return {
        "message": f"Successfully uploaded {len(uploaded_rules)} custom rules",
        "uploaded_count": len(uploaded_rules),
        "total_submitted": len(rules_data)
    }


@router.post("/custom/scan", response_model=Dict[str, Any])
async def start_custom_scan(
    scan_request: CustomScanRequest,
    background_tasks: BackgroundTasks,  # ← ADD THIS LINE
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a custom rule-based scan"""
    from app.models.repository import Repository
    from app.models.vulnerability import Scan
    from app.services.custom_scanner_service import CustomScannerService
    
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
    
    # Check for existing running scan
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
        if scan_request.selected_rule_ids:
            selected_rules = db.query(ScanRule).filter(
                ScanRule.id.in_(scan_request.selected_rule_ids),
                ScanRule.is_active == True
            ).all()
        
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
        
        # Create scan record
        scan = Scan(
            repository_id=scan_request.repository_id,
            status="pending",
            scan_config=scan_request.scan_config or {},
            scan_metadata={
                'scan_type': 'custom_rules',
                'rules_count': len(all_rules),
                'built_in_rules': len(selected_rules),
                'custom_rules': len(scan_request.custom_rules or [])
            }
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        
           # Get access token based on repository source
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
                detail=f"No access token found for {repository.source_type}"
            )
        
                # ✅ CRITICAL FIX: Start the custom scan in background
        logger.info(f"Adding custom scan to background tasks for repository {scan_request.repository_id}")
        background_tasks.add_task(
            run_custom_scan_background,
            scan_request.repository_id,
            access_token,
            repository.source_type,
            all_rules,
            scan_request.scan_config
        )
        
        logger.info(f"Custom scan queued successfully - scan_id: {scan.id}")
        
        return {
            "scan_id": scan.id,
            "status": "started",
            "rules_count": len(all_rules),
            "message": "Custom scan started successfully"
        }
        
    except Exception as e:
        logger.error(f"Error starting custom scan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start custom scan"
        )


@router.get("/custom")
async def get_user_custom_rules(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all approved custom rules (globally available)"""
    custom_rules = db.query(UserCustomRule).filter(
        UserCustomRule.is_active == True,
        UserCustomRule.is_approved == True
    ).order_by(UserCustomRule.created_at.desc()).all()
    
    return {
        "custom_rules": [
            {
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "category": rule.category,
                "severity": rule.severity,
                "uploaded_by": rule.uploaded_by,
                "created_at": rule.created_at.isoformat()
            }
            for rule in custom_rules
        ]
    }