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

class WorkspaceService {
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

  // Get all workspaces (uses existing team endpoints)
  async getUserWorkspaces(): Promise<Workspace[]> {
    try {
      // Use existing team endpoint to get current team
      const members = await teamService.getTeamMembers();
      
      // For now, return a single workspace based on the team
      // In the future, you can modify backend to return multiple teams
      return [{
        id: '1',
        name: members[0]?.name?.split("'s")[0] + "'s Workspace" || 'My Workspace',
        owner_id: members.find(m => m.role === 'Owner')?.user_id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan: 'Pro Trial',
        member_count: members.length,
        repository_count: 0,
      }];
    } catch (error) {
      console.error('Error fetching workspaces:', error);
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

  // Update workspace name
  async updateWorkspace(workspaceId: string, data: { name: string }): Promise<Workspace> {
    // This would need a backend endpoint to update team name
    // For now, return the workspace as-is
    return await this.getWorkspace(workspaceId);
  }

  // Utility functions from teamService
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