# backend/app/api/v1/reports.py

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
import logging

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.pdf_report_service import PDFReportService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/{scan_id}/pdf")
async def generate_pdf_report(
    scan_id: int,
    report_type: str = "comprehensive",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate professional PDF security report
    
    - **scan_id**: ID of the completed scan
    - **report_type**: "comprehensive" or "executive" 
    """
    
    try:
        # Initialize PDF service
        pdf_service = PDFReportService()
        
        # Generate PDF
        pdf_content = await pdf_service.generate_security_report(
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

@router.get("/{scan_id}/preview")
async def preview_report_data(
    scan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Preview report data structure (for debugging)"""
    
    try:
        pdf_service = PDFReportService()
        
        # Get the data that would be used for PDF generation
        from app.models.vulnerability import Scan, Vulnerability
        from app.models.repository import Repository
        
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        repository = db.query(Repository).filter(Repository.id == scan.repository_id).first()
        if not repository or repository.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        vulnerabilities = db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).all()
        
        report_data = pdf_service._prepare_report_data(scan, repository, vulnerabilities, current_user)
        
        return {
            "scan_id": scan_id,
            "data_structure": {
                "metadata_keys": list(report_data["metadata"].keys()),
                "repository_keys": list(report_data["repository"].keys()),
                "scan_keys": list(report_data["scan"].keys()),
                "security_keys": list(report_data["security"].keys()),
                "vulnerabilities_count": len(report_data["vulnerabilities"]),
                "analysis_keys": list(report_data["analysis"].keys()),
                "recommendations_keys": list(report_data["recommendations"].keys())
            },
            "summary": {
                "total_vulnerabilities": report_data["security"]["total_vulnerabilities"],
                "risk_level": report_data["security"]["risk_level"],
                "security_score": report_data["security"]["security_score"]
            }
        }
        
    except Exception as e:
        logger.error(f"Error previewing report data for scan {scan_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to preview report data")