# backend/app/services/slack_service.py

import httpx
import logging
import os
from typing import Optional, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class SlackService:
    """Service for sending notifications to Slack"""
    
    def __init__(self):
        # ✅ Global webhook (optional - for admin/system notifications)
        self.global_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        
        if self.global_webhook_url:
            logger.info(f"✅ Global Slack webhook loaded: {self.global_webhook_url[:40]}...")
        else:
            logger.warning("⚠️ Global SLACK_WEBHOOK_URL not set")
    
    
    async def send_message_to_webhook(
        self, 
        webhook_url: str, 
        text: str, 
        blocks: Optional[list] = None
    ) -> bool:
        """
        Send message using webhook URL
        
        Args:
            webhook_url: Slack webhook URL
            text: Plain text message (fallback)
            blocks: Rich formatting blocks (optional)
        
        Returns:
            True if successful, False otherwise
        """
        if not webhook_url:
            logger.error("❌ Webhook URL not provided")
            return False
            
        try:
            payload = {"text": text}
            if blocks:
                payload["blocks"] = blocks
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(webhook_url, json=payload)
                
                if response.status_code == 200:
                    logger.info(f"✅ Slack message sent successfully")
                    return True
                else:
                    logger.error(f"❌ Slack API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Failed to send Slack message: {str(e)}")
            return False
    
    
    async def send_message_with_bot_token(
        self,
        bot_token: str,
        channel: str,
        text: str,
        blocks: Optional[list] = None
    ) -> bool:
        """
        Send message using bot token (more powerful - can send to any channel)
        
        Args:
            bot_token: Slack bot token (from OAuth)
            channel: Channel ID or name (e.g., "C1234567890" or "#security-alerts")
            text: Plain text message
            blocks: Rich formatting blocks (optional)
        
        Returns:
            True if successful, False otherwise
        """
        if not bot_token or not channel:
            logger.error("❌ Bot token or channel not provided")
            return False
        
        try:
            payload = {
                "channel": channel,
                "text": text,
            }
            if blocks:
                payload["blocks"] = blocks
            
            headers = {
                "Authorization": f"Bearer {bot_token}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://slack.com/api/chat.postMessage",
                    json=payload,
                    headers=headers
                )
                
                data = response.json()
                
                if data.get("ok"):
                    logger.info(f"✅ Slack message sent to {channel}")
                    return True
                else:
                    error = data.get("error", "Unknown error")
                    logger.error(f"❌ Slack API error: {error}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Failed to send Slack message: {str(e)}")
            return False
    
    
    async def send_notification_to_user(
        self,
        user,
        text: str,
        blocks: Optional[list] = None
    ) -> bool:
        """
        Send notification to a specific user's connected Slack workspace
        
        Args:
            user: User model instance (must have slack_bot_token and slack_channel_id)
            text: Plain text message
            blocks: Rich formatting blocks (optional)
        
        Returns:
            True if successful, False otherwise
        """
        # Check if user has Slack connected
        if not user.slack_bot_token:
            logger.warning(f"⚠️ User {user.id} doesn't have Slack connected - skipping notification")
            return False
        
        # Get channel (use default channel from OAuth or fallback)
        channel = user.slack_channel_id or "#general"
        
        logger.info(f"📤 Sending Slack notification to user {user.id} ({user.email})")
        
        return await self.send_message_with_bot_token(
            bot_token=user.slack_bot_token,
            channel=channel,
            text=text,
            blocks=blocks
        )
    

    async def send_dm_to_user(
        self,
        user,
        text: str,
        blocks: Optional[list] = None
    ) -> bool:
        """
        Send a Direct Message (DM) to a user's Slack account.
        Opens a DM conversation and posts a message.
        
        Args:
            user: User model instance (must have slack_bot_token and slack_user_id)
            text: Plain text message
            blocks: Rich formatting blocks (optional)
        
        Returns:
            True if successful, False otherwise
        """
        if not user.slack_bot_token or not user.slack_user_id:
            logger.warning(f"⚠️ User {user.id} doesn't have Slack connected properly")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {user.slack_bot_token}",
                "Content-Type": "application/json"
            }
            
            # Step 1: Open DM conversation with the user
            async with httpx.AsyncClient(timeout=10.0) as client:
                conv_response = await client.post(
                    "https://slack.com/api/conversations.open",
                    headers=headers,
                    json={"users": user.slack_user_id}
                )
                
                conv_data = conv_response.json()
                if not conv_data.get("ok"):
                    logger.error(f"❌ Failed to open DM: {conv_data.get('error')}")
                    return False
                
                dm_channel = conv_data["channel"]["id"]
                logger.info(f"✅ Opened DM channel {dm_channel} for user {user.id}")
                
                # Step 2: Send message to DM
                payload = {
                    "channel": dm_channel,
                    "text": text
                }
                if blocks:
                    payload["blocks"] = blocks
                
                msg_response = await client.post(
                    "https://slack.com/api/chat.postMessage",
                    headers=headers,
                    json=payload
                )
                
                msg_data = msg_response.json()
                if msg_data.get("ok"):
                    logger.info(f"✅ DM sent to user {user.id}")
                    return True
                else:
                    logger.error(f"❌ Failed to send DM: {msg_data.get('error')}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Failed to send DM: {e}")
            return False
    
    async def send_test_message(self, user=None) -> bool:
        """
        Send a test message
        
        Args:
            user: User model instance (optional). If provided, sends to user's Slack.
                  Otherwise, uses global webhook.
        """
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🎉 SecureThread Bot is Connected!",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Test Message*\n\nYour SecureThread backend is now connected to Slack! 🚀"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    }
                ]
            }
        ]
        
        # If user provided, send to their Slack
        if user:
            return await self.send_notification_to_user(
                user=user,
                text="🎉 SecureThread Bot is Connected!",
                blocks=blocks
            )
        # Otherwise use global webhook
        elif self.global_webhook_url:
            return await self.send_message_to_webhook(
                webhook_url=self.global_webhook_url,
                text="🎉 SecureThread Bot is Connected!",
                blocks=blocks
            )
        else:
            logger.error("❌ No Slack configuration available")
            return False


    async def send_scan_complete_notification(
        self, 
        user,  # ✅ Add user parameter
        scan_id: int,
        repository_name: str,
        repository_id: int,
        status: str,
        total_vulnerabilities: int,
        critical_count: int,
        high_count: int,
        medium_count: int,
        low_count: int,
        security_score: float,
        scan_duration: str
    ) -> bool:
        """
        Send notification when a security scan completes
        NOW WITH INTERACTIVE BUTTONS! 🎉
        """
        try:
            # Determine emoji based on security score
            if security_score >= 90:
                score_emoji = "🟢"
                score_text = "Excellent"
            elif security_score >= 70:
                score_emoji = "🟡"
                score_text = "Good"
            elif security_score >= 50:
                score_emoji = "🟠"
                score_text = "Fair"
            else:
                score_emoji = "🔴"
                score_text = "Needs Attention"
            
            # Build vulnerability summary
            vuln_summary = []
            if critical_count > 0:
                vuln_summary.append(f"🔴 *Critical:* {critical_count}")
            if high_count > 0:
                vuln_summary.append(f"🟠 *High:* {high_count}")
            if medium_count > 0:
                vuln_summary.append(f"🟡 *Medium:* {medium_count}")
            if low_count > 0:
                vuln_summary.append(f"🟢 *Low:* {low_count}")
            
            vuln_text = "\n".join(vuln_summary) if vuln_summary else "✅ No vulnerabilities found!"
            
            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "🔍 Security Scan Complete",
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
                            "text": f"*Scan ID:*\n#{scan_id}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Duration:*\n{scan_duration}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Total Issues:*\n{total_vulnerabilities}"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Security Score:* {score_emoji} {security_score}/100 ({score_text})"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Vulnerabilities Found:*\n{vuln_text}"
                    }
                },
                {
                    "type": "divider"
                }
            ]
            
            # ✨ NEW: Add interactive action buttons
            action_buttons = {
                "type": "actions",
                "elements": []
            }
            
            if total_vulnerabilities > 0:
                # Add "View Top N" buttons
                action_buttons["elements"].extend([
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "🔍 View Top 3",
                            "emoji": True
                        },
                        "action_id": "view_top_3",
                        "value": str(scan_id),
                        "style": "primary"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "🔟 View Top 10",
                            "emoji": True
                        },
                        "action_id": "view_top_10",
                        "value": str(scan_id)
                    }
                ])
            
            if critical_count > 0:
                # Add "Critical Only" button
                action_buttons["elements"].append({
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "🔴 Critical Only",
                        "emoji": True
                    },
                    "action_id": "view_critical_only",
                    "value": str(scan_id),
                    "style": "danger"
                })

            # ✅ MOVED OUTSIDE the if block - always show "Open in App"
            # Always add "Open in App" button (URL button)
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")
            action_buttons["elements"].append({
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "🌐 Open in App",
                    "emoji": True
                },
                "url": f"{frontend_url}/projects/{repository_id}",  
                "action_id": "open_in_app"
            })
            
            # Only add action block if we have buttons
            if action_buttons["elements"]:
                blocks.append(action_buttons)
            
            # Add timestamp
            blocks.append({
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    }
                ]
            })
            
            # ✅ Send to user's Slack
            return await self.send_notification_to_user(
                user=user,
                text=f"Scan #{scan_id} completed for {repository_name}",
                blocks=blocks
            )
            
        except Exception as e:
            logger.error(f"Failed to send scan completion notification: {str(e)}")
            return False


    async def send_critical_vulnerability_alert(
        self,
        user,  # ✅ Add user parameter
        vulnerability_title: str,
        severity: str,
        repository_name: str,
        file_path: str,
        line_number: Optional[int],
        code_snippet: Optional[str],
        description: str,
        recommendation: str,
        cwe_id: Optional[str] = None,
        owasp_category: Optional[str] = None
    ) -> bool:
        """Send immediate alert when critical/high severity vulnerability is detected"""
        try:
            # Determine emoji and color based on severity
            if severity.lower() == "critical":
                severity_emoji = "🚨"
                severity_text = "CRITICAL"
            elif severity.lower() == "high":
                severity_emoji = "🔴"
                severity_text = "HIGH"
            else:
                severity_emoji = "⚠️"
                severity_text = severity.upper()
            
            # Build location text
            location = file_path
            if line_number:
                location += f" (Line {line_number})"
            
            # Build additional info
            additional_info = []
            if cwe_id:
                additional_info.append(f"*CWE:* {cwe_id}")
            if owasp_category:
                additional_info.append(f"*OWASP:* {owasp_category}")
            
            additional_text = " | ".join(additional_info) if additional_info else ""
            
            # Build blocks
            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"{severity_emoji} {severity_text} Severity Vulnerability Detected!",
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
                            "text": f"*Severity:*\n{severity_emoji} {severity_text}"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Vulnerability:*\n{vulnerability_title}"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Location:*\n`{location}`"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Description:*\n{description[:500]}"
                    }
                }
            ]
            
            # Add code snippet if available
            if code_snippet:
                snippet = code_snippet[:500]
                if len(code_snippet) > 500:
                    snippet += "\n... (truncated)"
                
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Code Snippet:*\n```\n{snippet}\n```"
                    }
                })
            
            # Add recommendation
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Recommendation:*\n{recommendation[:500]}"
                }
            })
            
            # Add additional info if available
            if additional_text:
                blocks.append({
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": additional_text
                        }
                    ]
                })
            
            # Add divider and timestamp
            blocks.extend([
                {
                    "type": "divider"
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f"⚡ Detected at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                        }
                    ]
                }
            ])
            
            # ✅ Send to user's Slack
            return await self.send_notification_to_user(
                user=user,
                text=f"{severity_emoji} {severity_text} severity vulnerability found in {repository_name}: {vulnerability_title}",
                blocks=blocks
            )
            
        except Exception as e:
            logger.error(f"Failed to send critical vulnerability alert: {str(e)}")
            return False

    async def send_scan_started_notification(
        self,
        user,  # ✅ Add user parameter
        scan_id: int,
        repository_name: str,
        rules_count: int,
        user_custom_rules: int,
        global_rules: int
    ) -> bool:
        """Send notification when a security scan starts"""
        try:
            blocks = [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "🔍 Security Scan Started",
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
                            "text": f"*Scan ID:*\n#{scan_id}"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Scanning with:*\n📋 {rules_count} total rules ({global_rules} global + {user_custom_rules} custom)"
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f"⏱️ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                        }
                    ]
                }
            ]
            
            # ✅ Send to user's Slack
            return await self.send_notification_to_user(
                user=user,
                text=f"🔍 Scan #{scan_id} started for {repository_name}",
                blocks=blocks
            )
            
        except Exception as e:
            logger.error(f"Failed to send scan started notification: {str(e)}")
            return False


# Singleton instance
slack_service = SlackService()