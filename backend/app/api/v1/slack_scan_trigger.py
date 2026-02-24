# backend/app/api/v1/slack_scan_trigger.py

import logging
from datetime import datetime, timezone
from typing import Tuple
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan
from app.models.scan_rule import ScanRule

logger = logging.getLogger(__name__)


async def trigger_scan_from_slack(
    user: User,
    repository: Repository,
    db: Session
) -> Tuple[bool, str, int]:
    """
    Trigger a security scan from Slack
    
    Args:
        user: User who initiated the scan
        repository: Repository to scan
        db: Database session
    
    Returns:
        Tuple of (success: bool, message: str, scan_id: int)
    """
    try:
        # Get appropriate access token
        access_token = None
        provider_type = repository.source_type
        
        if provider_type == "github":
            access_token = user.github_access_token
        elif provider_type == "bitbucket":
            access_token = user.bitbucket_access_token
        elif provider_type == "gitlab":
            access_token = user.gitlab_access_token
        
        if not access_token:
            return (
                False,
                f"No {provider_type} access token found. Please reconnect your account.",
                0
            )
        
        # Load scan rules (global + user custom)
        rules_query = db.query(ScanRule).filter(
            ScanRule.is_active == True
        ).filter(
            (ScanRule.user_id == None) | (ScanRule.user_id == user.id)
        )
        
        rules = rules_query.order_by(ScanRule.execution_priority.desc()).all()
        
        if not rules:
            return (
                False,
                "No active scan rules found. Please add custom rules or enable global rules.",
                0
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
                'llm_enhancement': True,
                'language_filtering_enabled': True,
                'initiated_by': user.id,
                'initiated_from': 'slack',
                'provider_type': provider_type
            }
        )
        
        db.add(new_scan)
        db.commit()
        db.refresh(new_scan)
        
        logger.info(f"✅ Created scan {new_scan.id} for repository {repository.full_name} (via Slack)")
        logger.info(f"📋 Using {len(rules_data)} rules ({global_count} global, {user_custom_count} custom)")
        
        # Start scan in background
        from app.api.v1.custom_scans import run_custom_scan_background
        import asyncio
        
        # Create background task
        asyncio.create_task(
            run_custom_scan_background(
                db=db,
                scan_id=new_scan.id,
                repository_id=repository.id,
                access_token=access_token,
                provider_type=provider_type,
                rules_data=rules_data,
                user_id=user.id,
                use_llm_enhancement=True
            )
        )
        
        return (
            True,
            f"Scan initiated successfully for {repository.full_name}",
            new_scan.id
        )
        
    except Exception as e:
        logger.error(f"❌ Error triggering scan from Slack: {e}", exc_info=True)
        return (
            False,
            f"Failed to start scan: {str(e)[:100]}",
            0
        )