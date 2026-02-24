# backend/app/api/v1/slack_modals.py

import httpx
import logging
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan

logger = logging.getLogger(__name__)


async def open_scan_repository_modal(
    user: User,
    trigger_id: str,
    db: Session
):
    """
    Open modal for repository selection and scan initiation
    (WORKSPACE-SCOPED)
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
            await _open_no_repositories_modal(user, trigger_id)
            return
        
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
        # No repositories - show error modal
        await _open_no_repositories_modal(user, trigger_id)
        return
    
    # Build repository options with metadata
    repo_options = []
    for repo in repositories:
        # Get latest scan for this repo
        latest_scan = db.query(Scan).filter(
            Scan.repository_id == repo.id
        ).order_by(Scan.started_at.desc()).first()
        
        # Build option label with metadata
        option_text = _build_repository_option_text(repo, latest_scan)
        
        repo_options.append({
            "text": {
                "type": "plain_text",
                "text": option_text,
                "emoji": True
            },
            "value": str(repo.id)
        })
    
    # Build modal view
    modal_view = {
        "type": "modal",
        "callback_id": "scan_repository_modal",
        "title": {
            "type": "plain_text",
            "text": "🔍 Start Security Scan",
            "emoji": True
        },
        "submit": {
            "type": "plain_text",
            "text": "Start Scan",
            "emoji": True
        },
        "close": {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": True
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Select a repository to scan:*"
                }
            },
            {
                "type": "input",
                "block_id": "repository_select_block",
                "element": {
                    "type": "static_select",
                    "action_id": "repository_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Choose a repository...",
                        "emoji": True
                    },
                    "options": repo_options
                },
                "label": {
                    "type": "plain_text",
                    "text": "Repository",
                    "emoji": True
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": (
                        "*Scan Options:*\n"
                        "• Uses global + custom rules\n"
                        "• AI-enhanced explanations\n"
                        "• Results sent via DM\n"
                        "• Estimated time: 2-5 minutes"
                    )
                }
            }
        ]
    }
    
    # Open the modal
    await _open_slack_modal(user.slack_bot_token, trigger_id, modal_view)


def _build_repository_option_text(repo: Repository, latest_scan: Optional[Scan]) -> str:
    """
    Build display text for repository option
    Shows: repo name + last scan info
    """
    base_text = repo.full_name
    
    if not latest_scan:
        return f"🔴 {base_text} (Never scanned)"
    
    # Calculate time since last scan
    now = datetime.now(timezone.utc)
    if latest_scan.started_at.tzinfo is None:
        scan_time = latest_scan.started_at.replace(tzinfo=timezone.utc)
    else:
        scan_time = latest_scan.started_at
    
    time_diff = now - scan_time
    
    # Format time ago
    if time_diff.days > 0:
        time_ago = f"{time_diff.days}d ago"
    elif time_diff.seconds >= 3600:
        hours = time_diff.seconds // 3600
        time_ago = f"{hours}h ago"
    else:
        minutes = time_diff.seconds // 60
        time_ago = f"{minutes}m ago"
    
    # Determine status emoji
    if latest_scan.security_score:
        score = latest_scan.security_score
        if score >= 85:
            emoji = "✅"
        elif score >= 70:
            emoji = "🟡"
        else:
            emoji = "⚠️"
        
        return f"{emoji} {base_text} ({time_ago}, Score: {int(score)})"
    else:
        return f"⚪ {base_text} ({time_ago})"


async def _open_no_repositories_modal(user: User, trigger_id: str):
    """
    Show modal when user has no repositories
    """
    modal_view = {
        "type": "modal",
        "callback_id": "no_repositories_modal",
        "title": {
            "type": "plain_text",
            "text": "No Repositories",
            "emoji": True
        },
        "close": {
            "type": "plain_text",
            "text": "Close",
            "emoji": True
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": (
                        "📂 *No repositories found*\n\n"
                        "You need to import repositories before scanning.\n\n"
                        "Go to the SecureThread web app to import your repositories from GitHub, "
                        "GitLab, or Bitbucket."
                    )
                }
            }
        ]
    }
    
    await _open_slack_modal(user.slack_bot_token, trigger_id, modal_view)


async def _open_slack_modal(
    bot_token: str,
    trigger_id: str,
    view: dict
) -> bool:
    """
    Open a Slack modal using views.open API
    """
    try:
        headers = {
            "Authorization": f"Bearer {bot_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "trigger_id": trigger_id,
            "view": view
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://slack.com/api/views.open",
                headers=headers,
                json=payload
            )
            
            data = response.json()
            if data.get("ok"):
                logger.info("✅ Modal opened successfully")
                return True
            else:
                error = data.get("error", "Unknown error")
                logger.error(f"❌ Slack API error opening modal: {error}")
                return False
                
    except Exception as e:
        logger.error(f"❌ Failed to open modal: {e}")
        return False