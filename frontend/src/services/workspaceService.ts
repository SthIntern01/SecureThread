import { teamService } from './teamService';

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
  authProvider: any;
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

export interface Repository {
  id: number;
  github_id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  clone_url: string;
  language?: string;
  is_private: boolean;
  is_archived?: boolean;
  default_branch: string;
  created_at?: string;
  updated_at?: string;
}

class WorkspaceService {
  private readonly API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Map team data to workspace format
  private mapTeamToWorkspace(team: any): Workspace {
    return {
      id: team.id.toString(),
      name: team.name,
      owner_id: team.created_by,
      created_at: team.created_at,
      updated_at: team.updated_at || team.created_at,
      plan: 'Pro Trial',
      member_count: 0,
      repository_count: 0,
    };
  }

  // Get all workspaces
  async getUserWorkspaces(): Promise<Workspace[]> {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('❌ No access token found');
        return [];
      }

      const response = await fetch(`${this.API_URL}/api/v1/workspace/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const workspaces = data.workspaces || [];
      
      if (!Array.isArray(workspaces)) {
        console.error('❌ Workspaces is not an array:', workspaces);
        return [];
      }
      
      // Map to frontend format
      return workspaces.map((ws: any) => ({
        id: ws.id?.toString() || ws.team_id?.toString(),
        name: ws.name,
        owner_id: ws.owner_id,
        created_at: ws.created_at,
        updated_at: ws.updated_at,
        plan: ws.plan || 'Pro Trial',
        member_count: ws.member_count || 0,
        repository_count: ws.repository_count || 0,
      }));
      
    } catch (error) {
      console.error('❌ Error fetching workspaces:', error);
      return [];
    }
  }

  // Get workspace by ID
  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const workspaces = await this.getUserWorkspaces();
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    return workspace;
  }

  // Get workspace members (uses existing team members endpoint)
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const members = await teamService.getTeamMembers();
      return members.map(m => ({
        ...m,
        workspace_id: workspaceId,
        joined_at: m.dateJoined,
        last_active: m.lastActive || undefined,
      }));
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      throw error;
    }
  }

  // Get workspace repositories
  async getWorkspaceRepositories(workspaceId: string): Promise<Repository[]> {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${this.API_URL}/api/v1/workspace/${workspaceId}/repositories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch workspace repositories');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error in getWorkspaceRepositories:', error);
      throw error;
    }
  }

  // Get available repositories (not in workspace)
  async getAvailableRepositories(workspaceId: string): Promise<Repository[]> {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(
        `${this.API_URL}/api/v1/workspace/${workspaceId}/available-repositories`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch available repositories');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error in getAvailableRepositories:', error);
      throw error;
    }
  }

  // Add repository to workspace
  async addRepositoryToWorkspace(workspaceId: string, repositoryId: number): Promise<any> {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(
        `${this.API_URL}/api/v1/workspace/${workspaceId}/repositories`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repository_id: repositoryId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add repository');
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Error in addRepositoryToWorkspace:', error);
      throw new Error(error.message || 'Failed to add repository to workspace');
    }
  }

  // Generate invite link (uses existing team endpoint)
  async generateInviteLink(workspaceId: string, role: string) {
    return await teamService.generateInviteLink(role);
  }

  // Send email invitations (uses existing team endpoint)
  async sendEmailInvitations(workspaceId: string, emails: string[], role: string) {
    return await teamService.sendEmailInvitations(emails, role);
  }

  // Update member role (uses existing team endpoint)
  async updateMemberRole(workspaceId: string, memberId: number, role: string) {
    return await teamService.updateMemberRole(memberId, role);
  }

  // Remove member (uses existing team endpoint)
  async removeMember(workspaceId: string, memberId: number) {
    return await teamService.removeMember(memberId);
  }

  // Switch workspace
  async switchWorkspace(workspaceId: string): Promise<void> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${this.API_URL}/api/v1/workspace/switch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workspace_id: workspaceId }),
    });

    if (!response.ok) {
      throw new Error('Failed to switch workspace');
    }

    localStorage.setItem('current_workspace_id', workspaceId);
  }

  // Get current workspace ID
  getCurrentWorkspaceId(): string | null {
    return localStorage.getItem('current_workspace_id') || '1';
  }

  // Create workspace (for now, use GitHub OAuth flow)
  async createWorkspace(name: string): Promise<void> {
    const redirectUri = `${window.location.origin}/workspace/callback`;
    const state = encodeURIComponent(JSON.stringify({ name, action: 'create_workspace' }));
    
    sessionStorage.setItem('pending_workspace_name', name);
    
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo&state=${state}`;
  }

  // Delete workspace
  async deleteWorkspace(workspaceId: string): Promise<{ new_active_workspace_id: string }> {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${this.API_URL}/api/v1/workspace/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete workspace');
      }

      const data = await response.json();
      
      return {
        new_active_workspace_id: data.new_active_workspace_id?.toString()
      };
      
    } catch (error) {
      console.error('❌ Error deleting workspace:', error);
      throw error;
    }
  }

  // Update workspace name
  async updateWorkspace(workspaceId: string, data: { name: string }): Promise<Workspace> {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${this.API_URL}/api/v1/workspace/${workspaceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: data.name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update workspace');
      }

      const updatedWorkspace = await response.json();
      
      return {
        id: updatedWorkspace.id?.toString() || workspaceId,
        name: updatedWorkspace.name,
        owner_id: updatedWorkspace.owner_id,
        created_at: updatedWorkspace.created_at,
        updated_at: updatedWorkspace.updated_at,
        plan: updatedWorkspace.plan || 'Pro Trial',
        member_count: updatedWorkspace.member_count || 0,
        repository_count: updatedWorkspace.repository_count || 0,
      };
      
    } catch (error: any) {
      console.error('❌ Error updating workspace:', error);
      throw new Error(error.message || 'Failed to update workspace name');
    }
  }

  // ==========================================
  // GitHub PAT Token Management
  // ==========================================
  
  async checkGitHubTokenStatus(): Promise<any> {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${this.API_URL}/api/v1/github-integration/pat/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to check token status');
    return response.json();
  }

  async saveGitHubToken(patToken: string): Promise<any> {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${this.API_URL}/api/v1/github-integration/pat/save`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: patToken })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save token');
    }

    return response.json();
  }

  async deleteGitHubToken(): Promise<any> {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No access token found');

    const response = await fetch(`${this.API_URL}/api/v1/github-integration/pat/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete token');
    return response.json();
  }

  // ==========================================
  // Utility functions
  // ==========================================

  validateEmail(email: string): boolean {
    return teamService.validateEmail(email);
  }

  parseEmails(emailString: string): string[] {
    return teamService.parseEmails(emailString);
  }

  validateEmails(emails: string[]) {
    return teamService.validateEmails(emails);
  }
}

export const workspaceService = new WorkspaceService();