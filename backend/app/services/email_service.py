import smtplib
import logging
import os
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        load_dotenv()
        
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SENDER_EMAIL")
        self.sender_password = os.getenv("SENDER_PASSWORD")
        self.admin_email = os.getenv("ADMIN_EMAIL", "sthopsintern@gmail.com")
        
        # Validate required environment variables
        if not self.sender_email or not self.sender_password:
            raise ValueError("SENDER_EMAIL and SENDER_PASSWORD must be set in environment variables")
    
    async def send_feedback_notification(self, feedback_data: dict) -> bool:
        """Send email notification for new feedback submission"""
        try:
            # Create email content
            subject = f"New {feedback_data['type'].title()} Feedback - {feedback_data['tracking_id']}"
            
            # Create HTML email body
            html_body = self._create_feedback_email_html(feedback_data)
            
            # Send email
            success = self._send_email(
                to_email=self.admin_email,
                subject=subject,
                html_body=html_body
            )
            
            if success:
                logger.info(f"Feedback notification sent for {feedback_data['tracking_id']}")
            else:
                logger.error(f"Failed to send feedback notification for {feedback_data['tracking_id']}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending feedback notification: {str(e)}")
            return False
    
    def _create_feedback_email_html(self, feedback_data: dict) -> str:
        """Create HTML email template for feedback notification"""
        
        # Format severity with color
        severity_color = {
            'Low': '#28a745',
            'Medium': '#ffc107', 
            'High': '#dc3545'
        }.get(feedback_data.get('severity', 'Medium'), '#6c757d')
        
        # Format feedback type
        type_labels = {
            'bug': '🐛 Bug Report',
            'feature': '💡 Feature Request',
            'security': '🔒 Security Concern',
            'general': '💬 General Suggestion'
        }
        type_label = type_labels.get(feedback_data['type'], feedback_data['type'].title())
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .tracking-id {{ background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }}
                .field {{ margin: 15px 0; }}
                .field-label {{ font-weight: bold; color: #495057; display: inline-block; min-width: 120px; }}
                .field-value {{ color: #212529; }}
                .severity {{ padding: 4px 12px; border-radius: 20px; color: white; font-weight: bold; display: inline-block; }}
                .description-box {{ background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; line-height: 1.6; }}
                .steps-box {{ background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }}
                .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; }}
                .attachments {{ background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 New Feedback Received</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">SecureThread Platform</p>
                </div>
                
                <div class="tracking-id">
                    <strong>Tracking ID:</strong> {feedback_data['tracking_id']}
                </div>
                
                <div class="field">
                    <span class="field-label">Type:</span>
                    <span class="field-value">{type_label}</span>
                </div>
                
                {f'''<div class="field">
                    <span class="field-label">Severity:</span>
                    <span class="severity" style="background-color: {severity_color};">{feedback_data.get('severity', 'Medium')}</span>
                </div>''' if feedback_data.get('severity') else ''}
                
                <div class="field">
                    <span class="field-label">Submitted:</span>
                    <span class="field-value">{datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</span>
                </div>
                
                {f'''<div class="field">
                    <span class="field-label">User Email:</span>
                    <span class="field-value">{feedback_data['user_email']}</span>
                </div>''' if feedback_data.get('user_email') else ''}
                
                <div class="description-box">
                    <strong style="color: #495057;">Description:</strong><br><br>
                    {feedback_data['description'].replace(chr(10), '<br>')}
                </div>
                
                {f'''<div class="steps-box">
                    <strong style="color: #856404;">Steps to Reproduce:</strong><br><br>
                    {feedback_data['steps_to_reproduce'].replace(chr(10), '<br>')}
                </div>''' if feedback_data.get('steps_to_reproduce') else ''}
                
                {f'''<div class="attachments">
                    <strong>📎 Attachments:</strong> {len(feedback_data.get('attachments', []))} file(s) uploaded
                    <ul>
                    {''.join([f"<li><a href='http://localhost:8000/api/v1/feedback/files/{att.get('saved_filename', att.get('filename', 'Unknown'))}'>{att.get('filename', 'Unknown file')}</a> ({att.get('size', 0)} bytes)</li>" for att in feedback_data.get('attachments', [])])}
                    </ul>
                </div>''' if feedback_data.get('attachments') else ''}
                
                <div class="footer">
                    <p>This is an automated notification from SecureThread Feedback System</p>
                    <p>Please respond to this feedback at your earliest convenience.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_body
    
    def _send_email(self, to_email: str, subject: str, html_body: str) -> bool:
        """Send email using SMTP"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"SecureThread Feedback System <{self.sender_email}>"
            message["To"] = to_email
            
            # Add HTML body
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
            
            # Connect to server and send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()  # Enable encryption
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, message.as_string())
            
            return True
            
        except Exception as e:
            logger.error(f"SMTP error: {str(e)}")
            return False
    
    async def send_feedback_confirmation(self, user_email: str, tracking_id: str) -> bool:
        """Send confirmation email to the user who submitted feedback"""
        try:
            subject = f"Feedback Received - {tracking_id}"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }}
                    .tracking-id {{ background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; text-align: center; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Feedback Received</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Thank you for your feedback!</p>
                    </div>
                    
                    <p>We've successfully received your feedback and our team will review it shortly.</p>
                    
                    <div class="tracking-id">
                        <strong>Your Tracking ID:</strong><br>
                        <code style="font-size: 18px; color: #28a745;">{tracking_id}</code>
                    </div>
                    
                    <p>You can reference this tracking ID if you need to follow up on your feedback.</p>
                    
                    <p style="text-align: center; margin-top: 30px; color: #6c757d;">
                        <em>SecureThread Team</em>
                    </p>
                </div>
            </body>
            </html>
            """
            
            return await self._send_email(user_email, subject, html_body)
            
        except Exception as e:
            logger.error(f"Error sending confirmation email: {str(e)}")
            return False