from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import logging
from app.models.team import TeamMember
from app.models.repository import Repository, UserRepositoryAccess

from app.core.database import get_db
from app.services.team_service import TeamService
from app.models.team import MemberRole, MemberStatus
from app.models.user import User
from app.core.security import get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic schemas
class MemberResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    avatar: Optional[str]
    role: str
    status: str
    authProvider: str
    dateJoined: str
    lastActive: Optional[str]

class TeamStatsResponse(BaseModel):
    total: int
    active: int
    pending: int
    admins: int

class InviteByEmailRequest(BaseModel):
    emails: List[str]
    role: str = "Member"

class InviteLinkResponse(BaseModel):
    invite_link: str
    role: str

class RoleUpdateRequest(BaseModel):
    role: str

@router.get("/members", response_model=List[MemberResponse])
async def get_team_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all team members for current user's team"""
    try:
        team_service = TeamService(db)
        
        # Get or create default team for user
        team = team_service.get_or_create_default_team(current_user.id)
        
        # Get team members
        members = team_service.get_team_members(team.id)
        
        return members
        
    except Exception as e:
        logger.error(f"Error fetching team members: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats", response_model=TeamStatsResponse)
async def get_team_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get team statistics"""
    try:
        team_service = TeamService(db)
        
        # Get or create default team for user
        team = team_service.get_or_create_default_team(current_user.id)
        
        # Get team members
        members = team_service.get_team_members(team.id)
        
        # Calculate stats
        stats = {
            "total": len(members),
            "active": len([m for m in members if m["status"] == "Active"]),
            "pending": len([m for m in members if m["status"] == "Pending"]),
            "admins": len([m for m in members if m["role"] in ["Admin", "Owner"]])
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching team stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/invite/email")
async def invite_by_email(
    request: InviteByEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send email invitations"""
    try:
        team_service = TeamService(db)
        
        # Get or create default team for user
        team = team_service.get_or_create_default_team(current_user.id)
        
        # Validate role
        try:
            role = MemberRole(request.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Send invitations
        sent_invitations = team_service.send_email_invitations(
            team.id, 
            request.emails, 
            role, 
            current_user.id
        )
        
        return {
            "message": f"Invitations sent successfully",
            "sent_to": sent_invitations,
            "total_sent": len(sent_invitations)
        }
        
    except Exception as e:
        logger.error(f"Error sending email invitations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/invite/link", response_model=InviteLinkResponse)
async def generate_invite_link(
    role: str = "Member",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate invite link"""
    try:
        team_service = TeamService(db)
        team = team_service.get_or_create_default_team(current_user.id)
        
        try:
            member_role = MemberRole(role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        placeholder_email = f"pending-{team_service.generate_invite_token()[:8]}@invite.placeholder"
        
        invitation = team_service.create_invitation(
            team.id,
            placeholder_email,
            member_role,
            current_user.id
        )
        
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        invite_link = f"{frontend_url}/accept-invite?token={invitation.token}"
        
        return {
            "invite_link": invite_link,
            "role": role
        }
        
    except Exception as e:
        logger.error(f"Error generating invite link: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/members/{member_id}/role")
async def update_member_role(
    member_id: int,
    request: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update team member role"""
    try:
        team_service = TeamService(db)
        
        # Validate role
        try:
            new_role = MemberRole(request.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Update member role
        updated_member = team_service.update_member_role(
            member_id, 
            new_role, 
            current_user.id
        )
        
        return {
            "message": "Member role updated successfully",
            "member_id": member_id,
            "new_role": request.role
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating member role: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/members/{member_id}")
async def remove_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove team member"""
    try:
        team_service = TeamService(db)
        
        # Remove member
        success = team_service.remove_member(member_id, current_user.id)
        
        if success:
            return {
                "message": "Member removed successfully",
                "member_id": member_id
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to remove member")
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error removing member: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/invite/{token}")
async def get_invitation_details(token: str, db: Session = Depends(get_db)):
    """Get invitation details for accept page"""
    try:
        from app.models.team import TeamInvitation
        from datetime import datetime
        
        invitation = db.query(TeamInvitation).filter(
            TeamInvitation.token == token,
            TeamInvitation.is_used == False,
            TeamInvitation.expires_at > datetime.utcnow()
        ).first()
        
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid or expired invitation")
        
        return {
            "team_name": invitation.team.name,
            "role": invitation.role.value,
            "invited_by": invitation.inviter.full_name or invitation.inviter.github_username,
            "expires_at": invitation.expires_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching invitation details: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/invite/{token}/accept")
async def accept_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Accept team invitation"""
    try:
        team_service = TeamService(db)
        
        # Accept invitation
        team_member = team_service.accept_invitation(token, current_user.id)
        
        # ✅ FIXED: Get all repositories owned by team members
        team_repos = db.query(Repository).join(
            TeamMember, Repository.imported_by == TeamMember.user_id
        ).filter(
            TeamMember.team_id == team_member.team_id,
            TeamMember.role.in_([MemberRole.owner, MemberRole.admin])
        ).all()
        
        # Give new member read access to all team repositories
        repositories_shared = 0
        for repo in team_repos:
            # Check if access already exists
            existing_access = db.query(UserRepositoryAccess).filter(
                UserRepositoryAccess.user_id == current_user.id,
                UserRepositoryAccess.repository_id == repo.id
            ).first()
            
            if not existing_access:
                repo_access = UserRepositoryAccess(
                    user_id=current_user.id,
                    repository_id=repo.id,
                    access_level="read",  # Limited access for new members
                    granted_by=team_member.invited_by
                )
                db.add(repo_access)
                repositories_shared += 1
        
        db.commit()
        
        return {
            "message": "Invitation accepted successfully",
            "team_id": team_member.team_id,
            "role": team_member.role.value,
            "repositories_shared": repositories_shared
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error accepting invitation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")