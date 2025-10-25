// src/services/githubService.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  default_branch: string;
  language: string | null;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  size: number;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  visibility: string;
  archived: boolean;
  disabled: boolean;
}

class GitHubService {
  async handleWorkspaceCallback(code: string, state: string): Promise<any> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/api/v1/workspace/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to process GitHub callback');
    }

    return response.json();
  }

  async getUserRepositories(): Promise<GitHubRepository[]> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/api/v1/workspace/repositories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch repositories');
    }

    return response.json();
  }

  async createWorkspaceWithRepos(data: {
    name: string;
    repository_ids: number[];
  }): Promise<any> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/api/v1/workspace/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create workspace');
    }

    return response.json();
  }
}

export const githubService = new GitHubService();