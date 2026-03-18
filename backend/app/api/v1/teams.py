from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import logging
import os
import traceback

from app.core.database import get_db
from app.services.team_service import TeamService
from app.models.user import User
from app.models.team import Team, TeamMember, MemberRole, MemberStatus, TeamInvitation
from app.models.team_repository import TeamRepository  
from app.models.repository import Repository, UserRepositoryAccess
from app.core.security import get_current_active_user
from app.api.deps import get_current_user

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
    team_id: Optional[int] = None  # ✅ FIX: Added team_id

class InviteLinkResponse(BaseModel):
    invite_link: str
    role: str

class RoleUpdateRequest(BaseModel):
    role: str


# Helper function to determine the correct team ID
def get_target_team_id(requested_team_id: Optional[int], current_user: User, team_service: TeamService) -> int:
    target_id = requested_team_id or current_user.active_team_id
    if not target_id:
        team = team_service.get_or_create_default_team(current_user.id)
        target_id = team.id
    return target_id


@router.get("/members", response_model=List[MemberResponse])
async def get_team_members(
    team_id: Optional[int] = None,  # ✅ FIX: Accept team_id
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all team members for current user's team"""
    try:
        team_service = TeamService(db)
        target_team_id = get_target_team_id(team_id, current_user, team_service)
        
        # Get team members - ONLY ACTIVE ones
        members = team_service.get_team_members(target_team_id, active_only=True)
        return members
        
    except Exception as e:
        logger.error(f"Error fetching team members: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats", response_model=TeamStatsResponse)
async def get_team_stats(
    team_id: Optional[int] = None,  # ✅ FIX: Accept team_id
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get team statistics"""
    try:
        team_service = TeamService(db)
        target_team_id = get_target_team_id(team_id, current_user, team_service)
        
        members = team_service.get_team_members(target_team_id)
        
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
        target_team_id = get_target_team_id(request.team_id, current_user, team_service)
        
        try:
            role = MemberRole(request.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        sent_invitations = team_service.send_email_invitations(
            target_team_id, 
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
    team_id: Optional[int] = None,  # ✅ FIX: Accept team_id
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate invite link"""
    try:
        team_service = TeamService(db)
        target_team_id = get_target_team_id(team_id, current_user, team_service)
        
        try:
            member_role = MemberRole(role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        placeholder_email = f"pending-{team_service.generate_invite_token()[:8]}@invite.placeholder"
        
        invitation = team_service.create_invitation(
            target_team_id,
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
        try:
            new_role = MemberRole(request.role)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        updated_member = team_service.update_member_role(member_id, new_role, current_user.id)
        
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
        success = team_service.remove_member(member_id, current_user.id)
        
        if success:
            return {"message": "Member removed successfully", "member_id": member_id}
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
        team_member = team_service.accept_invitation(token, current_user.id)
        
        current_user.active_team_id = team_member.team_id
        db.add(current_user)
        db.flush()
        db.commit()
        
        return {
            "message": "Invitation accepted successfully",
            "team_id": team_member.team_id,
            "team_name": team_member.team.name,
            "role": team_member.role.value,
            "active_team_id": current_user.active_team_id
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/leave")
async def leave_workspace(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Leave the specified workspace"""
    try:
        team_service = TeamService(db)
        success = team_service.leave_workspace(team_id, current_user.id)
        
        if success:
            # If they left their currently active workspace, clear it
            if current_user.active_team_id == team_id:
                current_user.active_team_id = None
                db.add(current_user)
                db.commit()
                
            return {"message": "Successfully left the workspace"}
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error leaving workspace: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")