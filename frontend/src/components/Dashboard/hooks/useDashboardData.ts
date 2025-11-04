import { useState, useCallback } from 'react';
import { 
  EnhancedDashboardData, 
  TimeFilter, 
  Repository, 
  CustomScanResult, 
  UserInfo,
  AdvancedMetrics,
  Scan,
  TimeFilterOptions
} from '../types/dashboard.types';

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<EnhancedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const timeFilterOptions: TimeFilterOptions = {
    lastDay: { label: 'Last Day', days: 1 },
    lastWeek: { label: 'Last Week', days: 7 },
    lastMonth: { label: 'Last Month', days: 30 },
    last6Months: { label: 'Last 6 Months', days: 180 },
    lastYear: { label: 'Last Year', days: 365 },
    allTime: { label: 'All Time', days: null }
  };

  // Convert timeFilter to API format
  const getTimeRangeForAPI = (filter: TimeFilter): string => {
    const mapping: { [key in TimeFilter]: string } = {
      lastDay: '1d',
      lastWeek: '7d',
      lastMonth: '30d',
      last6Months: '180d',
      lastYear: '1y',
      allTime: 'all'
    };
    return mapping[filter] || '30d';
  };

  // 🔧 FIX: Wrap fetchAdvancedMetrics in useCallback
  const fetchAdvancedMetrics = useCallback(async (
    timeFilter: TimeFilter,
    selectedRepository: number | 'all'
  ): Promise<AdvancedMetrics | null> => {
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams({
        time_range: getTimeRangeForAPI(timeFilter),
        include_trends: 'true'
      });
      
      if (selectedRepository !== 'all') {
        params.append('repository_id', selectedRepository.toString());
      }

      const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/metrics/security-overview?${params}`;
      console.log('🔍 METRICS API CALL:', url);
      console.log('🔑 Token exists:', !!token);
      console.log('📊 Params:', Object.fromEntries(params));

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log('📡 Response Status:', response.status);
      console.log('📡 Response OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 RAW METRICS RESPONSE:', JSON.stringify(data, null, 2));
        
        // Check each section
        console.log('🧪 DATA AVAILABILITY CHECK:');
        console.log('- user_id:', data.user_id);
        console.log('- generated_at:', data.generated_at);
        console.log('- time_range:', data.time_range);
        console.log('- repository_filter:', data.repository_filter);
        
        console.log('📈 METRICS SECTIONS:');
        console.log('- security_metrics:', !!data.security_metrics, data.security_metrics);
        console.log('- code_quality_metrics:', !!data.code_quality_metrics, data.code_quality_metrics);
        console.log('- vulnerability_trends:', !!data.vulnerability_trends, data.vulnerability_trends);
        console.log('- compliance_scores:', !!data.compliance_scores, data.compliance_scores);
        console.log('- team_metrics:', !!data.team_metrics, data.team_metrics);
        console.log('- technical_debt:', !!data.technical_debt, data.technical_debt);

        // Transform the response to match our interface
        const transformedMetrics = {
          codeQualityMetrics: {
            ...data.code_quality_metrics,
            // Add security metrics to code quality metrics for consistency
            total_vulnerabilities: data.security_metrics?.total_vulnerabilities || 0,
            critical_vulnerabilities: data.security_metrics?.critical_vulnerabilities || 0,
            overall_security_score: data.security_metrics?.overall_security_score || 100,
            // Use the correct field for total files
            total_files: data.code_quality_metrics?.total_files || 0
          },
          owaspAnalysis: data.compliance_scores?.owasp_top10_analysis || {},
          complianceScores: data.compliance_scores?.compliance_scores || {},
          vulnerabilityTrends: data.vulnerability_trends || {},
          teamMetrics: data.team_metrics || {},
          technicalDebtDetailed: data.code_quality_metrics?.technical_debt ? {
            totalDebtHours: data.code_quality_metrics.technical_debt.total_hours || 0,
            totalDebtCost: data.code_quality_metrics.technical_debt.total_cost || 0,
            priorityRecommendation: data.code_quality_metrics.technical_debt.priority || 'low',
            debtBySeverity: {
              critical: {
                hours: (data.security_metrics?.critical_vulnerabilities || 0) * 16,
                count: data.security_metrics?.critical_vulnerabilities || 0,
                cost: (data.security_metrics?.critical_vulnerabilities || 0) * 16 * 85
              },
              high: {
                hours: (data.security_metrics?.high_vulnerabilities || 0) * 8,
                count: data.security_metrics?.high_vulnerabilities || 0,
                cost: (data.security_metrics?.high_vulnerabilities || 0) * 8 * 85
              },
              medium: {
                hours: (data.security_metrics?.risk_distribution?.medium || 0) * 4,
                count: data.security_metrics?.risk_distribution?.medium || 0,
                cost: (data.security_metrics?.risk_distribution?.medium || 0) * 4 * 85
              },
              low: {
                hours: (data.security_metrics?.risk_distribution?.low || 0) * 1,
                count: data.security_metrics?.risk_distribution?.low || 0,
                cost: (data.security_metrics?.risk_distribution?.low || 0) * 1 * 85
              }
            },
            debtRatio: data.code_quality_metrics.technical_debt.total_hours / Math.max(1, data.security_metrics?.total_vulnerabilities || 1),
            estimatedSprintImpact: Math.round((data.code_quality_metrics.technical_debt.total_hours || 0) / 80),
            roiOfFixing: {
              maintenanceSavings: (data.code_quality_metrics.technical_debt.total_cost || 0) * 0.3,
              riskReduction: (data.code_quality_metrics.technical_debt.total_cost || 0) * 0.5,
              productivityGain: (data.code_quality_metrics.technical_debt.total_cost || 0) * 0.2
            }
          } : null
        };

        console.log('🔄 TRANSFORMED METRICS:', transformedMetrics);
        console.log('📁 FILES SCANNED FROM API:', data.code_quality_metrics?.total_files);
        console.log('📁 FILES IN TRANSFORMED:', transformedMetrics.codeQualityMetrics.total_files);
        return transformedMetrics;
      } else {
        const errorText = await response.text();
        console.error('❌ METRICS API ERROR:', response.status, errorText);
        return null;
      }
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
      return null;
    }
  }, []); // 🔧 EMPTY DEPENDENCIES - this function is stable

  // 🔧 FIX: Wrap fetchUserInfo in useCallback
  const fetchUserInfo = useCallback(async (): Promise<UserInfo | null> => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('User info response:', data);
        return {
          id: data.id,
          username: data.username || data.github_username || data.email,
          email: data.email
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching user info:", err);
      return null;
    }
  }, []); // 🔧 EMPTY DEPENDENCIES

  // Filter data by time range
  const filterByTimeRange = useCallback((date: string, timeFilter: TimeFilter): boolean => {
    if (timeFilter === 'allTime') return true;
    
    const itemDate = new Date(date);
    const now = new Date();
    const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
    
    const filterDays = timeFilterOptions[timeFilter].days;
    return filterDays ? daysDiff <= filterDays : true;
  }, [timeFilterOptions]);

  // 🔧 FIX: Wrap fetchUserRepositories in useCallback
  const fetchUserRepositories = useCallback(async (
  userId: number, 
  timeFilter: TimeFilter, 
  selectedRepository: number | 'all'
): Promise<Repository[]> => {
  try {
    const token = localStorage.getItem("access_token");
    
    const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/repositories/`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Repositories response:', data);
      
      // 🔧 FIX: Get current userInfo from the parameter instead of state
      if (data.user_id && userId && data.user_id !== userId) {
        console.error("Data leakage detected - user IDs don't match");
        return [];
      }
      
      let repos = data.repositories || [];
      
      if (selectedRepository !== 'all') {
        repos = repos.filter((repo: Repository) => repo.id === selectedRepository);
      }
      
      if (timeFilter !== 'allTime') {
        const days = timeFilterOptions[timeFilter].days;
        if (days) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          repos = repos.filter((repo: Repository) => 
            !repo.latest_scan || new Date(repo.latest_scan.started_at) >= cutoffDate
          );
        }
      }
      
      return repos;
    }
    return [];
  } catch (err) {
    console.error("Error fetching user repositories:", err);
    return [];
  }
}, [timeFilterOptions]); // 🔧 STABLE DEPENDENCIES

  // 🔧 FIX: Wrap fetchUserCustomScanResults in useCallback
  const fetchUserCustomScanResults = useCallback(async (
  userId: number, 
  timeFilter: TimeFilter, 
  selectedRepository: number | 'all'
): Promise<CustomScanResult[]> => {
  try {
    const token = localStorage.getItem("access_token");
    
    const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/scans/custom/`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Custom scans response:', data);
      
      // 🔧 FIX: Get current userInfo from the parameter instead of state
      if (data.user_id && userId && data.user_id !== userId) {
        console.error("Data leakage detected - user IDs don't match");
        return [];
      }
      
      let scans = data.scans || [];
      
      if (selectedRepository !== 'all') {
        scans = scans.filter((scan: CustomScanResult) => scan.repository_id === selectedRepository);
      }
      
      if (timeFilter !== 'allTime') {
        const days = timeFilterOptions[timeFilter].days;
        if (days) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          scans = scans.filter((scan: CustomScanResult) => 
            new Date(scan.started_at) >= cutoffDate
          );
        }
      }
      
      return scans;
    }
    return [];
  } catch (err) {
    console.error("Error fetching user custom scans:", err);
    return [];
  }
}, [timeFilterOptions]); // 🔧 STABLE DEPENDENCIES

  return {
    dashboardData,
    setDashboardData,
    loading,
    setLoading,
    error,
    setError,
    repositories,
    setRepositories,
    userInfo,
    setUserInfo,
    timeFilterOptions,
    fetchAdvancedMetrics,
    fetchUserInfo,
    fetchUserRepositories,
    fetchUserCustomScanResults,
    filterByTimeRange
  };
};