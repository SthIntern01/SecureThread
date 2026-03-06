/**
 * Scan Service - Handles all scanning operations
 * Supports both Rule-Based and LLM-Based scanning
 */

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface ScanConfig {
  repository_id: number;
  use_llm_enhancement?: boolean;
  include_user_rules?: boolean;
}

export interface ScanResponse {
  scan_id: number;
  repository_id: number;
  repository_name: string;
  status: string;
  message: string;
  rules_count?: number;
  user_custom_rules?: number;
  global_rules?: number;
}

export interface LLMScanConfig {
  repository_id: number;
  max_files: number;
  priority_level: string;
}

export interface LLMScanResponse {
  scan_id: number;
  message: string;
  repository_id: number;
  scan_type: string;
  priority_level: string;
  max_files: number;
  estimated_time_seconds: number;
}

export interface ScanResult {
  id: number;
  repository_id: number;
  status: string;
  scan_type?: string;
  started_at: string;
  completed_at?: string;
  total_files_scanned: number;
  scan_duration?: string;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  security_score?: number;
  code_coverage?: number;
  error_message?: string;
  scan_metadata?: any;
}

export interface Vulnerability {
  id: number;
  title: string;
  description: string;
  severity: string;
  category: string;
  cwe_id?: string;
  owasp_category?: string;
  file_path: string;
  line_number?: number;
  line_end_number?: number;
  code_snippet?: string;
  recommendation: string;
  fix_suggestion?: string;
  risk_score?: number;
  exploitability?: string;
  impact?: string;
  status: string;
  detection_method?: string;
  llm_explanation?: string;
  llm_solution?: string;
  llm_code_example?: string;
  confidence_score?: number;
  created_at: string;
}

export interface LLMVulnerabilityDetail {
  id: number;
  title: string;
  description: string;
  severity: string;
  category: string;
  file_path: string;
  line_number: number;
  line_end_number: number;
  code_snippet: string;
  llm_explanation: string;
  llm_solution: string;
  llm_code_example: string;
  confidence_score: number;
  detection_method: string;
  status: string;
  created_at: string;
}

export interface LLMScanResult {
  scan_id: number;
  scan_type: string;
  status: string;
  repository_name: string;
  total_files_scanned: number;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  llm_model_used: string;
  total_tokens_used: number;
  estimated_cost: number;
  scan_duration_seconds: number;
  started_at: string;
  completed_at: string;
  vulnerabilities: LLMVulnerabilityDetail[];
}

export interface ScanStatusResponse {
  scan_id: number;
  scan_type: string;
  status: string;
  progress: {
    files_scanned: number;
    vulnerabilities_found: number;
  };
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface ScanHistoryItem {
  id: number;
  repository_id: number;
  scan_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

// ============================================================================
// SCAN SERVICE CLASS
// ============================================================================

class ScanService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // ==========================================================================
  // RULE-BASED SCANNING
  // ==========================================================================

  /**
   * Start a rule-based scan
   */
  async startScan(config: ScanConfig): Promise<ScanResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/custom-scans/start`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scan failed: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error starting scan:', error);
      throw error;
    }
  }

  /**
   * Get scan results by scan ID
   */
  async getScanById(scanId: number): Promise<ScanResult> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/custom-scans/${scanId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get scan: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting scan:', error);
      throw error;
    }
  }

  /**
   * Get vulnerabilities for a scan
   */
  async getScanVulnerabilities(scanId: number): Promise<Vulnerability[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/v1/custom-scans/${scanId}/vulnerabilities`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get vulnerabilities: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting vulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Get scan history for a repository
   */
  async getScanHistory(repositoryId: number): Promise<ScanHistoryItem[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/v1/custom-scans/repository/${repositoryId}/scans`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get scan history: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting scan history:', error);
      throw error;
    }
  }

  // ==========================================================================
  // LLM-BASED SCANNING
  // ==========================================================================

  /**
   * Start an LLM-based scan
   */
  async startLLMScan(config: LLMScanConfig): Promise<LLMScanResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/custom-scans/llm-scan`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM scan failed: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error starting LLM scan:', error);
      throw error;
    }
  }

