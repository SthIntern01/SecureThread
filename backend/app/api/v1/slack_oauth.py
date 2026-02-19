"""
Slack OAuth Integration Endpoints
Handles OAuth flow for connecting user Slack accounts
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import httpx
import os
import logging

from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/slack/oauth", tags=["Slack OAuth"])

# Load Slack credentials from environment
SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID")
SLACK_CLIENT_SECRET = os.getenv("SLACK_CLIENT_SECRET")
SLACK_SIGNING_SECRET = os.getenv("SLACK_SIGNING_SECRET")

# Frontend URL for redirects
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
print(f"🔧🔧🔧 SLACK OAUTH LOADED - FRONTEND_URL = '{FRONTEND_URL}' 🔧🔧🔧")
logger.info(f"🔧 SLACK OAUTH: FRONTEND_URL = {FRONTEND_URL}")


@router.get("/initiate")
async def initiate_slack_oauth(
    current_user: User = Depends(get_current_active_user)
):
    """
    Step 1: Initiate Slack OAuth flow
    Redirects user to Slack authorization page
    """
    try:
        if not SLACK_CLIENT_ID:
            raise HTTPException(status_code=500, detail="Slack OAuth not configured")
        
        # Build OAuth URL
        redirect_uri = f"{os.getenv('BACKEND_URL', 'https://2l577wm4-8000.inc1.devtunnels.ms')}/api/v1/slack/oauth/callback"
        
        # Scopes needed for bot functionality
        scopes = [
            "chat:write",           # Send messages
            "chat:write.public",    # Send to public channels
            "commands",             # Slash commands
            "incoming-webhook",     # Webhook posting
            "channels:read",        # View channels
            "users:read",           # Get user info
            "im:write",             # Send DMs
        ]
        
        scope_string = ",".join(scopes)
        
        # State parameter for security (store user_id to link back after OAuth)
        state = f"user_{current_user.id}"
        
        oauth_url = (
            f"https://slack.com/oauth/v2/authorize"
            f"?client_id={SLACK_CLIENT_ID}"
            f"&scope={scope_string}"
            f"&redirect_uri={redirect_uri}"
            f"&state={state}"
        )
        
        logger.info(f"🔗 User {current_user.id} initiating Slack OAuth")
        
        return {"oauth_url": oauth_url}
        
    except Exception as e:
        logger.error(f"Error initiating Slack OAuth: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
async def slack_oauth_callback(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None,
    db: Session = Depends(get_db)
):
    """
    Step 2: Handle OAuth callback from Slack
    Exchange code for access token and save to database
    """
    try:
        # Check for OAuth errors
        if error:
            logger.error(f"Slack OAuth error: {error}")
            redirect_url = f"{FRONTEND_URL}/integrations?slack_error={error}"
            print(f"🔗 ERROR REDIRECT TO: {redirect_url}")
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Redirecting...</title>
                <script>
                    window.location.href = "{redirect_url}";
                </script>
            </head>
            <body>
                <p>Error connecting Slack... Redirecting...</p>
                <p>If you are not redirected automatically, <a href="{redirect_url}">click here</a>.</p>
            </body>
            </html>
            """
            return HTMLResponse(content=html_content)
        
        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state")
        
        # Extract user_id from state
        if not state.startswith("user_"):
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        user_id = int(state.replace("user_", ""))
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Exchange code for token
        redirect_uri = f"{os.getenv('BACKEND_URL', 'https://2l577wm4-8000.inc1.devtunnels.ms')}/api/v1/slack/oauth/callback"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://slack.com/api/oauth.v2.access",
                data={
                    "client_id": SLACK_CLIENT_ID,
                    "client_secret": SLACK_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": redirect_uri
                }
            )
            
            oauth_data = response.json()
            
            if not oauth_data.get("ok"):
                error_msg = oauth_data.get("error", "Unknown error")
                logger.error(f"Slack OAuth token exchange failed: {error_msg}")
                return RedirectResponse(
                    url=f"{FRONTEND_URL}/integrations?slack_error={error_msg}"
                )
            
            # Extract tokens and info
            access_token = oauth_data.get("access_token")
            bot_token = oauth_data.get("access_token")  # In v2, access_token IS the bot token
            team_id = oauth_data.get("team", {}).get("id")
            team_name = oauth_data.get("team", {}).get("name")
            
            # Get webhook info if available
            incoming_webhook = oauth_data.get("incoming_webhook", {})
            channel_id = incoming_webhook.get("channel_id")
            channel_name = incoming_webhook.get("channel")
            
            # Get authed user info
            authed_user = oauth_data.get("authed_user", {})
            slack_user_id = authed_user.get("id")
            
            # Save to database
            user.slack_user_id = slack_user_id
            user.slack_team_id = team_id
            user.slack_bot_token = bot_token
            user.slack_access_token = access_token
            user.slack_workspace_name = team_name
            user.slack_channel_id = channel_id
            user.slack_channel_name = channel_name
            user.slack_connected_at = datetime.now(timezone.utc)
            
            db.commit()
            
            logger.info(f"✅ User {user_id} successfully connected Slack workspace: {team_name}")

            # Redirect to frontend with success using HTML meta refresh (bypasses proxy rewriting)
            redirect_url = f"{FRONTEND_URL}/integrations?slack_connected=true"
            logger.info(f"🔗🔗🔗 REDIRECTING TO: {redirect_url} 🔗🔗🔗")
            print(f"🔗🔗🔗 REDIRECTING TO: {redirect_url} 🔗🔗🔧")

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Redirecting...</title>
                <script>
                    window.location.href = "{redirect_url}";
                </script>
            </head>
            <body>
                <p>Connecting Slack... Redirecting to SecureThread...</p>
                <p>If you are not redirected automatically, <a href="{redirect_url}">click here</a>.</p>
            </body>
            </html>
            """
            return HTMLResponse(content=html_content)
    
    except Exception as e:
        logger.error(f"Error in Slack OAuth callback: {e}", exc_info=True)
        redirect_url = f"{FRONTEND_URL}/integrations?slack_error=connection_failed"
        print(f"🔗 EXCEPTION REDIRECT TO: {redirect_url}")
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Redirecting...</title>
            <script>
                window.location.href = "{redirect_url}";
            </script>
        </head>
        <body>
            <p>Error connecting Slack... Redirecting...</p>
            <p>If you are not redirected automatically, <a href="{redirect_url}">click here</a>.</p>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)

@router.post("/disconnect")
async def disconnect_slack(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Disconnect user's Slack account
    Removes all Slack OAuth data
    """
    try:
        # Clear all Slack fields
        current_user.slack_user_id = None
        current_user.slack_team_id = None
        current_user.slack_bot_token = None
        current_user.slack_access_token = None
        current_user.slack_workspace_name = None
        current_user.slack_channel_id = None
        current_user.slack_channel_name = None
        current_user.slack_connected_at = None
        
        db.commit()
        
        logger.info(f"✅ User {current_user.id} disconnected Slack")
        
        return {
            "success": True,
            "message": "Slack account disconnected successfully"
        }
        
    except Exception as e:
        logger.error(f"Error disconnecting Slack: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_slack_connection_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current Slack connection status for user
    """
    is_connected = bool(current_user.slack_team_id and current_user.slack_bot_token)
    
    return {
        "connected": is_connected,
        "workspace_name": current_user.slack_workspace_name if is_connected else None,
        "channel_name": current_user.slack_channel_name if is_connected else None,
        "connected_at": current_user.slack_connected_at.isoformat() if current_user.slack_connected_at else None
    }