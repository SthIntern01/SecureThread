# backend/app/api/v1/slack_webhooks.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.slack_service import slack_service
from pydantic import BaseModel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class SlackTestResponse(BaseModel):
    success: bool
    message: str


@router.post("/test", response_model=SlackTestResponse)
async def test_slack_connection(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Test Slack integration by sending a test message
    """
    try:
        success = await slack_service.send_test_message()
        
        if success:
            return SlackTestResponse(
                success=True,
                message="✅ Test message sent to Slack successfully!"
            )
        else:
            return SlackTestResponse(
                success=False,
                message="❌ Failed to send message to Slack. Check logs."
            )
            
    except Exception as e:
        logger.error(f"Error testing Slack: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-public")
async def test_slack_public():
    """
    Public test endpoint (no authentication required)
    Use this for initial testing
    """
    try:
        success = await slack_service.send_test_message()
        
        return {
            "success": success,
            "message": "Test message sent!" if success else "Failed to send message"
        }
            
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"success": False, "error": str(e)}