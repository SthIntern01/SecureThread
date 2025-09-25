from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.feedback import Feedback, FeedbackType, SeverityLevel, FeedbackStatus
from app.models.user import User
from app.services.email_service import EmailService
import uuid
from datetime import datetime
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class FeedbackService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()
    
    def generate_tracking_id(self) -> str:
        """Generate unique tracking ID for feedback"""
        timestamp = int(datetime.now().timestamp())
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"FBK-{timestamp}-{unique_id}"
    
    async def create_feedback_async(self, feedback_data: dict, user_id: Optional[int] = None) -> Feedback:
        """Create new feedback submission and send email notification (async version)"""
        try:
            tracking_id = self.generate_tracking_id()
            
            # Create feedback object
            feedback = Feedback(
                tracking_id=tracking_id,
                type=FeedbackType(feedback_data["type"]),
                severity=SeverityLevel(feedback_data.get("severity", "Medium")),
                description=feedback_data["description"],
                steps_to_reproduce=feedback_data.get("stepsToReproduce"),
                user_id=user_id,
                user_email=feedback_data.get("userEmail"),
                status=FeedbackStatus.submitted,
                attachments=json.dumps(feedback_data.get("attachments", []))
            )
            
            self.db.add(feedback)
            self.db.commit()
            self.db.refresh(feedback)
            
            logger.info(f"Created feedback with tracking ID: {tracking_id}")
            
            # Send email notification (proper async)
            await self._send_email_notifications_async(feedback_data, tracking_id)
            
            return feedback
            
        except Exception as e:
            logger.error(f"Error creating feedback: {str(e)}")
            self.db.rollback()
            raise e
    
    def create_feedback(self, feedback_data: dict, user_id: Optional[int] = None) -> Feedback:
        """Create new feedback submission and send email notification (sync version with background email)"""
        try:
            tracking_id = self.generate_tracking_id()
            
            # Create feedback object
            feedback = Feedback(
                tracking_id=tracking_id,
                type=FeedbackType(feedback_data["type"]),
                severity=SeverityLevel(feedback_data.get("severity", "Medium")),
                description=feedback_data["description"],
                steps_to_reproduce=feedback_data.get("stepsToReproduce"),
                user_id=user_id,
                user_email=feedback_data.get("userEmail"),
                status=FeedbackStatus.submitted,
                attachments=json.dumps(feedback_data.get("attachments", []))
            )
            
            self.db.add(feedback)
            self.db.commit()
            self.db.refresh(feedback)
            
            logger.info(f"Created feedback with tracking ID: {tracking_id}")
            
            # Send email notification in background thread (non-blocking)
            self._send_email_notifications_background(feedback_data, tracking_id)
            
            return feedback
            
        except Exception as e:
            logger.error(f"Error creating feedback: {str(e)}")
            self.db.rollback()
            raise e
    
    async def _send_email_notifications_async(self, feedback_data: dict, tracking_id: str):
        """Send email notifications (async version)"""
        try:
            # Prepare email data
            email_data = {
                'tracking_id': tracking_id,
                'type': feedback_data["type"],
                'severity': feedback_data.get("severity", "Medium"),
                'description': feedback_data["description"],
                'steps_to_reproduce': feedback_data.get("stepsToReproduce"),
                'user_email': feedback_data.get("userEmail"),
                'attachments': feedback_data.get("attachments", [])
            }
            
            # Send notification to admin
            admin_success = await self.email_service.send_feedback_notification(email_data)
            
            # Send confirmation to user if email provided
            if feedback_data.get("userEmail"):
                user_success = await self.email_service.send_feedback_confirmation(
                    feedback_data["userEmail"], 
                    tracking_id
                )
                if user_success:
                    logger.info(f"Confirmation email sent to user for {tracking_id}")
            
            if admin_success:
                logger.info(f"Admin notification email sent for {tracking_id}")
            
        except Exception as e:
            logger.error(f"Error sending email notifications: {str(e)}")
            # Don't raise exception - feedback should still be saved even if email fails
    
    def _send_email_notifications_background(self, feedback_data: dict, tracking_id: str):
        """Send email notifications in background thread to avoid event loop conflicts"""
        import threading
        
        def send_emails():
            try:
                # Prepare email data
                email_data = {
                    'tracking_id': tracking_id,
                    'type': feedback_data["type"],
                    'severity': feedback_data.get("severity", "Medium"),
                    'description': feedback_data["description"],
                    'steps_to_reproduce': feedback_data.get("stepsToReproduce"),
                    'user_email': feedback_data.get("userEmail"),
                    'attachments': feedback_data.get("attachments", [])
                }
                
                # Create new event loop for this thread
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                try:
                    # Send notification to admin
                    admin_success = loop.run_until_complete(
                        self.email_service.send_feedback_notification(email_data)
                    )
                    
                    # Send confirmation to user if email provided
                    if feedback_data.get("userEmail"):
                        user_success = loop.run_until_complete(
                            self.email_service.send_feedback_confirmation(
                                feedback_data["userEmail"], 
                                tracking_id
                            )
                        )
                        if user_success:
                            logger.info(f"Confirmation email sent to user for {tracking_id}")
                    
                    if admin_success:
                        logger.info(f"Admin notification email sent for {tracking_id}")
                        
                finally:
                    loop.close()
                    
            except Exception as e:
                logger.error(f"Error sending email notifications in background: {str(e)}")
        
        # Start email sending in background thread
        thread = threading.Thread(target=send_emails, daemon=True)
        thread.start()
    
    def get_feedback_by_tracking_id(self, tracking_id: str) -> Optional[Feedback]:
        """Get feedback by tracking ID"""
        return self.db.query(Feedback).filter(
            Feedback.tracking_id == tracking_id
        ).first()
    
    def get_user_feedback(self, user_id: int, limit: int = 50) -> List[Feedback]:
        """Get all feedback submitted by a user"""
        return self.db.query(Feedback).filter(
            Feedback.user_id == user_id
        ).order_by(Feedback.created_at.desc()).limit(limit).all()
    
    def get_all_feedback(self, 
                        status: Optional[FeedbackStatus] = None,
                        feedback_type: Optional[FeedbackType] = None,
                        limit: int = 100) -> List[Feedback]:
        """Get all feedback with optional filtering"""
        query = self.db.query(Feedback)
        
        if status:
            query = query.filter(Feedback.status == status)
        
        if feedback_type:
            query = query.filter(Feedback.type == feedback_type)
        
        return query.order_by(Feedback.created_at.desc()).limit(limit).all()
    
    def update_feedback_status(self, tracking_id: str, status: FeedbackStatus) -> Optional[Feedback]:
        """Update feedback status"""
        try:
            feedback = self.get_feedback_by_tracking_id(tracking_id)
            if feedback:
                feedback.status = status
                self.db.commit()
                self.db.refresh(feedback)
                logger.info(f"Updated feedback {tracking_id} status to {status}")
            return feedback
        except Exception as e:
            logger.error(f"Error updating feedback status: {str(e)}")
            self.db.rollback()
            raise e
    
    def get_feedback_stats(self) -> dict:
        """Get feedback statistics"""
        try:
            total_feedback = self.db.query(Feedback).count()
            
            # Count by type
            type_counts = {}
            for feedback_type in FeedbackType:
                count = self.db.query(Feedback).filter(
                    Feedback.type == feedback_type
                ).count()
                type_counts[feedback_type.value] = count
            
            # Count by status
            status_counts = {}
            for status in FeedbackStatus:
                count = self.db.query(Feedback).filter(
                    Feedback.status == status
                ).count()
                status_counts[status.value] = count
            
            return {
                "total_feedback": total_feedback,
                "by_type": type_counts,
                "by_status": status_counts
            }
        except Exception as e:
            logger.error(f"Error getting feedback stats: {str(e)}")
            raise e
    
    