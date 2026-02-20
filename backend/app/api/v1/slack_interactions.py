# backend/app/api/v1/slack_interactions.py

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import hashlib
import hmac
import json
import logging
import os
import httpx
from urllib.parse import parse_qs
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.models.vulnerability import Scan, Vulnerability
from app.models.repository import Repository
from app.models.team import Team, TeamMember
from app.services.slack_service import slack_service

router = APIRouter()
logger = logging.getLogger(__name__)

SLACK_SIGNING_SECRET = os.getenv("SLACK_SIGNING_SECRET")


def verify_slack_signature(request_body: bytes, timestamp: str, signature: str) -> bool:
    """
    Verify that request came from Slack using signing secret.
    https://api.slack.com/authentication/verifying-requests-from-slack
    """
    if not SLACK_SIGNING_SECRET:
        logger.error("❌ SLACK_SIGNING_SECRET not configured")
        return False
    
    # Create signature base string
    sig_basestring = f"v0:{timestamp}:{request_body.decode('utf-8')}"
    
    # Create signature
    my_signature = 'v0=' + hmac.new(
        SLACK_SIGNING_SECRET.encode(),
        sig_basestring.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Compare signatures (constant time comparison)
    return hmac.compare_digest(my_signature, signature)


def get_user_from_slack_identity(
    slack_user_id: str,
    slack_team_id: str,
    db: Session
) -> Optional[User]:
    """
    Map Slack user to SecureThread user.
    Returns None if no mapping found.
    """
    user = db.query(User).filter(
        User.slack_user_id == slack_user_id,
        User.slack_team_id == slack_team_id
    ).first()
    
    return user


@router.post("/interactions")
async def handle_slack_interaction(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle all Slack interactive components:
    - Button clicks
    - Select menus
    - Modal submissions
    """
    try:
        # Get request details
        body_bytes = await request.body()
        timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
        signature = request.headers.get("X-Slack-Signature", "")
        
        # ✅ Verify request is from Slack
        if not verify_slack_signature(body_bytes, timestamp, signature):
            logger.error("❌ Invalid Slack signature - potential security threat")
            raise HTTPException(status_code=403, detail="Invalid signature")
        
        logger.info("✅ Slack signature verified")
        
        # Parse payload
        body_str = body_bytes.decode('utf-8')
        parsed = parse_qs(body_str)
        payload_json = parsed.get('payload', [''])[0]
        payload = json.loads(payload_json)
        
        # Log the interaction for debugging
        logger.info(f"📥 Received Slack interaction: {payload.get('type')}")
        
        # Extract common fields
        interaction_type = payload.get("type")
        slack_user_id = payload["user"]["id"]
        slack_team_id = payload["team"]["id"]
        
        # ✅ Map Slack user to SecureThread user
        user = get_user_from_slack_identity(slack_user_id, slack_team_id, db)
        if not user:
            logger.error(f"❌ No SecureThread user found for Slack user {slack_user_id}")
            return {
                "text": "❌ Your Slack account is not connected to SecureThread. Please connect via the web app."
            }
        
        logger.info(f"✅ Slack user mapped to SecureThread user {user.id} ({user.email})")
        
        # Dispatch based on interaction type
        if interaction_type == "block_actions":
            return await handle_block_action(payload, user, db)
        elif interaction_type == "view_submission":
            return await handle_modal_submission(payload, user, db)
        else:
            logger.warning(f"⚠️ Unknown interaction type: {interaction_type}")
            return {"text": "Unknown interaction type"}
        
    except Exception as e:
        logger.error(f"❌ Error handling Slack interaction: {e}", exc_info=True)
        return {"text": "❌ An error occurred processing your request."}


async def handle_block_action(payload: dict, user: User, db: Session):
    """
    Handle button clicks and select menu actions.
    """
    actions = payload.get("actions", [])
    if not actions:
        return {}
    
    action = actions[0]
    action_id = action.get("action_id")
    
    logger.info(f"🔘 Button clicked: {action_id} by user {user.id}")
    
    # ✅ Dispatch to specific handlers (Phase 2 will implement these)
    if action_id == "view_top_3":
        return await handle_view_top_vulnerabilities(payload, user, db, limit=3)
    elif action_id == "view_top_10":
        return await handle_view_top_vulnerabilities(payload, user, db, limit=10)
    elif action_id == "view_critical_only":
        return await handle_view_critical_vulnerabilities(payload, user, db)
    elif action_id.startswith("vuln_details_"):
        return await handle_vulnerability_details(payload, user, db, action_id)
    elif action_id == "open_in_app":
        # URL button - no action needed
        return {}
    else:
        logger.warning(f"⚠️ Unknown action_id: {action_id}")
        return {}


async def handle_modal_submission(payload: dict, user: User, db: Session):
    """
    Handle modal form submissions (Phase 4 & 5 will implement this).
    """
    callback_id = payload["view"]["callback_id"]
    logger.info(f"📝 Modal submitted: {callback_id} by user {user.id}")
    
    # TODO: Implement in Phase 4 & 5
    return {}


# ═══════════════════════════════════════════════════════════════════════════
# PLACEHOLDER HANDLERS (Phase 2 will implement these)
# ═══════════════════════════════════════════════════════════════════════════

async def handle_view_top_vulnerabilities(
    payload: dict,
    user: User,
    db: Session,
    limit: int
):
    """
    User clicked "View Top N" button in channel.
    Send DM with top N vulnerabilities.
    """
    try:
        # Extract scan_id from button value
        scan_id = int(payload["actions"][0].get("value", 0))
        
        if not scan_id:
            await slack_service.send_dm_to_user(
                user=user,
                text="❌ Unable to retrieve scan details."
            )
            return {}
        
        logger.info(f"📊 Fetching top {limit} vulnerabilities for scan {scan_id}")
        
        # Fetch scan
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            await slack_service.send_dm_to_user(
                user=user,
                text=f"❌ Scan #{scan_id} not found."
            )
            return {}
        
        # Get repository for authorization check
        repository = db.query(Repository).filter(
            Repository.id == scan.repository_id
        ).first()
        
        if not repository:
            await slack_service.send_dm_to_user(
                user=user,
                text=f"❌ Repository not found for scan #{scan_id}."
            )
            return {}
        
        # ✅ Simple authorization: user must own the repository
        # (Phase 3 will add team-based authorization)
        if repository.owner_id != user.id:
            await slack_service.send_dm_to_user(
                user=user,
                text="❌ You don't have access to this scan."
            )
            return {}
        
        # Get top N vulnerabilities
        vulns = db.query(Vulnerability).filter(
            Vulnerability.scan_id == scan_id
        ).order_by(
            Vulnerability.risk_score.desc()
        ).limit(limit).all()
        
        if not vulns:
            await slack_service.send_dm_to_user(
                user=user,
                text=f"✅ No vulnerabilities found in scan #{scan_id}!"
            )
            return {}
        
        # Build DM message with vulnerability list
        blocks = build_vulnerability_list_blocks(
            vulns=vulns,
            scan_id=scan_id,
            repository_name=repository.full_name,
            limit=limit
        )
        
        await slack_service.send_dm_to_user(
            user=user,
            text=f"Top {limit} vulnerabilities from scan #{scan_id}",
            blocks=blocks
        )
        
        logger.info(f"✅ Sent {len(vulns)} vulnerabilities to user {user.id} via DM")
        
        # Acknowledge the button click
        return {}
        
    except Exception as e:
        logger.error(f"❌ Error sending vulnerability list: {e}", exc_info=True)
        await slack_service.send_dm_to_user(
            user=user,
            text="❌ An error occurred while fetching vulnerabilities."
        )
        return {}

def build_vulnerability_list_blocks(
        vulns: list,
        scan_id: int,
        repository_name: str,
        limit: int
    ) -> list:
        """
        Build Block Kit blocks for vulnerability list.
        """
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🔍 Top {limit} Vulnerabilities",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Repository:* {repository_name}\n*Scan ID:* #{scan_id}"
                }
            },
            {"type": "divider"}
        ]
        
        for idx, vuln in enumerate(vulns, 1):
            severity_emoji = {
                "critical": "🔴",
                "high": "🟠",
                "medium": "🟡",
                "low": "🟢"
            }.get(vuln.severity.lower(), "⚪")
            
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": (
                        f"{severity_emoji} *{idx}. {vuln.title}*\n"
                        f"📁 `{vuln.file_path}`"
                        f"{f':{vuln.line_number}' if vuln.line_number else ''}\n"
                        f"_{vuln.category}_ • Severity: *{vuln.severity.upper()}*"
                    )
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Details",
                        "emoji": True
                    },
                    "action_id": f"vuln_details_{vuln.id}",
                    "value": str(vuln.id)
                }
            })
        
        blocks.append({"type": "divider"})
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"📊 Showing {len(vulns)} of {len(vulns)} vulnerabilities"
                }
            ]
        })
        
        return blocks

async def handle_view_critical_vulnerabilities(
        payload: dict,
        user: User,
        db: Session
    ):
        """
        User clicked "Critical Only" button.
        Send DM with only CRITICAL severity vulnerabilities.
        """
        try:
            # Extract scan_id from button value
            scan_id = int(payload["actions"][0].get("value", 0))
            
            if not scan_id:
                await slack_service.send_dm_to_user(
                    user=user,
                    text="❌ Unable to retrieve scan details."
                )
                return {}
            
            logger.info(f"🚨 Fetching critical vulnerabilities for scan {scan_id}")
            
            # Fetch scan
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if not scan:
                await slack_service.send_dm_to_user(
                    user=user,
                    text=f"❌ Scan #{scan_id} not found."
                )
                return {}
            
            # Get repository for authorization check
            repository = db.query(Repository).filter(
                Repository.id == scan.repository_id
            ).first()
            
            if not repository:
                await slack_service.send_dm_to_user(
                    user=user,
                    text=f"❌ Repository not found for scan #{scan_id}."
                )
                return {}
            
            # Authorization check
            if repository.owner_id != user.id:
                await slack_service.send_dm_to_user(
                    user=user,
                    text="❌ You don't have access to this scan."
                )
                return {}
            
            # Get ONLY critical vulnerabilities
            vulns = db.query(Vulnerability).filter(
                Vulnerability.scan_id == scan_id,
                Vulnerability.severity.ilike("critical")  # Case-insensitive match
            ).order_by(
                Vulnerability.risk_score.desc()
            ).all()
            
            if not vulns:
                await slack_service.send_dm_to_user(
                    user=user,
                    text=f"✅ No critical vulnerabilities found in scan #{scan_id}! 🎉"
                )
                return {}
            
            # Build DM message with critical vulnerabilities
            blocks = build_vulnerability_list_blocks(
                vulns=vulns,
                scan_id=scan_id,
                repository_name=repository.full_name,
                limit=len(vulns)  # Show all critical ones
            )
            
            # Update header to show "Critical Vulnerabilities"
            blocks[0] = {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🔴 Critical Vulnerabilities ({len(vulns)})",
                    "emoji": True
                }
            }
            
            await slack_service.send_dm_to_user(
                user=user,
                text=f"Critical vulnerabilities from scan #{scan_id}",
                blocks=blocks
            )
            
            logger.info(f"✅ Sent {len(vulns)} critical vulnerabilities to user {user.id} via DM")
            
            return {}
            
        except Exception as e:
            logger.error(f"❌ Error sending critical vulnerabilities: {e}", exc_info=True)
            await slack_service.send_dm_to_user(
                user=user,
                text="❌ An error occurred while fetching critical vulnerabilities."
            )
            return {}


async def handle_vulnerability_details(
        payload: dict,
        user: User,
        db: Session,
        action_id: str
    ):
        """
        User clicked "Details" button on a vulnerability.
        Open a modal with full vulnerability details.
        """
        try:
            # Extract vulnerability ID from action_id
            vuln_id = int(action_id.replace("vuln_details_", ""))
            logger.info(f"🔍 User {user.id} requested details for vulnerability {vuln_id}")
            
            # Fetch vulnerability
            vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
            if not vuln:
                logger.error(f"❌ Vulnerability {vuln_id} not found")
                return {
                    "text": "❌ Vulnerability not found."
                }
            
            # Get scan and repository for authorization
            scan = db.query(Scan).filter(Scan.id == vuln.scan_id).first()
            if not scan:
                logger.error(f"❌ Scan not found for vulnerability {vuln_id}")
                return {
                    "text": "❌ Scan not found."
                }
            
            repository = db.query(Repository).filter(
                Repository.id == scan.repository_id
            ).first()
            if not repository:
                logger.error(f"❌ Repository not found for scan {scan.id}")
                return {
                    "text": "❌ Repository not found."
                }
            
            # Authorization check
            if repository.owner_id != user.id:
                logger.warning(f"⚠️ User {user.id} attempted to access vulnerability {vuln_id} without authorization")
                return {
                    "text": "❌ You don't have access to this vulnerability."
                }
            
            # Build modal
            modal = build_vulnerability_modal(
                vuln=vuln,
                repository_name=repository.full_name
            )
            
            # Open the modal using Slack API
            trigger_id = payload.get("trigger_id")
            if not trigger_id:
                logger.error("❌ No trigger_id in payload - cannot open modal")
                return {
                    "text": "❌ Unable to open modal (missing trigger_id)"
                }
            
            # Call Slack's views.open API
            success = await open_slack_modal(
                bot_token=user.slack_bot_token,
                trigger_id=trigger_id,
                view=modal
            )
            
            if success:
                logger.info(f"✅ Modal opened for vulnerability {vuln_id}")
                return {}
            else:
                logger.error(f"❌ Failed to open modal for vulnerability {vuln_id}")
                return {
                    "text": "❌ Failed to open vulnerability details."
                }
            
        except Exception as e:
            logger.error(f"❌ Error opening vulnerability details: {e}", exc_info=True)
            return {
                "text": "❌ An error occurred while loading vulnerability details."
            }


async def open_slack_modal(
        bot_token: str,
        trigger_id: str,
        view: dict
    ) -> bool:
        """
        Open a Slack modal using views.open API.
        
        Args:
            bot_token: User's Slack bot token
            trigger_id: Trigger ID from the interaction payload
            view: Modal view structure
        
        Returns:
            True if successful, False otherwise
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
                    logger.info(f"✅ Modal opened successfully")
                    return True
                else:
                    error = data.get("error", "Unknown error")
                    logger.error(f"❌ Slack API error opening modal: {error}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Failed to open modal: {e}")
            return False

def build_vulnerability_modal(
    vuln: Vulnerability,
    repository_name: str
) -> dict:
    """
    Build a Slack modal view for vulnerability details.
    Uses Slack's Block Kit modal structure.
    """
    # Severity emoji
    severity_emoji = {
        "critical": "🔴",
        "high": "🟠",
        "medium": "🟡",
        "low": "🟢"
    }.get(vuln.severity.lower(), "⚪")
    
    # Build location text
    location = f"`{vuln.file_path}`"
    if vuln.line_number:
        location += f" at line {vuln.line_number}"
    
    # Build blocks for modal body
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"{severity_emoji} {vuln.title}",
                "emoji": True
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Repository:*\n{repository_name}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Severity:*\n{severity_emoji} {vuln.severity.upper()}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Category:*\n{vuln.category}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Risk Score:*\n{vuln.risk_score}/10"
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Location:*\n{location}"
            }
        },
        {"type": "divider"}
    ]
    
    # Add description (safe access)
    description = getattr(vuln, 'description', None)
    if description:
        desc_text = description[:3000]  # Slack has character limits
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Description:*\n{desc_text}"
            }
        })
    
    # Add AI-enhanced explanation if available (safe access)
    ai_explanation = getattr(vuln, 'ai_explanation', None)
    if ai_explanation:
        explanation = ai_explanation[:3000]
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*💡 AI Analysis:*\n{explanation}"
            }
        })
    
    # Add code snippet if available (safe access)
    code_snippet = getattr(vuln, 'code_snippet', None)
    if code_snippet:
        snippet = code_snippet[:500]
        if len(code_snippet) > 500:
            snippet += "\n... (truncated)"
        
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Vulnerable Code:*\n```\n{snippet}\n```"
            }
        })
    
    blocks.append({"type": "divider"})
    
    # Add remediation (safe access)
    remediation = getattr(vuln, 'remediation', None)
    if remediation:
        rem_text = remediation[:3000]
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*🛠️ How to Fix:*\n{rem_text}"
            }
        })
    
    # Add AI-enhanced remediation if available (safe access)
    ai_remediation = getattr(vuln, 'ai_remediation', None)
    if ai_remediation:
        ai_rem_text = ai_remediation[:3000]
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*🤖 AI-Suggested Fix:*\n{ai_rem_text}"
            }
        })
    
    # Add CWE/OWASP if available (safe access)
    references = []
    cwe_id = getattr(vuln, 'cwe_id', None)
    owasp_category = getattr(vuln, 'owasp_category', None)
    if cwe_id:
        references.append(f"*CWE:* {cwe_id}")
    if owasp_category:
        references.append(f"*OWASP:* {owasp_category}")
    
    if references:
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": " | ".join(references)
                }
            ]
        })
    
    # Build the modal
    modal = {
        "type": "modal",
        "title": {
            "type": "plain_text",
            "text": "Vulnerability Details",
            "emoji": True
        },
        "close": {
            "type": "plain_text",
            "text": "Close",
            "emoji": True
        },
        "blocks": blocks
    }
    
    return modal