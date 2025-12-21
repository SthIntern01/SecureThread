from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.llm_service import LLMService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/fix-file")
async def get_ai_fix_for_file(
    request: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated fix for all vulnerabilities in a file"""
    
    file_path = request.get("file_path")
    content = request.get("content")
    vulnerabilities = request.get("vulnerabilities", [])
    
    if not file_path or not content:
        raise HTTPException(
            status_code=400,
            detail="file_path and content are required"
        )
    
    try:
        llm_service = LLMService()
        
        # Build prompt
        vuln_list = "\n".join([
            f"- Line {v.get('line', 'unknown')}: {v.get('title', 'Unknown')} ({v.get('severity', 'unknown')})"
            for v in vulnerabilities
        ])
        
        prompt = f"""Fix all security vulnerabilities in this code file. 

File: {file_path}

Vulnerabilities to fix: 
{vuln_list}

Original Code:
{content}

Please provide the COMPLETE fixed code with all vulnerabilities resolved. Return ONLY the code, no explanations."""
        
        fixed_code = llm_service.get_completion(prompt)
        
        # Clean up response (remove markdown code blocks if present)
        if fixed_code.startswith("```"):
            lines = fixed_code.split("\n")
            fixed_code = "\n".join(lines[1:-1])  # Remove first and last lines
        
        return {
            "fixed_content": fixed_code,
            "file_path": file_path
        }
        
    except Exception as e:
        logger.error(f"Error getting AI fix: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate AI fix: {str(e)}"
        )