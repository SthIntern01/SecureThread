# backend/app/services/slack_service.py

import httpx
import logging
import os  # ✅ Add this import
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class SlackService:
    """Service for sending notifications to Slack"""
    
    def __init__(self):
        # ✅ Load from environment variable instead of hardcoding
        self.webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        
        # ✅ Optional: Add validation
        if not self.webhook_url:
            logger.warning("⚠️ SLACK_WEBHOOK_URL not set - Slack notifications disabled")
    
    async def send_message(self, text: str, blocks: Optional[list] = None) -> bool:
        """
        Send a message to Slack
        
        Args:
            text: Plain text message (fallback)
            blocks: Rich formatting blocks (optional)
        
        Returns:
            True if successful, False otherwise
        """
        # ✅ Check if webhook URL is configured
        if not self.webhook_url:
            logger.error("❌ Slack webhook URL not configured")
            return False
            
        try:
            payload = {"text": text}
            
            if blocks:
                payload["blocks"] = blocks
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.webhook_url, json=payload)
                
                if response.status_code == 200:
                    logger.info(f"✅ Slack message sent successfully")
                    return True
                else:
                    logger.error(f"❌ Slack API error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Failed to send Slack message: {str(e)}")
            return False
    
    
    
    async def send_test_message(self) -> bool:
        """Send a test message to verify Slack integration"""
        
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
        
        return await self.send_message(
            text="🎉 SecureThread Bot is Connected!",
            blocks=blocks
        )


    async def send_scan_complete_notification(
        self, 
        scan_id: int,
        repository_name: str,
        status: str,
        total_vulnerabilities: int,
        critical_count: int,
        high_count: int,
        medium_count: int,
        low_count: int,
        security_score: float,
        scan_duration: str,
        db_session
    ) -> bool:
        """
        Send notification when a security scan completes
        
        Args:
            scan_id: ID of the completed scan
            repository_name: Name of the scanned repository
            status: Scan status (completed/failed)
            total_vulnerabilities: Total number of vulnerabilities found
            critical_count: Number of critical vulnerabilities
            high_count: Number of high severity vulnerabilities
            medium_count: Number of medium severity vulnerabilities
            low_count: Number of low severity vulnerabilities
            security_score: Security score (0-100)
            scan_duration: Time taken for scan
            db_session: Database session
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
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                        }
                    ]
                }
            ]
            
            return await self.send_message(
                text=f"Scan #{scan_id} completed for {repository_name}",
                blocks=blocks
            )
            
        except Exception as e:
            logger.error(f"Failed to send scan completion notification: {str(e)}")
            return False


    async def send_critical_vulnerability_alert(
        self,
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
        """
        Send immediate alert when critical/high severity vulnerability is detected
        
        Args:
            vulnerability_title: Title of the vulnerability
            severity: Severity level (critical/high)
            repository_name: Name of the repository
            file_path: Path to vulnerable file
            line_number: Line number where vulnerability was found
            code_snippet: Code snippet showing the vulnerability
            description: Detailed description
            recommendation: Fix recommendation
            cwe_id: CWE identifier
            owasp_category: OWASP category
        """
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
                        "text": f"*Description:*\n{description[:500]}"  # Limit description length
                    }
                }
            ]
            
            # Add code snippet if available
            if code_snippet:
                # Limit code snippet to 500 characters for Slack
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
            
            return await self.send_message(
                text=f"{severity_emoji} {severity_text} severity vulnerability found in {repository_name}: {vulnerability_title}",
                blocks=blocks
            )
            
        except Exception as e:
            logger.error(f"Failed to send critical vulnerability alert: {str(e)}")
            return False

    async def send_scan_started_notification(
        self,
        scan_id: int,
        repository_name: str,
        rules_count: int,
        user_custom_rules: int,
        global_rules: int
    ) -> bool:
        """
        Send notification when a security scan starts
        
        Args:
            scan_id: ID of the scan
            repository_name: Name of the repository being scanned
            rules_count: Total number of rules being used
            user_custom_rules: Number of user's custom rules
            global_rules: Number of global rules
        """
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
            
            return await self.send_message(
                text=f"🔍 Scan #{scan_id} started for {repository_name}",
                blocks=blocks
            )
            
        except Exception as e:
            logger.error(f"Failed to send scan started notification: {str(e)}")
            return False





# Singleton instance
slack_service = SlackService()