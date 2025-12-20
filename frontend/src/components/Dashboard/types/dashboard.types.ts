// Enhanced interfaces for advanced metrics
export interface AdvancedMetrics {
  codeQualityMetrics:  {
    total_lines_of_code: number;  // ✅ snake_case to match backend
    total_files:  number;
    language_distribution: Array<{
      language: string;
      files:  number;
      percentage: number;
    }>;
    technical_debt: {
      total_hours: number;
      total_cost: number;
      priority:  'low' | 'medium' | 'high';
    };
    maintainability_index: number;
    code_smells: {
      blocker: number;
      critical:  number;
      major: number;
      minor: number;
      info: number;
    };
    code_coverage: {
      average:  number | null;  // ✅ Allow null
      trend: string;
      target: number;
    };
    duplicated_lines: {
      percentage: number;
      total_lines: number;
      duplicated_blocks: number;
    };
    complexity_score: number;  // ✅ Add missing field
    total_vulnerabilities: number;  // ✅ Add from security_metrics
    critical_vulnerabilities: number;
    overall_security_score: number;
  };
  
  owaspAnalysis: {
    [key: string]: {
      name: string;
      vulnerabilities_found: number;  // ✅ Backend uses this
      risk_level: string;
      compliance_score: number;
    };
  };
  
  complianceScores: {
    owasp_top10: number;  // ✅ snake_case
    pci_dss:  number;
    soc2: number;
    iso27001: number;
    gdpr: number;
  };
  
  vulnerabilityTrends: {
    monthly_trends: Array<{
      month: string;
      discovered:  number;
      fixed: number;
      critical: number;
      high: number;
    }>;
    mean_time_to_resolve: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    top_vulnerability_types: Array<{
      type: string;
      count:  number;
      critical: number;
      high: number;
    }>;
    security_hotspots: Array<{
      file_path: string;  // ✅ snake_case
      count: number;
      critical: number;
      high: number;
    }>;
    security_metrics?:  {  // ✅ Add nested structure
      risk_distribution?:  {
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
    };
  };
  
  teamMetrics: {
    scan_frequency_per_week: number;  // ✅ snake_case
    repositories_under_management: number;
    security_score_improvement: number;
    automation_level: number;
    policy_compliance: number;
    security_training_completion: number;  // ✅ Add missing
    incident_response_time: string;  // ✅ Add missing
  };
  
  technicalDebtDetailed: {
    totalDebtHours: number;  // Keep camelCase (already transformed)
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
    slaBreachAnalysis?:  {  // ✅ Add optional fields
      breachPercentage:  number;
      avgDaysOpen: number;
    };
    roiOfFixing: {
      maintenanceSavings: number;
      riskReduction: number;
      productivityGain: number;
      netRoi?:  number;  // ✅ Add optional
    };
    debtByAgeBucket?:  {  // ✅ Add optional
      [key: string]: {
        count: number;
        cost: number;
      };
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