  /**
   * Get LLM scan results with full details
   */
  async getLLMScanResults(scanId: number): Promise<LLMScanResult> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/custom-scans/llm-scan/${scanId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get LLM scan results: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting LLM scan results:', error);
      throw error;
    }
  }

  // ==========================================================================
  // SCAN STATUS & MONITORING
  // ==========================================================================

  /**
   * Get current status of any scan (rule-based or LLM)
   */
  async getScanStatus(scanId: number): Promise<ScanStatusResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/custom-scans/scan-status/${scanId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get scan status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting scan status:', error);
      throw error;
    }
  }

  /**
   * Poll scan status until completion
   * @param scanId - Scan ID to monitor
   * @param onProgress - Callback function for progress updates
   * @param maxWaitTime - Maximum time to wait in milliseconds (default: 10 minutes)
   */
  async waitForScanCompletion(
    scanId: number,
    onProgress?: (status: ScanStatusResponse) => void,
    maxWaitTime: number = 600000 // 10 minutes default
  ): Promise<ScanStatusResponse> {
    const startTime = Date.now();
    const pollInterval = 3000; // 3 seconds

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          // Check if max wait time exceeded
          if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('Scan timeout exceeded'));
            return;
          }

          // Get current scan status
          const status = await this.getScanStatus(scanId);
          
          // Call progress callback if provided
          if (onProgress) {
            onProgress(status);
          }

          // Check if scan is complete
          if (status.status === 'completed') {
            resolve(status);
            return;
          } else if (status.status === 'failed') {
            reject(new Error(status.error_message || 'Scan failed'));
            return;
          }

          // Continue polling if still running
          setTimeout(checkStatus, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      checkStatus();
    });
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Download scan report
   */
  async downloadReport(scanId: number, format: 'pdf' | 'json' = 'pdf'): Promise<Blob> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/v1/custom-scans/${scanId}/report?format=${format}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  /**
   * Delete a scan
   */
  async deleteScan(scanId: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/custom-scans/${scanId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete scan: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error deleting scan:', error);
      throw error;
    }
  }

  /**
   * Get scan statistics for a repository
   */
  async getRepositoryStats(repositoryId: number): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/v1/custom-scans/repository/${repositoryId}/stats`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get repository stats: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting repository stats:', error);
      throw error;
    }
  }

  /**
   * Format scan duration for display
   */
  formatDuration(seconds?: number): string {
    if (!seconds) return 'N/A';
    
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    if (minutes < 60) {
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s` 
        : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m` 
      : `${hours}h`;
  }

  /**
   * Format cost for display
   */
  formatCost(cost?: number): string {
    if (!cost || cost === 0) return '$0.00';
    
    if (cost < 0.01) {
      return `$${cost.toFixed(4)}`;
    }
    
    return `$${cost.toFixed(2)}`;
  }

  /**
   * Get severity color for UI
   */
  getSeverityColor(severity: string): string {
    const colors: { [key: string]: string } = {
      critical: 'text-red-600 dark:text-red-400',
      high: 'text-orange-600 dark:text-orange-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      low: 'text-blue-600 dark:text-blue-400',
    };
    
    return colors[severity.toLowerCase()] || 'text-gray-600 dark:text-gray-400';
  }

  /**
   * Get severity badge color
   */
  getSeverityBadgeColor(severity: string): string {
    const colors: { [key: string]: string } = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    
    return colors[severity.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  /**
   * Get scan type display name
   */
  getScanTypeLabel(scanType?: string): string {
    const labels: { [key: string]: string } = {
      rule_based: 'Rule-Based',
      llm_based: 'LLM-Based',
      quick: 'Quick Scan',
      full: 'Full Scan',
      custom: 'Custom Scan',
    };
    
    return labels[scanType || ''] || 'Unknown';
  }

  /**
   * Get scan status color
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      completed: 'text-green-600 dark:text-green-400',
      running: 'text-blue-600 dark:text-blue-400',
      pending: 'text-yellow-600 dark:text-yellow-400',
      failed: 'text-red-600 dark:text-red-400',
    };
    
    return colors[status.toLowerCase()] || 'text-gray-600 dark:text-gray-400';
  }
}

// Export singleton instance
export const scanService = new ScanService();