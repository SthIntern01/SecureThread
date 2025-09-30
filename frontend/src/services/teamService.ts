// frontend/src/services/teamService.ts

export interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar?: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  status: "Active" | "Pending" | "Inactive";
  authProvider: "GitHub" | "GitLab" | "Google" | "Bitbucket" | "Email";
  dateJoined: string;
  lastActive?: string;
}

export interface TeamStats {
  total: number;
  active: number;
  pending: number;
  admins: number;
}

export interface InviteByEmailRequest {
  emails: string[];
  role: string;
}

export interface InviteLinkResponse {
  invite_link: string;
  role: string;
}

class TeamService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Get all team members
   */
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/teams/members`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(): Promise<TeamStats> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/teams/stats`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching team stats:', error);
      throw error;
    }
  }

  /**
   * Send email invitations
   */
  async sendEmailInvitations(emails: string[], role: string = "Member"): Promise<{ message: string; sent_to: string[]; total_sent: number }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/teams/invite/email`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          emails,
          role
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send invitations: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error sending email invitations:', error);
      throw error;
    }
  }

  /**
   * Generate invite link
   */
 async generateInviteLink(role: string = "Member"): Promise<InviteLinkResponse> {
  try {
    const response = await fetch(`${this.baseURL}/api/v1/teams/invite/link?role=${role}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating invite link:', error);
    throw error;
  }
}

  /**
   * Update member role
   */
  async updateMemberRole(memberId: number, newRole: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/teams/members/${memberId}/role`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          role: newRole
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update role: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Remove team member
   */
  async removeMember(memberId: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/teams/members/${memberId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove member: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  /**
   * Get invitation details
   */
  async getInvitationDetails(token: string): Promise<{
  team_name: string;
  role: string;
  invited_by: string;
  expires_at: string;
}> {
  try {
    // FIX: Token should be in the path, not query params
    const response = await fetch(`${this.baseURL}/api/v1/teams/invite/${token}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching invitation details:', error);
    throw error;
  }
}

  /**
   * Accept team invitation
   */
  async acceptInvitation(token: string): Promise<{ message: string; team_id: number; role: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/teams/invite/${token}/accept`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to accept invitation: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Parse comma-separated emails
   */
  parseEmails(emailString: string): string[] {
    return emailString
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate multiple emails
   */
  validateEmails(emails: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const email of emails) {
      if (!this.validateEmail(email)) {
        errors.push(`Invalid email format: ${email}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const teamService = new TeamService();