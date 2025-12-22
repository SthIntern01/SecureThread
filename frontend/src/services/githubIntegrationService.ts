// frontend/src/services/githubIntegrationService.ts - COMPLETE FILE

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Types
export interface PATTokenRequest {
  token: string;
}

export interface PATTokenResponse {
  success: boolean;
  message: string;
  github_username?: string;
  token_created_at?: string;
}

export interface PATStatusResponse {
  has_token: boolean;
  created_at?: string;
  is_valid?: boolean;
}

export interface FileContentRequest {
  repository_id: number;
  file_path: string;
  branch?: string;
}

export interface FileContentResponse {
  success: boolean;
  content?: string;
  file_path: string;
  sha?: string;
  error?: string;
}

export interface VulnerabilityFixRequest {
  vulnerability_id: number;
  file_path: string;
  original_code: string;
  fixed_code: string;
  fix_type: 'manual' | 'ai_suggested';
}

export interface VulnerabilityFixResponse {
  success: boolean;
  fix_id: number;
  message: string;
}

export interface VulnerabilityFix {
  id: number;
  vulnerability_id: number;
  file_path: string;
  fix_type: string;
  status: string;
  created_at: string;
  vulnerability_title?: string;
  vulnerability_severity?: string;
}

export interface PendingFixesResponse {
  fixes: VulnerabilityFix[];
  total_count: number;
}

export interface CreatePRRequest {
  repository_id: number;
  vulnerability_fix_ids: number[];
  branch_name?: string;
  pr_title?: string;
  pr_description?: string;
}

export interface CreatePRResponse {
  success: boolean;
  pr_number?: number;
  pr_url?: string;
  branch_name?: string;
  files_changed?: string[];
  error?: string;
}

export interface PullRequest {
  id: number;
  repository_id: number;
  pr_number: number;
  pr_url: string;
  branch_name: string;
  title: string;
  status: string;
  fixes_count: number;
  created_at: string;
}

export interface PRHistoryResponse {
  pull_requests: PullRequest[];
  total_count: number;
}

// Helper to get auth token
const getAuthToken = (): string => {
  const token = localStorage.getItem('access_token');
  // FIXED: Removed space between ! and token
  if (!token) {
    throw new Error('Authentication token not found');
  }
  return token;
};

// API Service
export const githubIntegrationService = {
  // PAT Token Management
  async savePATToken(token: string): Promise<PATTokenResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/github/pat/save`,
      { token },
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  async checkPATStatus(): Promise<PATStatusResponse> {
    // FIXED: Removed space in 'axios.get'
    const response = await axios.get(`${API_BASE_URL}/github/pat/status`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response.data;
  },

  async deletePATToken(): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/github/pat/delete`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response.data;
  },

  // File Content
  async fetchFileContent(request: FileContentRequest): Promise<FileContentResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/github/file/content`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Vulnerability Fixes
  async saveVulnerabilityFix(request: VulnerabilityFixRequest): Promise<VulnerabilityFixResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/github/fix/save`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  async getPendingFixes(repository_id?: number): Promise<PendingFixesResponse> {
    const params = repository_id ? { repository_id } : {};
    const response = await axios.get(`${API_BASE_URL}/github/fixes/pending`, {
      params,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response.data;
  },

  async deleteVulnerabilityFix(fix_id: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/github/fix/${fix_id}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response.data;
  },

  // Pull Requests
  async createPullRequest(request: CreatePRRequest): Promise<CreatePRResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/github/pr/create`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  async getPRHistory(repository_id?: number): Promise<PRHistoryResponse> {
    const params = repository_id ? { repository_id } : {};
    // FIXED: Removed space in 'axios.get'
    const response = await axios.get(`${API_BASE_URL}/github/pr/history`, {
      params,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response.data;
  },
};
