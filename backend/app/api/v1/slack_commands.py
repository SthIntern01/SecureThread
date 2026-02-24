# backend/app/api/v1/slack_commands.py

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
import hashlib
import hmac
import logging
import os
from urllib.parse import parse_qs
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.models.repository import Repository

router = APIRouter()
logger = logging.getLogger(__name__)

SLACK_SIGNING_SECRET = os.getenv("SLACK_SIGNING_SECRET")


def verify_slack_signature(request_body: bytes, timestamp: str, signature: str) -> bool:
    """
    Verify that request came from Slack using signing secret.
    """
    if not SLACK_SIGNING_SECRET:
        logger.error("❌ SLACK_SIGNING_SECRET not configured")
        return False
    
    sig_basestring = f"v0:{timestamp}:{request_body.decode('utf-8')}"
    my_signature = 'v0=' + hmac.new(
        SLACK_SIGNING_SECRET.encode(),
        sig_basestring.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(my_signature, signature)


def get_user_from_slack_identity(
    slack_user_id: str,
    slack_team_id: str,
    db: Session
) -> Optional[User]:
    """
    Map Slack user to SecureThread user.
    """
    user = db.query(User).filter(
        User.slack_user_id == slack_user_id,
        User.slack_team_id == slack_team_id
    ).first()
    
    return user


@router.post("/commands")
async def handle_slack_command(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle Slack slash commands:
    - /securethread scan
    - /securethread repos
    - /securethread history
    """
    try:
        # Get request details
        body_bytes = await request.body()
        timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
        signature = request.headers.get("X-Slack-Signature", "")
        
        # Verify request is from Slack
        if not verify_slack_signature(body_bytes, timestamp, signature):
            logger.error("❌ Invalid Slack signature")
            raise HTTPException(status_code=403, detail="Invalid signature")
        
        # Parse form data
        body_str = body_bytes.decode('utf-8')
        parsed = parse_qs(body_str)
        
        # Extract command details
        command = parsed.get('command', [''])[0]  # e.g., "/securethread"
        text = parsed.get('text', [''])[0]  # e.g., "scan"
        slack_user_id = parsed.get('user_id', [''])[0]
        slack_team_id = parsed.get('team_id', [''])[0]
        trigger_id = parsed.get('trigger_id', [''])[0]
        
        logger.info(f"📥 Received command: {command} {text} from user {slack_user_id}")
        
        # Map Slack user to SecureThread user
        user = get_user_from_slack_identity(slack_user_id, slack_team_id, db)
        if not user:
            return {
                "response_type": "ephemeral",
                "text": "❌ Your Slack account is not connected to SecureThread. Please connect via the web app."
            }
        
        # Parse subcommand
        subcommand = text.strip().lower() if text else "help"
        
        # Dispatch to appropriate handler
        if subcommand == "scan":
            return await handle_scan_command(user, trigger_id, db)
        elif subcommand == "repos":
            return await handle_repos_command(user, db)
        elif subcommand == "history":
            return await handle_history_command(user, db)
        elif subcommand == "help" or subcommand == "":
            return handle_help_command()
        else:
            return {
                "response_type": "ephemeral",
                "text": f"❌ Unknown command: `{subcommand}`\n\nUse `/securethread help` to see available commands."
            }
        
    except Exception as e:
        logger.error(f"❌ Error handling Slack command: {e}", exc_info=True)
        return {
            "response_type": "ephemeral",
            "text": "❌ An error occurred processing your command."
        }


def handle_help_command():
    """Show help message"""
    return {
        "response_type": "ephemeral",
        "text": (
            "🔍 *SecureThread Commands*\n\n"
            "`/securethread scan` - Start a security scan\n"
            "`/securethread repos` - List your repositories\n"
            "`/securethread history` - Show recent scans\n"
            "`/securethread help` - Show this help message"
        )
    }


async def handle_scan_command(user: User, trigger_id: str, db: Session):
    """
    Handle /securethread scan command
    Opens a modal for repository selection
    """
    # Import here to avoid circular dependency
    from app.api.v1.slack_modals import open_scan_repository_modal
    from fastapi.responses import Response
    
    try:
        await open_scan_repository_modal(user, trigger_id, db)
        
        # ✅ Return empty 200 OK when opening modal (Slack requirement)
        return Response(status_code=200)
        
    except Exception as e:
        logger.error(f"Error opening scan modal: {e}")
        return {
            "response_type": "ephemeral",
            "text": "❌ Failed to open scan dialog. Please try again."
        }

async def handle_repos_command(user: User, db: Session):
    """
    Handle /securethread repos command
    Lists user's repositories (WORKSPACE-SCOPED)
    """
    # Get user's active workspace
    active_workspace_id = user.active_team_id
    
    if active_workspace_id:
        # Get repositories in active workspace
        from app.models.team_repository import TeamRepository
        
        workspace_repo_ids = db.query(TeamRepository.repository_id).filter(
            TeamRepository.team_id == active_workspace_id
        ).all()
        repo_ids = [r[0] for r in workspace_repo_ids]
        
        if not repo_ids:
            return {
                "response_type": "ephemeral",
                "text": "📂 No repositories in your active workspace.\n\nSwitch workspace or import repositories via the web app!"
            }
        
        repositories = db.query(Repository).filter(
            Repository.id.in_(repo_ids),
            Repository.owner_id == user.id
        ).order_by(Repository.full_name).all()
    else:
        # No active workspace - show all user's repositories
        repositories = db.query(Repository).filter(
            Repository.owner_id == user.id
        ).order_by(Repository.full_name).all()
    
    if not repositories:
        return {
            "response_type": "ephemeral",
            "text": "📂 You don't have any imported repositories yet.\n\nImport repositories via the web app to get started!"
        }
    
    # Build repository list
    repo_list = []
    for repo in repositories:
        status_emoji = "✅" if repo.is_active else "⚠️"
        repo_list.append(f"{status_emoji} `{repo.full_name}`")
    
    workspace_name = ""
    if active_workspace_id:
        from app.models.team import Team
        team = db.query(Team).filter(Team.id == active_workspace_id).first()
        workspace_name = f" (Workspace: {team.name})" if team else ""
    
    message = f"📂 *Your Repositories ({len(repositories)})*{workspace_name}\n\n" + "\n".join(repo_list)
    
    return {
        "response_type": "ephemeral",
        "text": message
    }


async def handle_history_command(user: User, db: Session):
    """
    Handle /securethread history command
    Shows recent scans
    """
    from app.models.vulnerability import Scan
    from datetime import datetime, timezone, timedelta
    
    # Get user's recent scans (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    scans = db.query(Scan).join(Repository).filter(
        Repository.owner_id == user.id,
        Scan.started_at >= seven_days_ago
    ).order_by(Scan.started_at.desc()).limit(10).all()
    
    if not scans:
        return {
            "response_type": "ephemeral",
            "text": "📊 No recent scans found.\n\nUse `/securethread scan` to start a new scan!"
        }
    
    # Build scan list
    scan_list = []
    for scan in scans:
        repo = db.query(Repository).filter(Repository.id == scan.repository_id).first()
        repo_name = repo.full_name if repo else "Unknown"
        
        status_emoji = {
            "completed": "✅",
            "failed": "❌",
            "running": "🔄",
            "pending": "⏳"
        }.get(scan.status, "⚪")
        
        scan_list.append(
            f"{status_emoji} {repo_name} - {scan.status} "
            f"({scan.total_vulnerabilities or 0} issues)"
        )
    
    message = f"📊 *Recent Scans*\n\n" + "\n".join(scan_list)
    
    return {
        "response_type": "ephemeral",
        "text": message
    }