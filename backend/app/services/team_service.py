from sqlalchemy.orm import Session
from typing import Optional, List, Dict
from app.models.team import Team, TeamMember, TeamInvitation, MemberRole, MemberStatus
from app.models.user import User
from app.services.email_service import EmailService
import uuid
import secrets
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class TeamService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()
    
    def get_or_create_default_team(self, user_id: int) -> Team:
        """Get user's default team or create one if it doesn't exist"""
        try:
            # Check if user has any team memberships
            membership = self.db.query(TeamMember).filter(
                TeamMember.user_id == user_id
            ).first()
            
            if membership:
                return membership.team
            
            # Create default team for user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            team_name = f"{user.full_name or user.github_username or 'User'}'s Team"
            
            team = Team(
                name=team_name,
                description="Default team",
                created_by=user_id
            )
            
            self.db.add(team)
            self.db.flush()  # Get team ID
            
            # Add user as owner
            team_member = TeamMember(
                team_id=team.id,
                user_id=user_id,
                role=MemberRole.owner,
                status=MemberStatus.active
            )
            
            self.db.add(team_member)
            self.db.commit()
            self.db.refresh(team)
            
            logger.info(f"Created default team for user {user_id}")
            return team
            
        except Exception as e:
            logger.error(f"Error creating default team: {str(e)}")
            self.db.rollback()
            raise e
    
    def get_team_members(self, team_id: int, active_only:  bool = False):
        """Get all members of a team
        
        Args:
            team_id: The team ID
            active_only: If True, only return active members (exclude pending invitations)
        """
        try:
            query = self.db.query(TeamMember).filter(TeamMember.team_id == team_id)
            
            # ✅ Filter by status if requested
            if active_only:  
                query = query.filter(TeamMember.status == MemberStatus.active)
            
            members = query.all()
            
            # Format member data
            result = []
            for member in members:
                user = self.db.query(User).filter(User.id == member.user_id).first()
                if user:
                    # ✅ Determine auth provider based on which username exists
                    auth_provider = "email"
                    if user.github_username:
                        auth_provider = "github"
                    elif user.gitlab_username:
                        auth_provider = "gitlab"
                    elif user.bitbucket_username:
                        auth_provider = "bitbucket"
                    
                    # ✅ Determine display name
                    display_name = (
                        user.full_name or 
                        user.github_username or 
                        user.gitlab_username or 
                        user.bitbucket_username or 
                        user.email. split('@')[0] if user.email else "Unknown"
                    )
                    
                    result. append({
                        "id":  member.id,
                        "user_id": user.id,
                        "name": display_name,
                        "email": user.email,
                        "avatar":  user.avatar_url,
                        "role": member.role. value,
                        "status":  member.status.value,
                        "authProvider": auth_provider,
                        "dateJoined": member.joined_at.isoformat() if member.joined_at else member.created_at.isoformat(),
                        "lastActive": user.last_login.isoformat() if hasattr(user, 'last_login') and user.last_login else None
                    })
                
            return result
                
        except Exception as e:
            logger.error(f"Error fetching team members: {str(e)}")
            raise e
    
    def generate_invite_token(self) -> str:
        """Generate unique invitation token"""
        return secrets.token_urlsafe(32)
    
    def create_invitation(self, team_id: int, email: str, role: MemberRole, invited_by: int) -> TeamInvitation:
        """Create team invitation"""
        try:
            # Check if user already exists and is a member
            existing_user = self.db.query(User).filter(User.email == email).first()
            if existing_user:
                existing_member = self.db.query(TeamMember).filter(
                    TeamMember.team_id == team_id,
                    TeamMember.user_id == existing_user.id
                ).first()
                if existing_member:
                    raise ValueError("User is already a team member")
            
            # Check for existing pending invitation
            existing_invitation = self.db.query(TeamInvitation).filter(
                TeamInvitation.team_id == team_id,
                TeamInvitation.email == email,
                TeamInvitation.is_used == False,
                TeamInvitation.expires_at > datetime.utcnow()
            ).first()
            
            if existing_invitation:
                return existing_invitation
            
            # Create new invitation
            invitation = TeamInvitation(
                team_id=team_id,
                email=email,
                role=role,
                token=self.generate_invite_token(),
                invited_by=invited_by,
                expires_at=datetime.utcnow() + timedelta(days=7)  # 7 days expiry
            )
            
            self.db.add(invitation)
            self.db.commit()
            self.db.refresh(invitation)
            
            logger.info(f"Created invitation for {email} to team {team_id}")
            return invitation
            
        except Exception as e:
            logger.error(f"Error creating invitation: {str(e)}")
            self.db.rollback()
            raise e
    
    def send_email_invitations(self, team_id: int, emails: List[str], role: MemberRole, invited_by: int) -> List[str]:
        """Send email invitations to multiple users"""
        sent_invitations = []
        
        try:
            team = self.db.query(Team).filter(Team.id == team_id).first()
            inviter = self.db.query(User).filter(User.id == invited_by).first()
            
            if not team or not inviter:
                raise ValueError("Team or inviter not found")
            
            for email in emails:
                email = email.strip()
                if not email:
                    continue
                
                try:
                    invitation = self.create_invitation(team_id, email, role, invited_by)
                    
                    # Send email in background
                    self._send_invitation_email(invitation, team, inviter)
                    sent_invitations.append(email)
                    
                except Exception as e:
                    logger.error(f"Error sending invitation to {email}: {str(e)}")
                    continue
            
            return sent_invitations
            
        except Exception as e:
            logger.error(f"Error sending email invitations: {str(e)}")
            raise e
    
    def _send_invitation_email(self, invitation: TeamInvitation, team: Team, inviter: User):
        """Send invitation email"""
        try:
            import os
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")
            invite_url = f"{frontend_url}/accept-invite?token={invitation.token}"
            
            subject = f"You're invited to join {team.name} on SecureThread"
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }}
                    .invite-button {{ display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }}
                    .team-info {{ background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Team Invitation</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">SecureThread Platform</p>
                    </div>
                    
                    <p>Hi there!</p>
                    
                    <p><strong>{inviter.full_name or inviter.github_username}</strong> has invited you to join the <strong>{team.name}</strong> team on SecureThread.</p>
                    
                    <div class="team-info">
                        <h3>Team Details:</h3>
                        <p><strong>Team:</strong> {team.name}</p>
                        <p><strong>Role:</strong> {invitation.role.value}</p>
                        <p><strong>Invited by:</strong> {inviter.full_name or inviter.github_username} ({inviter.email})</p>
                    </div>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="{invite_url}" class="invite-button">Accept Invitation</a>
                    </p>
                    
                    <p><small>This invitation will expire on {invitation.expires_at.strftime('%B %d, %Y')}.</small></p>
                    
                    <p><small>If the button doesn't work, copy and paste this link: {invite_url}</small></p>
                </div>
            </body>
            </html>
            """
            
            # Use existing email service (sync method)
            import threading
            
            def send_email():
                try:
                    import asyncio
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    
                    # Create a simple async wrapper
                    async def send():
                        return self.email_service._send_email(invitation.email, subject, html_body)
                    
                    success = loop.run_until_complete(send())
                    loop.close()
                    
                    if success:
                        logger.info(f"Invitation email sent to {invitation.email}")
                    
                except Exception as e:
                    logger.error(f"Error sending invitation email: {str(e)}")
            
            # Send in background thread
            thread = threading.Thread(target=send_email, daemon=True)
            thread.start()
            
        except Exception as e:
            logger.error(f"Error preparing invitation email: {str(e)}")
    
    def accept_invitation(self, token: str, user_id: int) -> TeamMember:
        """Accept team invitation"""
        try:
            invitation = self.db.query(TeamInvitation).filter(
                TeamInvitation.token == token,
                TeamInvitation.is_used == False,
                TeamInvitation.expires_at > datetime.utcnow()
            ).first()
            
            if not invitation:
                raise ValueError("Invalid or expired invitation")
            
            # Check if user is already a member
            existing_member = self.db.query(TeamMember).filter(
                TeamMember.team_id == invitation.team_id,
                TeamMember.user_id == user_id
            ).first()
            
            if existing_member:
                raise ValueError("User is already a team member")
            
            # Create team member
            team_member = TeamMember(
                team_id=invitation.team_id,
                user_id=user_id,
                role=invitation.role,
                status=MemberStatus.active,
                invited_by=invitation.invited_by
            )
            
            # Mark invitation as used
            invitation.is_used = True
            invitation.used_at = datetime.utcnow()
            invitation.used_by = user_id
            
            self.db.add(team_member)
            self.db.commit()
            self.db.refresh(team_member)
            
            logger.info(f"User {user_id} accepted invitation to team {invitation.team_id}")
            return team_member
            
        except Exception as e:
            logger.error(f"Error accepting invitation: {str(e)}")
            self.db.rollback()
            raise e
    
    def update_member_role(self, member_id: int, new_role: MemberRole, updated_by: int) -> TeamMember:
        """Update team member role"""
        try:
            member = self.db.query(TeamMember).filter(TeamMember.id == member_id).first()
            if not member:
                raise ValueError("Member not found")
            
            # Don't allow changing owner role
            if member.role == MemberRole.owner:
                raise ValueError("Cannot change owner role")
            
            member.role = new_role
            self.db.commit()
            self.db.refresh(member)
            
            logger.info(f"Updated member {member_id} role to {new_role}")
            return member
            
        except Exception as e:
            logger.error(f"Error updating member role: {str(e)}")
            self.db.rollback()
            raise e
    
    def remove_member(self, member_id: int, removed_by: int) -> bool:
        """Remove team member"""
        try:
            member = self.db.query(TeamMember).filter(TeamMember.id == member_id).first()
            if not member:
                raise ValueError("Member not found")
            
            # Don't allow removing owner
            if member.role == MemberRole.owner:
                raise ValueError("Cannot remove team owner")
            
            self.db.delete(member)
            self.db.commit()
            
            logger.info(f"Removed member {member_id} from team")
            return True
            
        except Exception as e:
            logger.error(f"Error removing member: {str(e)}")
            self.db.rollback()
            raise e