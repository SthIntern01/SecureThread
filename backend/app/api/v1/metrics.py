from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan, Vulnerability
from app.services.metrics_service import MetricsService
from pydantic import BaseModel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class MetricsRequest(BaseModel):
    repository_id: Optional[int] = None
    time_range: Optional[str] = "30d"  # 7d, 30d, 90d, 1y, all
    include_trends: Optional[bool] = True

@router.get("/security-overview")
async def get_security_overview(
    time_range: str = Query("30d", description="Time range: 1d, 7d, 30d, 90d, 180d, 1y, all"),
    repository_id: Optional[int] = Query(None, description="Filter by specific repository"),
    include_trends: bool = Query(True, description="Include trend analysis"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive security overview with metrics"""
    
    try:
        logger.info(f"📊 Metrics request from user {current_user.id}: time_range={time_range}, repo_id={repository_id}")
        
        metrics_service = MetricsService(db, current_user.id)
        
        # 🔧 FIX: Parse time filter correctly
        time_filter = metrics_service.parse_time_range(time_range)
        logger.info(f"📅 Parsed time filter: {time_filter}")
        
        # Calculate all metrics sections with consistent time filtering
        security_metrics = await metrics_service.calculate_security_metrics(repository_id, time_filter)
        code_quality_metrics = await metrics_service.calculate_code_quality_metrics(repository_id, time_filter)
        vulnerability_trends = await metrics_service.calculate_vulnerability_trends(repository_id, time_filter)
        compliance_scores = await metrics_service.calculate_compliance_scores(repository_id, time_filter)
        team_metrics = await metrics_service.calculate_team_metrics(repository_id, time_filter)
        
        logger.info(f"📈 Calculated metrics - Total vulnerabilities: {security_metrics.get('total_vulnerabilities')}")
        
        return {
            "user_id": current_user.id,
            "generated_at": datetime.utcnow().isoformat(),
            "time_range": time_range,
            "repository_filter": repository_id,
            "security_metrics": security_metrics,
            "code_quality_metrics": code_quality_metrics,
            "vulnerability_trends": vulnerability_trends,
            "compliance_scores": compliance_scores,
            "team_metrics": team_metrics
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating security metrics for user {current_user.id}: {e}")
        logger.exception("Full traceback:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate security metrics: {str(e)}"
        )

@router.get("/technical-debt")
async def get_technical_debt_metrics(
    repository_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get technical debt analysis"""
    try:
        metrics_service = MetricsService(db, current_user.id)
        return await metrics_service.calculate_technical_debt(repository_id)
    except Exception as e:
        logger.error(f"Error calculating technical debt: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate technical debt")

@router.get("/owasp-analysis")
async def get_owasp_analysis(
    repository_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get OWASP Top 10 analysis"""
    try:
        metrics_service = MetricsService(db, current_user.id)
        return await metrics_service.calculate_owasp_metrics(repository_id)
    except Exception as e:
        logger.error(f"Error calculating OWASP metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate OWASP metrics")

@router.get("/dependency-health")
async def get_dependency_health(
    repository_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dependency health analysis"""
    try:
        metrics_service = MetricsService(db, current_user.id)
        return await metrics_service.calculate_dependency_health(repository_id)
    except Exception as e:
        logger.error(f"Error calculating dependency health: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate dependency health")