// Enhanced interfaces for advanced metrics
export interface AdvancedMetrics {
  codeQualityMetrics: {
    totalLinesOfCode: number;
    totalFiles: number;
    languageDistribution: Array<{
      language: string;
      files: number;
      percentage: number;
    }>;
    technicalDebt: {
      totalHours: number;
      totalCost: number;
      priority: 'low' | 'medium' | 'high';
    };
    maintainabilityIndex: number;
    codeSmells: {
      blocker: number;
      critical: number;
      major: number;
      minor: number;
      info: number;
    };
    codeCoverage: {
      average: number;
      trend: string;
      target: number;
    };
    duplicatedLines: {
      percentage: number;
      totalLines: number;
      duplicatedBlocks: number;
    };
  };
  
  owaspAnalysis: {
    [key: string]: {
      name: string;
      totalVulnerabilities: number;
      severityBreakdown: {
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
      riskScore: number;
      complianceStatus: 'compliant' | 'non-compliant';
    };
  };
  
  complianceScores: {
    owaspTop10: number;
    pciDss: number;
    soc2: number;
    iso27001: number;
    gdpr: number;
  };
  
  vulnerabilityTrends: {
    monthlyTrends: Array<{
      month: string;
      discovered: number;
      fixed: number;
      critical: number;
      high: number;
    }>;
    meanTimeToResolve: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    topVulnerabilityTypes: Array<{
      type: string;
      count: number;
      critical: number;
      high: number;
    }>;
    securityHotspots: Array<{
      filePath: string;
      count: number;
      critical: number;
      high: number;
    }>;
  };
  
  teamMetrics: {
    scanFrequencyPerWeek: number;
    repositoriesUnderManagement: number;
    securityScoreImprovement: number;
    automationLevel: number;
    policyCompliance: number;
    developerSecurityScore: number;
  };
  
  technicalDebtDetailed: {
    totalDebtHours: number;
    totalDebtCost: number;
    debtBySeverity: {
      [key: string]: {
        hours: number;
        count: number;
        cost: number;
      };
    };
    debtRatio: number;
    priorityRecommendation: 'low' | 'medium' | 'high';
    estimatedSprintImpact: number;
    roiOfFixing: {
      maintenanceSavings: number;
      riskReduction: number;
      productivityGain: number;
    };
  };
}

export interface Vulnerability {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: string;
  scan_type?: 'standard' | 'custom';
  repository_id?: number;
  created_at: string;
}

export interface Scan {
  id: number;
  status: string;
  started_at: string;
  completed_at?: string;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  security_score?: number;
  code_coverage?: number;
  scan_type?: 'standard' | 'custom';
  repository_id: number;
  user_id: number;
  scan_metadata?: {
    scan_type?: string;
    rules_count?: number;
    custom_rules_count?: number;
  };
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  source: "github" | "gitlab" | "bitbucket";
  status: "active" | "scanning" | "failed" | "completed" | "pending";
  user_id: number;
  latest_scan?: Scan;
  vulnerabilities?: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  security_score?: number;
  code_coverage?: number;
  created_at: string;
}

export interface CustomScanResult {
  id: number;
  repository_id: number;
  repository_name: string;
  status: string;
  started_at: string;
  completed_at?: string;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  security_score: number;
  user_id: number;
  scan_metadata: {
    scan_type: string;
    rules_count: number;
    custom_rules_count?: number;
    files_scanned: number;
  };
}

export interface DashboardData {
  securityScore: number | null;  // 🔧 Allow null
  criticalIssues: number;
  totalVulnerabilities: number;
  activeProjects: number;
  scansToday: number;
  codeCoverage: number | null;  // 🔧 Allow null
  activeScanningProjects: number;
  totalProjects: number;
  recentActivity: Array<{
    id: number;
    action: string;
    time: string;
    status: "success" | "warning" | "info";
    scan_type: 'standard' | 'custom';
    repository_name: string;
    repository_id: number;
  }>;
  vulnerabilityTypes: Array<{
    type: string;
    count: number;
    severity: "critical" | "high" | "medium" | "low";
    scan_type: 'standard' | 'custom';
    repository_id?: number;
  }>;
  customScans: CustomScanResult[];
  customScanStats: {
    totalCustomScans: number;
    activeCustomScans: number;
    customScanVulnerabilities: number;
    customScanCritical: number;
  };
}

// Extended interface that includes both basic and advanced metrics
export interface EnhancedDashboardData extends DashboardData {
  advancedMetrics?: AdvancedMetrics;
}

export type TimeFilter = 'lastDay' | 'lastWeek' | 'lastMonth' | 'last6Months' | 'lastYear' | 'allTime';

export interface UserInfo {
  id: number;
  username: string;
  email: string;
}

export interface TimeFilterOptions {
  lastDay: { label: string; days: number };
  lastWeek: { label: string; days: number };
  lastMonth: { label: string; days: number };
  last6Months: { label: string; days: number };
  lastYear: { label: string; days: number };
  allTime: { label: string; days: null };
}

export type SelectedView = 'overview' | 'security' | 'quality' | 'compliance';