import React, { useState, useEffect, useRef } from "react";
import { ThemeBackground } from "../ui/theme-background";
import AppSidebar from "../AppSidebar";

// Import header components
import DashboardHeader from './components/Header/DashboardHeader';
import NavigationTabs from './components/Header/NavigationTabs';
import FilterControls from './components/Header/FilterControls';

// Import view components
import OverviewView from './components/Overview/OverviewView';
import SecurityView from './components/Security/SecurityView';
import QualityView from './components/Quality/QualityView';
import ComplianceView from './components/Compliance/ComplianceView';
import MetricsRow from './components/Overview/MetricsRow';

// Import shared components
import LoadingState from './components/shared/LoadingState';
import ErrorState from './components/shared/ErrorState';

// Import types
import { 
  EnhancedDashboardData, 
  SelectedView,
  TimeFilter,
  Repository,
  UserInfo,
  TimeFilterOptions
} from './types/dashboard.types';

const DashboardContainer = () => {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<SelectedView>('overview');
  const [dashboardData, setDashboardData] = useState<EnhancedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Filter states
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('allTime');
  const [selectedRepository, setSelectedRepository] = useState<number | 'all'>('all');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  // Prevent multiple fetches
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastFetchKey = useRef<string>('');

  const timeFilterOptions: TimeFilterOptions = {
    lastDay: { label: 'Last Day', days: 1 },
    lastWeek: { label: 'Last Week', days: 7 },
    lastMonth: { label: 'Last Month', days: 30 },
    last6Months: { label: 'Last 6 Months', days: 180 },
    lastYear: { label: 'Last Year', days: 365 },
    allTime: { label: 'All Time', days: null }
  };

  // Helper function for time range API format
  const getTimeRangeForAPI = (filter: TimeFilter): string => {
    const mapping: { [key in TimeFilter]: string } = {
      lastDay: '1d',
      lastWeek: '7d', 
      lastMonth: '30d',
      last6Months: '180d',
      lastYear: '1y',
      allTime: 'all'
    };
    return mapping[filter] || 'all';
  };

  // 🔧 HELPER FUNCTION: Calculate Recent Activity with Repository Filtering
  const calculateRecentActivity = (repos: any[], scans: any[]) => {
    const activities: any[] = [];
    
    // Filter repositories based on selected repository
    const filteredRepos = selectedRepository === 'all' 
      ? repos 
      : repos.filter(repo => repo.id === selectedRepository);
    
    // Add repository scan activities
    filteredRepos.forEach((repo, index) => {
      if (repo.latest_scan) {
        const scan = repo.latest_scan;
        let status: "success" | "warning" | "info" = "info";
        
        if (scan.status === "completed") {
          status = scan.total_vulnerabilities === 0 ? "success" : "warning";
        }

        const timeAgo = scan.completed_at 
          ? new Date(scan.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(scan.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        activities.push({
          id: scan.id,
          action: `${repo.name} scan ${scan.status === "running" ? "started" : "completed"}`,
          time: timeAgo,
          status,
          scan_type: 'standard',
          repository_name: repo.name,
          repository_id: repo.id
        });
      }
    });

    // Filter custom scans based on selected repository
    const filteredScans = selectedRepository === 'all' 
      ? scans 
      : scans.filter(scan => scan.repository_id === selectedRepository);

    // Add custom scan activities
    filteredScans.slice(0, 5).forEach((scan, index) => {
      let status: "success" | "warning" | "info" = "info";
      
      if (scan.status === "completed") {
        status = scan.total_vulnerabilities === 0 ? "success" : "warning";
      }

      const timeAgo = scan.completed_at 
        ? new Date(scan.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(scan.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      activities.push({
        id: scan.id,
        action: `Custom scan for ${scan.repository_name || 'repository'} ${scan.status === "running" ? "started" : "completed"}`,
        time: timeAgo,
        status,
        scan_type: 'custom',
        repository_name: scan.repository_name || 'Unknown',
        repository_id: scan.repository_id
      });
    });

    // Sort by time and return unique activities with proper keys
    return activities
      .sort((a, b) => new Date(`1970/01/01 ${b.time}`).getTime() - new Date(`1970/01/01 ${a.time}`).getTime())
      .slice(0, 5)
      .map((activity, index) => ({
        ...activity,
        uniqueKey: `${activity.scan_type}-${activity.id}-${activity.repository_id}-${index}` // Unique key for React
      }));
  };

  // 🔧 HELPER FUNCTION: Calculate Vulnerability Types with Repository Filtering
  const calculateVulnerabilityTypes = (repos: any[], scans: any[]) => {
    const typeCounts: { [key: string]: { 
      count: number, 
      scan_type: 'standard' | 'custom',
      severity: "critical" | "high" | "medium" | "low",
      repository_id?: number
    } } = {};
    
    // Filter repositories based on selected repository
    const filteredRepos = selectedRepository === 'all' 
      ? repos 
      : repos.filter(repo => repo.id === selectedRepository);
    
    // Process repository scans
    filteredRepos.forEach(repo => {
      if (repo.latest_scan) {
        const scan = repo.latest_scan;
        if (scan.critical_count > 0) {
          const key = 'SQL Injection';
          typeCounts[key] = { 
            count: (typeCounts[key]?.count || 0) + scan.critical_count,
            scan_type: 'standard',
            severity: 'critical',
            repository_id: repo.id
          };
        }
        if (scan.high_count > 0) {
          const key = 'XSS';
          typeCounts[key] = { 
            count: (typeCounts[key]?.count || 0) + scan.high_count,
            scan_type: 'standard',
            severity: 'high',
            repository_id: repo.id
          };
        }
        if (scan.medium_count > 0) {
          const key = 'CSRF';
          typeCounts[key] = { 
            count: (typeCounts[key]?.count || 0) + scan.medium_count,
            scan_type: 'standard',
            severity: 'medium',
            repository_id: repo.id
          };
        }
        if (scan.low_count > 0) {
          const key = 'Outdated Dependencies';
          typeCounts[key] = { 
            count: (typeCounts[key]?.count || 0) + scan.low_count,
            scan_type: 'standard',
            severity: 'low',
            repository_id: repo.id
          };
        }
      }
    });

    // Filter custom scans based on selected repository
    const filteredScans = selectedRepository === 'all' 
      ? scans 
      : scans.filter(scan => scan.repository_id === selectedRepository);

    // Process custom scans
    filteredScans.forEach(scan => {
      if (scan.critical_count > 0) {
        const key = 'Custom Rule - Critical';
        typeCounts[key] = { 
          count: (typeCounts[key]?.count || 0) + scan.critical_count,
          scan_type: 'custom',
          severity: 'critical',
          repository_id: scan.repository_id
        };
      }
      if (scan.high_count > 0) {
        const key = 'Custom Rule - High';
        typeCounts[key] = { 
          count: (typeCounts[key]?.count || 0) + scan.high_count,
          scan_type: 'custom',
          severity: 'high',
          repository_id: scan.repository_id
        };
      }
      if (scan.medium_count > 0) {
        const key = 'Custom Rule - Medium';
        typeCounts[key] = { 
          count: (typeCounts[key]?.count || 0) + scan.medium_count,
          scan_type: 'custom',
          severity: 'medium',
          repository_id: scan.repository_id
        };
      }
      if (scan.low_count > 0) {
        const key = 'Custom Rule - Low';
        typeCounts[key] = { 
          count: (typeCounts[key]?.count || 0) + scan.low_count,
          scan_type: 'custom',
          severity: 'low',
          repository_id: scan.repository_id
        };
      }
    });

    return Object.entries(typeCounts).map(([type, data]) => ({
      type,
      count: data.count,
      severity: data.severity,
      scan_type: data.scan_type,
      repository_id: data.repository_id
    })).filter(item => item.count > 0);
  };

  // 🔧 REPOSITORY-AWARE FETCH FUNCTION
  const fetchAllData = async (forceRefresh = false) => {
    const fetchKey = `${timeFilter}-${selectedRepository}`;
    
    // Prevent duplicate fetches
    if (!forceRefresh && (fetchingRef.current || lastFetchKey.current === fetchKey)) {
      console.log('🚫 FETCH BLOCKED - Duplicate or already fetching');
      return;
    }

    if (!mountedRef.current) {
      console.log('🚫 FETCH BLOCKED - Component unmounted');
      return;
    }

    fetchingRef.current = true;
    lastFetchKey.current = fetchKey;
    setLoading(true);
    setError("");

    try {
      console.log('🔄 REPOSITORY-FILTERED FETCH STARTED - Key:', fetchKey);
      console.log('🎯 Selected Repository:', selectedRepository);
      console.log('🎯 Time Filter:', timeFilter);
      
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token");
      }

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      // 🔧 BUILD REPOSITORY-FILTERED API URLS
      const buildApiUrl = (endpoint: string) => {
        const url = new URL(`${baseUrl}${endpoint}`);
        
        // Add repository filter if specific repo is selected
        if (selectedRepository !== 'all') {
          url.searchParams.append('repository_id', selectedRepository.toString());
        }
        
        // Add time filter for metrics endpoint
        if (endpoint.includes('metrics')) {
          url.searchParams.append('time_range', getTimeRangeForAPI(timeFilter));
          url.searchParams.append('include_trends', 'true');
        }
        
        console.log(`📡 ${endpoint} URL:`, url.toString());
        return url.toString();
      };

      // Fetch data with repository filtering
      const [userResponse, reposResponse, scansResponse, metricsResponse] = await Promise.all([
        fetch(buildApiUrl('/api/v1/auth/me'), { headers }),
        fetch(buildApiUrl('/api/v1/repositories/'), { headers }),
        fetch(buildApiUrl('/api/v1/scans/custom/'), { headers }),
        fetch(buildApiUrl('/api/v1/metrics/security-overview'), { headers })
      ]);

      if (!mountedRef.current) {
        console.log('🚫 PROCESSING BLOCKED - Component unmounted during fetch');
        return;
      }

      // Process all responses
      const [userData, reposData, scansData, metricsData] = await Promise.all([
        userResponse.json(),
        reposResponse.json(),
        scansResponse.json(),
        metricsResponse.json()
      ]);

      console.log('✅ REPOSITORY-FILTERED DATA FETCHED');
      console.log('📊 Repos Data:', reposData);
      console.log('📊 Scans Data:', scansData);
      console.log('📊 Metrics Data:', metricsData);

      // Set user info
      const processedUserInfo = {
        id: userData.id,
        username: userData.username || userData.github_username || userData.email,
        email: userData.email
      };
      setUserInfo(processedUserInfo);

      // 🔧 FILTER REPOSITORIES BASED ON SELECTION
      let processedRepos = reposData.repositories || [];
      let allRepos = [...processedRepos]; // Keep all repos for dropdown
      
      if (selectedRepository !== 'all') {
        processedRepos = processedRepos.filter((repo: any) => repo.id === selectedRepository);
        console.log('🎯 FILTERED TO SINGLE REPO:', processedRepos);
      }
      setRepositories(allRepos); // Always set all repos for the dropdown

      // 🔧 FILTER SCANS BASED ON REPOSITORY SELECTION
      let processedScans = scansData.scans || [];
      if (selectedRepository !== 'all') {
        processedScans = processedScans.filter((scan: any) => scan.repository_id === selectedRepository);
        console.log('🎯 FILTERED SCANS FOR REPO:', processedScans);
      }

      // Transform metrics (these should already be filtered by the API if supported)
      const transformedMetrics = {
        codeQualityMetrics: {
          ...metricsData.code_quality_metrics,
          total_vulnerabilities: metricsData.security_metrics?.total_vulnerabilities || 0,
          critical_vulnerabilities: metricsData.security_metrics?.critical_vulnerabilities || 0,
          overall_security_score: metricsData.security_metrics?.overall_security_score || 100,
          total_files: metricsData.code_quality_metrics?.total_files || 0
        },
        owaspAnalysis: metricsData.compliance_scores?.owasp_top10_analysis || {},
        complianceScores: metricsData.compliance_scores?.compliance_scores || {},
        vulnerabilityTrends: metricsData.vulnerability_trends || {},
        teamMetrics: metricsData.team_metrics || {},
        technicalDebtDetailed: metricsData.code_quality_metrics?.technical_debt ? {
          totalDebtHours: metricsData.code_quality_metrics.technical_debt.total_hours || 0,
          totalDebtCost: metricsData.code_quality_metrics.technical_debt.total_cost || 0,
          priorityRecommendation: metricsData.code_quality_metrics.technical_debt.priority || 'low',
          estimatedSprintImpact: Math.round((metricsData.code_quality_metrics.technical_debt.total_hours || 0) / 80),
          roiOfFixing: {
            maintenanceSavings: (metricsData.code_quality_metrics.technical_debt.total_cost || 0) * 0.3,
            riskReduction: (metricsData.code_quality_metrics.technical_debt.total_cost || 0) * 0.5,
            productivityGain: (metricsData.code_quality_metrics.technical_debt.total_cost || 0) * 0.2
          }
        } : null
      };

const calculateRepositorySpecificMetrics = () => {

   if (allRepos.length === 0) {
    console.log('🚫 EMPTY ACCOUNT - No repositories found');
    return {
      securityScore: null,     // 🔧 NULL for empty accounts
      totalVulnerabilities: 0,
      criticalIssues: 0,
      totalFiles: 0,
      activeProjects: 0,
      totalProjects: 0,
      activeScanningProjects: 0,
      isEmpty: true            // 🔧 Flag for empty state UI
    };
  }

  if (selectedRepository === 'all') {
    // Use API totals when viewing all repositories
    const apiSecurityScore = transformedMetrics.codeQualityMetrics.overall_security_score;
    
    console.log('🔍 ALL REPOS - API Security Score:', apiSecurityScore);
    
    return {
      securityScore: Math.round(apiSecurityScore || 100),
      totalVulnerabilities: transformedMetrics.codeQualityMetrics.total_vulnerabilities || 0,
      criticalIssues: transformedMetrics.codeQualityMetrics.critical_vulnerabilities || 0,
      totalFiles: transformedMetrics.codeQualityMetrics.total_files || 0,
      activeProjects: allRepos.filter((r: any) => r.status === "active" || r.status === "completed").length,
      totalProjects: allRepos.length,
      activeScanningProjects: allRepos.filter((r: any) => r.status === "scanning").length
    };
  } else {
    // Single repository view
    const selectedRepo = processedRepos[0];
    if (!selectedRepo) {
      return {
        securityScore: 100,
        totalVulnerabilities: 0,
        criticalIssues: 0,
        totalFiles: 0,
        activeProjects: 0,
        totalProjects: 0,
        activeScanningProjects: 0
      };
    }

    const latestRepoScan = selectedRepo.latest_scan;
    const repoVulns = latestRepoScan?.total_vulnerabilities || 0;
    const repoCritical = latestRepoScan?.critical_count || 0;
    
    // 🔧 FIX: Try multiple sources for security score
    let securityScore = 100;
    
    console.log('🔍 SINGLE REPO SECURITY SCORE SOURCES:');
    console.log('- Repository:', selectedRepo.name);
    console.log('- Latest scan security_score:', latestRepoScan?.security_score);
    console.log('- Repository security_score:', selectedRepo.security_score);
    console.log('- API overall_security_score:', transformedMetrics.codeQualityMetrics.overall_security_score);
    
    // Priority order for security score sources:
    // 1. Latest scan security score
    if (latestRepoScan?.security_score !== undefined && latestRepoScan.security_score !== null) {
      securityScore = latestRepoScan.security_score;
      console.log('✅ Using scan security score:', securityScore);
    }
    // 2. Repository security score
    else if (selectedRepo.security_score !== undefined && selectedRepo.security_score !== null) {
      securityScore = selectedRepo.security_score;
      console.log('✅ Using repository security score:', securityScore);
    }
    // 3. API security score for this repo
    else if (transformedMetrics.codeQualityMetrics.overall_security_score !== undefined && 
             transformedMetrics.codeQualityMetrics.overall_security_score !== null) {
      securityScore = transformedMetrics.codeQualityMetrics.overall_security_score;
      console.log('✅ Using API security score:', securityScore);
    }
    // 4. Fallback: Calculate from vulnerabilities (only if no backend score available)
    else if (repoVulns > 0) {
      const repoHigh = latestRepoScan?.high_count || 0;
      const repoMedium = latestRepoScan?.medium_count || 0;
      const repoLow = latestRepoScan?.low_count || 0;
      
      // Simple fallback calculation
      const deduction = (repoCritical * 25) + (repoHigh * 10) + (repoMedium * 5) + (repoLow * 1);
      securityScore = Math.max(5, Math.min(100, 100 - deduction));
      console.log('⚠️ Using fallback calculation:', securityScore);
    }

    const calculatedMetrics = {
      securityScore: Math.round(securityScore),
      totalVulnerabilities: repoVulns,
      criticalIssues: repoCritical,
      totalFiles: latestRepoScan?.total_files_scanned || 0,
      activeProjects: (selectedRepo.status === "active" || selectedRepo.status === "completed") ? 1 : 0,
      totalProjects: 1,
      activeScanningProjects: selectedRepo.status === "scanning" ? 1 : 0
    };

    console.log('🎯 FINAL SINGLE REPO METRICS:');
    console.log('- Repository:', selectedRepo.name);
    console.log('- Vulnerabilities:', calculatedMetrics.totalVulnerabilities);
    console.log('- Security Score:', calculatedMetrics.securityScore, '%');
    console.log('- Should NOT be 0% with vulnerabilities!');

    return calculatedMetrics;
  }
};

      const repoMetrics = calculateRepositorySpecificMetrics();

      console.log('🎯 REPOSITORY-SPECIFIC METRICS:', repoMetrics);
      console.log('🎯 Selected Repository ID:', selectedRepository);
      console.log('🎯 Processed Repos Count:', processedRepos.length);
      console.log('🎯 Processed Scans Count:', processedScans.length);

      // Calculate today's scans
      const today = new Date().toDateString();
      const scansToday = processedRepos.filter(repo => 
        repo.latest_scan && 
        new Date(repo.latest_scan.started_at).toDateString() === today
      ).length + processedScans.filter(scan => 
        new Date(scan.started_at).toDateString() === today
      ).length;

      // 🔧 CREATE FINAL DASHBOARD DATA WITH REPOSITORY FILTERING
      const finalDashboardData: EnhancedDashboardData = {
        securityScore: Math.round(repoMetrics.securityScore),
        criticalIssues: repoMetrics.criticalIssues,
        totalVulnerabilities: repoMetrics.totalVulnerabilities,
        activeProjects: repoMetrics.activeProjects,
        scansToday: scansToday,
        codeCoverage: metricsData.code_quality_metrics?.code_coverage?.average !== null && 
              metricsData.code_quality_metrics?.code_coverage?.average !== undefined
              ? Math.round(metricsData.code_quality_metrics.code_coverage.average) 
              : null,
        activeScanningProjects: repoMetrics.activeScanningProjects,
        totalProjects: repoMetrics.totalProjects,
        recentActivity: calculateRecentActivity(processedRepos, processedScans),
        vulnerabilityTypes: calculateVulnerabilityTypes(processedRepos, processedScans),
        customScans: processedScans,
        customScanStats: {
          totalCustomScans: processedScans.length,
          activeCustomScans: processedScans.filter((s: any) => s.status === 'running').length,
          customScanVulnerabilities: processedScans.reduce((total: number, scan: any) => total + (scan.total_vulnerabilities || 0), 0),
          customScanCritical: processedScans.reduce((total: number, scan: any) => total + (scan.critical_count || 0), 0)
        },
        advancedMetrics: transformedMetrics
      };

      setDashboardData(finalDashboardData);
      
      console.log('🎯 FINAL REPOSITORY-FILTERED DASHBOARD DATA:');
      console.log('- Security Score:', finalDashboardData.securityScore);
      console.log('- Total Vulnerabilities:', finalDashboardData.totalVulnerabilities);
      console.log('- Total Projects:', finalDashboardData.totalProjects);
      console.log('- Files Scanned:', repoMetrics.totalFiles);
      console.log('- Selected Repository:', selectedRepository);
      console.log('- Recent Activity Count:', finalDashboardData.recentActivity.length);
      console.log('- Vulnerability Types Count:', finalDashboardData.vulnerabilityTypes.length);

    } catch (err: any) {
      console.error("❌ REPOSITORY-FILTERED FETCH ERROR:", err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  // 🔧 FILTER HANDLERS WITH REPOSITORY AWARENESS
  const handleTimeFilterChange = (filter: TimeFilter) => {
    console.log('🔄 Time filter changed:', filter, 'Repository:', selectedRepository);
    setTimeFilter(filter);
    setShowTimeDropdown(false);
    // Clear last fetch key to force refresh
    lastFetchKey.current = '';
    setTimeout(() => fetchAllData(true), 100);
  };

  const handleRepositoryChange = (repoId: number | 'all') => {
    console.log('🔄 Repository filter changed:', repoId, 'Time:', timeFilter);
    setSelectedRepository(repoId);
    setShowRepoDropdown(false);
    // Clear last fetch key to force refresh
    lastFetchKey.current = '';
    setTimeout(() => fetchAllData(true), 100);
  };

  const toggleTimeDropdown = () => {
    setShowRepoDropdown(false);
    setShowTimeDropdown(!showTimeDropdown);
  };

  const toggleRepoDropdown = () => {
    setShowTimeDropdown(false);
    setShowRepoDropdown(!showRepoDropdown);
  };

  // 🔧 SINGLE useEffect - only runs once on mount
  useEffect(() => {
    console.log('🎯 COMPONENT MOUNTED - Initial fetch with repository filtering');
    fetchAllData(true);
    
    // Cleanup
    return () => {
      mountedRef.current = false;
    };
  }, []); // 🔧 EMPTY DEPENDENCY ARRAY - NO LOOPS

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (!target.closest('[data-dropdown="time"]') && showTimeDropdown) {
        setShowTimeDropdown(false);
      }
      
      if (!target.closest('[data-dropdown="repo"]') && showRepoDropdown) {
        setShowRepoDropdown(false);
      }
    };

    if (showTimeDropdown || showRepoDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTimeDropdown, showRepoDropdown]);

  // Default data
const data = dashboardData || {
  securityScore: null,      // 🔧 NULL instead of default
  criticalIssues: 0,
  totalVulnerabilities: 0,
  activeProjects: 0,
  scansToday: 0,
  codeCoverage: null,       // 🔧 NULL instead of default
  activeScanningProjects: 0,
  totalProjects: 0,
  recentActivity: [],
  vulnerabilityTypes: [],
  customScans: [],
  customScanStats: {
    totalCustomScans: 0,
    activeCustomScans: 0,
    customScanVulnerabilities: 0,
    customScanCritical: 0
  },
  advancedMetrics: undefined
};

  if (loading && !dashboardData) {
    return (
      <div className="w-full h-screen font-sans relative flex overflow-hidden">
        <ThemeBackground />
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
          <div className="p-4 lg:p-8">
            <div className="max-w-[95%] mx-auto">
              <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
                <LoadingState />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen font-sans relative flex overflow-hidden">
        <ThemeBackground />
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
          <div className="p-4 lg:p-8">
            <div className="max-w-[95%] mx-auto">
              <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
                <ErrorState message={error} onRetry={() => fetchAllData(true)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <ThemeBackground />

      <AppSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-8">
          <div className="max-w-[95%] mx-auto">
            <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <DashboardHeader 
                userInfo={userInfo}
                data={data}
                loading={loading}
                onRefresh={() => fetchAllData(true)}
              />

              {/* Navigation Tabs */}
              <div className="px-6">
                <NavigationTabs 
                  selectedView={selectedView}
                  onViewChange={setSelectedView}
                />

                {/* Filter Controls */}
                <FilterControls 
                  timeFilter={timeFilter}
                  selectedRepository={selectedRepository}
                  repositories={repositories}
                  timeFilterOptions={timeFilterOptions}
                  showTimeDropdown={showTimeDropdown}
                  showRepoDropdown={showRepoDropdown}
                  onTimeFilterChange={handleTimeFilterChange}
                  onRepositoryChange={handleRepositoryChange}
                  onToggleTimeDropdown={toggleTimeDropdown}
                  onToggleRepoDropdown={toggleRepoDropdown}
                />
              </div>

              {/* Main Metrics Row */}
              <MetricsRow data={data} />

              {/* Content Based on Selected View */}
              {selectedView === 'overview' && (
                <OverviewView 
                  data={data}
                  userInfo={userInfo}
                  timeFilterOptions={timeFilterOptions}
                  timeFilter={timeFilter}
                  selectedRepository={selectedRepository}
                  repositories={repositories}
                />
              )}

              {selectedView === 'security' && (
                <SecurityView data={data} />
              )}

              {selectedView === 'quality' && (
                <QualityView data={data} />
              )}

              {selectedView === 'compliance' && (
                <ComplianceView data={data} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;