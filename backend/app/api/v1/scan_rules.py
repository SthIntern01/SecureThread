"""
Scan Rules API - Manage global and user custom security scanning rules
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.scan_rule import ScanRule
from app.schemas.scan_rules import (
    ScanRuleCreate, ScanRuleUpdate, ScanRuleResponse,
    ScanRuleValidationRequest, ScanRuleValidationResponse
)
from app.services.rule_parser import rule_parser

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[ScanRuleResponse])
async def get_scan_rules(
    include_user_rules: bool = True,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    is_active: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all available scan rules (global + user custom rules)
    """
    try:
        query = db.query(ScanRule)
        
        # Filter by active status
        if is_active:
            query = query.filter(ScanRule.is_active == True)
        
        # Include global rules and optionally user rules
        if include_user_rules:
            query = query.filter(
                (ScanRule.user_id == None) | (ScanRule.user_id == current_user.id)
            )
        else:
            query = query.filter(ScanRule.user_id == None)
        
        # Filter by category
        if category:
            query = query.filter(ScanRule.category == category)
        
        # Filter by severity
        if severity:
            query = query.filter(ScanRule.severity == severity)
        
        rules = query.order_by(ScanRule.execution_priority.desc()).all()
        
        logger.info(f"Retrieved {len(rules)} scan rules for user {current_user.id}")
        return rules
        
    except Exception as e:
        logger.error(f"Error fetching scan rules: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch scan rules"
        )


@router.get("/{rule_id}", response_model=ScanRuleResponse)
async def get_scan_rule(
    rule_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific scan rule by ID
    """
    rule = db.query(ScanRule).filter(ScanRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan rule not found"
        )
    
    # Check access: global rules are accessible to all, user rules only to owner
    if rule.user_id is not None and rule.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this rule"
        )
    
    return rule


@router.post("/", response_model=ScanRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_rule(
    rule_data: ScanRuleCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new custom scan rule (user-specific)
    """
    try:
        # Validate rule content
        validation_result = rule_parser.validate_custom_rule(rule_data.rule_content)
        
        if not validation_result['valid']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Invalid rule content",
                    "errors": validation_result['errors']
                }
            )
        
        # Extract metadata from rule
        metadata = rule_parser.extract_metadata(rule_data.rule_content)
        
        # Create new rule
        new_rule = ScanRule(
            user_id=current_user.id,  # Mark as user custom rule
            name=rule_data.name,
            description=rule_data.description or metadata.get('description', ''),
            category=rule_data.category or metadata.get('category', 'custom'),
            severity=rule_data.severity or metadata.get('severity', 'medium'),
            rule_content=rule_data.rule_content,
            is_active=True,
            cwe_id=rule_data.cwe_id or metadata.get('cwe_id'),
            owasp_category=rule_data.owasp_category or metadata.get('owasp_category'),
            language=rule_data.language or 'multi',
            confidence_level=rule_data.confidence_level or 'medium',
            tags=rule_data.tags or ['custom'],
            execution_priority=rule_data.execution_priority or 50
        )
        
        db.add(new_rule)
        db.commit()
        db.refresh(new_rule)
        
        logger.info(f"User {current_user.id} created custom rule: {new_rule.name} (ID: {new_rule.id})")  # Fixed: removed extra space
        
        return new_rule
        
    except HTTPException:
        raise
    except Exception as e:
        # 🔥 NEW: Check if it's a duplicate rule error
        error_message = str(e)
        
        # Check for duplicate constraint violation (PostgreSQL error code for unique violation)
        if 'unique_rule_hash' in error_message or 'duplicate key value' in error_message: 
            logger.warning(f"User {current_user.id} tried to add duplicate rule: {rule_data.name}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,  # 409 = Conflict
                detail={
                    "message": "This rule already exists in the database! ",
                    "error": "duplicate_rule",
                    "hint": "A rule with identical content is already present.  Please modify your rule or use the existing one."
                }
            )
        
        # For any other error
        logger.error(f"Error creating custom rule: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create custom rule"
        )


@router.put("/{rule_id}", response_model=ScanRuleResponse)
async def update_custom_rule(
    rule_id: int,
    rule_data: ScanRuleUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing custom rule (only rule owner can update)
    """
    rule = db.query(ScanRule).filter(ScanRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan rule not found"
        )
    
    # Only allow updating user's own custom rules
    if rule.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own custom rules"
        )
    
    try:
        # Validate new rule content if provided
        if rule_data.rule_content:
            validation_result = rule_parser.validate_custom_rule(rule_data.rule_content)
            
            if not validation_result['valid']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "message": "Invalid rule content",
                        "errors": validation_result['errors']
                    }
                )
            
            rule.rule_content = rule_data.rule_content
        
        # Update other fields
        if rule_data.name is not None:
            rule.name = rule_data.name
        if rule_data.description is not None:
            rule.description = rule_data.description
        if rule_data.category is not None:
            rule.category = rule_data.category
        if rule_data.severity is not None:
            rule.severity = rule_data.severity
        if rule_data.is_active is not None:
            rule.is_active = rule_data.is_active
        if rule_data.tags is not None:
            rule.tags = rule_data.tags
        
        db.commit()
        db.refresh(rule)
        
        logger.info(f"User {current_user.id} updated custom rule {rule_id}")
        
        return rule
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating custom rule: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update custom rule"
        )


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_rule(
    rule_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a custom rule (only rule owner can delete)
    """
    rule = db.query(ScanRule).filter(ScanRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan rule not found"
        )
    
    # Only allow deleting user's own custom rules
    if rule.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own custom rules"
        )
    
    try:
        db.delete(rule)
        db.commit()
        
        logger.info(f"User {current_user.id} deleted custom rule {rule_id}")
        
    except Exception as e:
        logger.error(f"Error deleting custom rule: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete custom rule"
        )


@router.post("/validate", response_model=ScanRuleValidationResponse)
async def validate_rule_content(
    validation_request: ScanRuleValidationRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Validate rule content before creating/updating
    """
    try:
        validation_result = rule_parser.validate_custom_rule(validation_request.rule_content)
        
        return ScanRuleValidationResponse(
            valid=validation_result['valid'],
            errors=validation_result['errors'],
            patterns_count=validation_result['patterns_count'],
            message="Rule is valid" if validation_result['valid'] else "Rule has errors"
        )
        
    except Exception as e:
        logger.error(f"Error validating rule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate rule"
        )


@router.get("/categories/list")
async def get_rule_categories(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get list of available rule categories
    """
    categories = db.query(ScanRule.category).distinct().all()
    return {"categories": [cat[0] for cat in categories if cat[0]]}


@router.get("/stats/summary")
async def get_rules_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about available rules
    """
    try:
        total_global = db.query(ScanRule).filter(ScanRule.user_id == None).count()
        total_user = db.query(ScanRule).filter(ScanRule.user_id == current_user.id).count()
        
        active_global = db.query(ScanRule).filter(
            ScanRule.user_id == None,
            ScanRule.is_active == True
        ).count()
        
        active_user = db.query(ScanRule).filter(
            ScanRule.user_id == current_user.id,
            ScanRule.is_active == True
        ).count()
        
        return {
            "global_rules": {
                "total": total_global,
                "active": active_global
            },
            "user_custom_rules": {
                "total": total_user,
                "active": active_user
            },
            "total_available": total_global + total_user,
            "total_active": active_global + active_user
        }
        
    except Exception as e:
        logger.error(f"Error getting rules stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get rules statistics"
        )