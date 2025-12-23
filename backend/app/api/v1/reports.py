# backend/app/api/v1/reports.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import logging

from app.core.database import get_db
from app. api.deps import get_current_active_user
from app.models.user import User
from app.services.latex_report_service import LaTeXReportService  # Updated import

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
    Generate professional PDF security report using LaTeX
    """
    
    try:
        # Initialize LaTeX service
        latex_service = LaTeXReportService()
        
        # Generate PDF
        pdf_content = await latex_service.generate_security_report(
            scan_id=scan_id,
            db=db,
            user=current_user,
            report_type=report_type
        )
        
        # Prepare response
        filename = f"secure-code-review-{scan_id}.pdf"
        
        return StreamingResponse(
            io. BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(pdf_content))
            }
        )
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating PDF report: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF report"
        )