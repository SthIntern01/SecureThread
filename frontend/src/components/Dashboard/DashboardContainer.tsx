import React, { useState, useEffect } from "react";
import { EtherealBackground } from "../ui/ethereal-background";
import AppSidebar from "../AppSidebar";

// Import all hooks
import { useDashboardData } from './hooks/useDashboardData';
import { useAdvancedMetrics } from './hooks/useAdvancedMetrics';
import { useFilters } from './hooks/useFilters';

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
  TimeFilter 
} from './types/dashboard.types';

const DashboardContainer = () => {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<SelectedView>('overview');

  // Custom hooks
  const {
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
  } = useDashboardData();

  const {
    timeFilter,
    selectedRepository,
    showTimeDropdown,
    showRepoDropdown,
    calculateSecurityScore,
    calculateVulnerabilityTypes,
    calculateRecentActivity,
    calculateCustomScanStats,
    handleTimeFilterChange,
    handleRepositoryChange,
    toggleTimeDropdown,
    toggleRepoDropdown
  } = useFilters();

  // Enhanced fetch dashboard data with advanced metrics
  const fetchDashboardData = async () => {
  try {
    setLoading(true);
    setError("");

    // Get current user info first
    const currentUser = await fetchUserInfo();
    if (!currentUser) {
      setError("Unable to authenticate user");
      return;
    }
    setUserInfo(currentUser);

    // Fetch user's repositories and scans
    const userRepositories = await fetchUserRepositories(currentUser.id, timeFilter, selectedRepository);
    setRepositories(userRepositories);
    const userCustomScans = await fetchUserCustomScanResults(currentUser.id, timeFilter, selectedRepository);

    // 🔧 FIX: Fetch advanced metrics FIRST and use as primary data source
    const advancedMetrics = await fetchAdvancedMetrics(timeFilter, selectedRepository);

    // 🔧 FIX: Use API metrics as the source of truth, fall back to frontend calculations
    let securityScore, totalVulnerabilities, criticalIssues;
    
    if (advancedMetrics && advancedMetrics.codeQualityMetrics) {
      // Use API data as primary source
      console.log('✅ USING API METRICS AS SOURCE OF TRUTH');
      securityScore = Math.round(advancedMetrics.codeQualityMetrics.overall_security_score || 100);
      totalVulnerabilities = advancedMetrics.codeQualityMetrics.total_vulnerabilities || 0;
      criticalIssues = advancedMetrics.codeQualityMetrics.critical_vulnerabilities || 0;
      
      console.log('📊 API METRICS USED:');
      console.log('- Security Score:', securityScore);
      console.log('- Total Vulnerabilities:', totalVulnerabilities);
      console.log('- Critical Issues:', criticalIssues);
    } else {
      // Fallback to frontend calculation
      console.log('⚠️ FALLING BACK TO FRONTEND CALCULATIONS');
      securityScore = calculateSecurityScore(userRepositories, userCustomScans, timeFilter, selectedRepository);
      
      const filteredRepos = userRepositories.filter(repo => {
        if (selectedRepository !== 'all' && repo.id !== selectedRepository) return false;
        if (repo.latest_scan && !filterByTimeRange(repo.latest_scan.started_at, timeFilter)) return false;
        return true;
      });

      const filteredCustomScans = userCustomScans.filter(scan => {
        if (selectedRepository !== 'all' && scan.repository_id !== selectedRepository) return false;
        if (!filterByTimeRange(scan.started_at, timeFilter)) return false;
        return true;
      });

      totalVulnerabilities = filteredRepos.reduce((total, repo) => 
        total + (repo.vulnerabilities?.total || 0), 0
      ) + filteredCustomScans.reduce((total, scan) => total + scan.total_vulnerabilities, 0);
      
      criticalIssues = filteredRepos.reduce((total, repo) => 
        total + (repo.vulnerabilities?.critical || 0), 0
      ) + filteredCustomScans.reduce((total, scan) => total + scan.critical_count, 0);
      
      console.log('📊 FRONTEND CALCULATIONS:');
      console.log('- Security Score:', securityScore);
      console.log('- Total Vulnerabilities:', totalVulnerabilities);
      console.log('- Critical Issues:', criticalIssues);
    }
    
    // Calculate other metrics normally
    const filteredRepos = userRepositories.filter(repo => {
      if (selectedRepository !== 'all' && repo.id !== selectedRepository) return false;
      if (repo.latest_scan && !filterByTimeRange(repo.latest_scan.started_at, timeFilter)) return false;
      return true;
    });

    const filteredCustomScans = userCustomScans.filter(scan => {
      if (selectedRepository !== 'all' && scan.repository_id !== selectedRepository) return false;
      if (!filterByTimeRange(scan.started_at, timeFilter)) return false;
      return true;
    });

    const activeProjects = filteredRepos.filter(repo => 
      repo.status === "active" || repo.status === "completed"
    ).length;
    
    const activeScanningProjects = filteredRepos.filter(repo => 
      repo.status === "scanning"
    ).length + filteredCustomScans.filter(scan => scan.status === 'running').length;
    
    const reposWithCoverage = filteredRepos.filter(repo => repo.code_coverage);
    const codeCoverage = reposWithCoverage.length > 0 
      ? Math.round(reposWithCoverage.reduce((sum, repo) => sum + (repo.code_coverage || 0), 0) / reposWithCoverage.length)
      : 0;

    const today = new Date().toDateString();
    const scansToday = filteredRepos.filter(repo => 
      repo.latest_scan && 
      new Date(repo.latest_scan.started_at).toDateString() === today
    ).length + filteredCustomScans.filter(scan => 
      new Date(scan.started_at).toDateString() === today
    ).length;

    const customScanStats = calculateCustomScanStats(userCustomScans, timeFilter, selectedRepository);

    const dynamicData: EnhancedDashboardData = {
      securityScore,
      criticalIssues,
      totalVulnerabilities,
      activeProjects,
      scansToday,
      codeCoverage,
      activeScanningProjects,
      totalProjects: filteredRepos.length,
      recentActivity: calculateRecentActivity(userRepositories, userCustomScans, timeFilter, selectedRepository),
      vulnerabilityTypes: calculateVulnerabilityTypes(userRepositories, userCustomScans, timeFilter, selectedRepository),
      customScans: filteredCustomScans,
      customScanStats,
      advancedMetrics
    };

    console.log('🎯 FINAL DASHBOARD DATA CONSISTENCY CHECK:');
    console.log('- Dashboard Total Vulnerabilities:', dynamicData.totalVulnerabilities);
    console.log('- API Security Metrics Total:', advancedMetrics?.codeQualityMetrics?.total_vulnerabilities);
    console.log('- Dashboard Critical:', dynamicData.criticalIssues);
    console.log('- API Critical:', advancedMetrics?.codeQualityMetrics?.critical_vulnerabilities);

    setDashboardData(dynamicData);
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    setError("Failed to load dashboard data");
  } finally {
    setLoading(false);
  }
};

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (!target.closest('[data-dropdown="time"]') && showTimeDropdown) {
        toggleTimeDropdown();
      }
      
      if (!target.closest('[data-dropdown="repo"]') && showRepoDropdown) {
        toggleRepoDropdown();
      }
    };

    if (showTimeDropdown || showRepoDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTimeDropdown, showRepoDropdown, toggleTimeDropdown, toggleRepoDropdown]);

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter, selectedRepository]);

  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeFilter, selectedRepository]);

  // Use empty data for new users
  const data = dashboardData || {
    securityScore: 100,
    criticalIssues: 0,
    totalVulnerabilities: 0,
    activeProjects: 0,
    scansToday: 0,
    codeCoverage: 0,
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
        <EtherealBackground
          color="rgba(255, 255, 255, 0.6)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.8, scale: 1.2 }}
          sizing="fill"
        />
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
          <div className="p-4 lg:p-8">
            <div className="max-w-[95%] mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
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
        <EtherealBackground
          color="rgba(255, 255, 255, 0.6)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.8, scale: 1.2 }}
          sizing="fill"
        />
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
          <div className="p-4 lg:p-8">
            <div className="max-w-[95%] mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                <ErrorState message={error} onRetry={fetchDashboardData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      <AppSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-8">
          <div className="max-w-[95%] mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <DashboardHeader 
                userInfo={userInfo}
                data={data}
                loading={loading}
                onRefresh={fetchDashboardData}
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