import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Workspace {
  id: string;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  plan: string;
  member_count: number;
  repository_count: number;
}

export interface WorkspaceMember {
  id: number;
  workspace_id: string;
  user_id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  status: 'Active' | 'Pending' | 'Inactive';
  invited_by?: number;
  joined_at: string;
  last_active?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  repository_ids: string[];
}

export interface InviteLinkResponse {
  invite_link: string;
  expires_at: string;
  role: string;
}

export interface SendInvitesRequest {
  emails: string[];
  role: string;
  workspace_id: string;
}

export interface SendInvitesResponse {
  total_sent: number;
  successful: string[];
  failed: string[];
}

class WorkspaceService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // Get all workspaces for current user
  async getUserWorkspaces(): Promise<Workspace[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/workspaces`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  }

  // Get workspace by ID
  async getWorkspace(workspaceId: string): Promise<Workspace> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/workspaces/${workspaceId}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching workspace:', error);
      throw error;
    }
  }

  // Create new workspace
  async createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/workspaces`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  // Update workspace
  async updateWorkspace(
    workspaceId: string,
    data: Partial<Workspace>
  ): Promise<Workspace> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/workspaces/${workspaceId}`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  }

  // Delete workspace
  async deleteWorkspace(workspaceId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/workspaces/${workspaceId}`,
        this.getAuthHeaders()
      );
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }

  // Get workspace members
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/workspaces/${workspaceId}/members`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      throw error;
    }
  }

  // Generate invite link
  async generateInviteLink(
    workspaceId: string,
    role: string
  ): Promise<InviteLinkResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/workspaces/${workspaceId}/invite-link`,
        { role },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error generating invite link:', error);
      throw error;
    }
  }

  // Send email invitations
  async sendEmailInvitations(
    data: SendInvitesRequest
  ): Promise<SendInvitesResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/workspaces/${data.workspace_id}/invite`,
        { emails: data.emails, role: data.role },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error sending invitations:', error);
      throw error;
    }
  }

  // Update member role
  async updateMemberRole(
    workspaceId: string,
    memberId: number,
    role: string
  ): Promise<WorkspaceMember> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/workspaces/${workspaceId}/members/${memberId}`,
        { role },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  // Remove member from workspace
  async removeMember(workspaceId: string, memberId: number): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/workspaces/${workspaceId}/members/${memberId}`,
        this.getAuthHeaders()
      );
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  // Switch active workspace (update user's current workspace context)
  async switchWorkspace(workspaceId: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/user/switch-workspace`,
        { workspace_id: workspaceId },
        this.getAuthHeaders()
      );
      // Store current workspace in local storage
      localStorage.setItem('current_workspace_id', workspaceId);
    } catch (error) {
      console.error('Error switching workspace:', error);
      throw error;
    }
  }

  // Get current workspace ID from local storage
  getCurrentWorkspaceId(): string | null {
    return localStorage.getItem('current_workspace_id');
  }

  // Get available repositories from GitHub for workspace creation
  async getAvailableRepositories(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/github/repositories`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Parse and validate multiple emails
  parseEmails(emailString: string): string[] {
    return emailString
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  validateEmails(emails: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    emails.forEach(email => {
      if (!this.validateEmail(email)) {
        errors.push(`Invalid email format: ${email}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const workspaceService = new WorkspaceService();