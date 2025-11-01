import { useState, useCallback } from 'react';
import { TimeFilter, Repository, CustomScanResult, Scan } from '../types/dashboard.types';

export const useFilters = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('allTime');
  const [selectedRepository, setSelectedRepository] = useState<number | 'all'>('all');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  const timeFilterOptions = {
    lastDay: { label: 'Last Day', days: 1 },
    lastWeek: { label: 'Last Week', days: 7 },
    lastMonth: { label: 'Last Month', days: 30 },
    last6Months: { label: 'Last 6 Months', days: 180 },
    lastYear: { label: 'Last Year', days: 365 },
    allTime: { label: 'All Time', days: null }
  };

  const filterByTimeRange = useCallback((date: string, filter: TimeFilter): boolean => {
    if (filter === 'allTime') return true;
    
    const itemDate = new Date(date);
    const now = new Date();
    const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
    
    const filterDays = timeFilterOptions[filter].days;
    return filterDays ? daysDiff <= filterDays : true;
  }, []);

  const calculateSecurityScore = useCallback((
    repositories: Repository[], 
    customScans: CustomScanResult[],
    filter: TimeFilter,
    repositoryFilter: number | 'all'
  ): number => {
    const filteredRepos = repositories.filter(repo => {
      if (repositoryFilter !== 'all' && repo.id !== repositoryFilter) return false;
      if (repo.latest_scan && !filterByTimeRange(repo.latest_scan.started_at, filter)) return false;
      return true;
    });

    const filteredCustomScans = customScans.filter(scan => {
      if (repositoryFilter !== 'all' && scan.repository_id !== repositoryFilter) return false;
      if (!filterByTimeRange(scan.started_at, filter)) return false;
      return true;
    });

    const allScans: Scan[] = [];
    
    filteredRepos.forEach(repo => {
      if (repo.latest_scan) {
        allScans.push({
          ...repo.latest_scan,
          repository_id: repo.id,
          user_id: repo.user_id
        });
      }
    });

    filteredCustomScans.forEach(customScan => {
      allScans.push({
        id: customScan.id,
        status: customScan.status,
        started_at: customScan.started_at,
        completed_at: customScan.completed_at,
        total_vulnerabilities: customScan.total_vulnerabilities,
        critical_count: customScan.critical_count,
        high_count: customScan.high_count,
        medium_count: customScan.medium_count,
        low_count: customScan.low_count,
        security_score: customScan.security_score,
        scan_type: 'custom',
        repository_id: customScan.repository_id,
        user_id: customScan.user_id,
        scan_metadata: customScan.scan_metadata
      });
    });

    if (allScans.length === 0) return 100;

    let totalScore = 0;
    let totalWeight = 0;

    allScans.forEach(scan => {
      const vulnerabilities = scan.total_vulnerabilities;
      
      const criticalWeight = scan.critical_count * 10;
      const highWeight = scan.high_count * 7;
      const mediumWeight = scan.medium_count * 4;
      const lowWeight = scan.low_count * 1;
      
      const totalWeightedVulns = criticalWeight + highWeight + mediumWeight + lowWeight;
      
      let scanScore = 100;
      if (vulnerabilities > 0) {
        const penalty = Math.min(85, totalWeightedVulns * 3);
        scanScore = Math.max(15, 100 - penalty);
      }
      
      totalScore += scanScore;
      totalWeight++;
    });

    return Math.round(totalScore / totalWeight);
  }, [filterByTimeRange]);

  const calculateVulnerabilityTypes = useCallback((
    repositories: Repository[], 
    customScans: CustomScanResult[],
    filter: TimeFilter,
    repositoryFilter: number | 'all'
  ) => {
    const typeCounts: { [key: string]: { 
      count: number, 
      scan_type: 'standard' | 'custom',
      severity: "critical" | "high" | "medium" | "low",
      repository_id?: number
    } } = {};
    
    const filteredRepos = repositories.filter(repo => {
      if (repositoryFilter !== 'all' && repo.id !== repositoryFilter) return false;
      if (repo.latest_scan && !filterByTimeRange(repo.latest_scan.started_at, filter)) return false;
      return true;
    });

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

    const filteredCustomScans = customScans.filter(scan => {
      if (repositoryFilter !== 'all' && scan.repository_id !== repositoryFilter) return false;
      if (!filterByTimeRange(scan.started_at, filter)) return false;
      return true;
    });

    filteredCustomScans.forEach(scan => {
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
  }, [filterByTimeRange]);

  const calculateRecentActivity = useCallback((
    repositories: Repository[], 
    customScans: CustomScanResult[],
    filter: TimeFilter,
    repositoryFilter: number | 'all'
  ) => {
    const activities: Array<{
      id: number;
      action: string;
      time: string;
      status: "success" | "warning" | "info";
      scan_type: 'standard' | 'custom';
      repository_name: string;
      repository_id: number;
    }> = [];

    const filteredRepos = repositories.filter(repo => {
      if (repositoryFilter !== 'all' && repo.id !== repositoryFilter) return false;
      if (repo.latest_scan && !filterByTimeRange(repo.latest_scan.started_at, filter)) return false;
      return true;
    });

    filteredRepos.forEach(repo => {
      if (repo.latest_scan) {
        const scan = repo.latest_scan;
        let status: "success" | "warning" | "info" = "info";
        
        if (scan.status === "completed") {
          status = scan.total_vulnerabilities === 0 ? "success" : "warning";
        } else if (scan.status === "running") {
          status = "info";
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

    const filteredCustomScans = customScans.filter(scan => {
      if (repositoryFilter !== 'all' && scan.repository_id !== repositoryFilter) return false;
      if (!filterByTimeRange(scan.started_at, filter)) return false;
      return true;
    });

    filteredCustomScans.forEach(scan => {
      let status: "success" | "warning" | "info" = "info";
      
      if (scan.status === "completed") {
        status = scan.total_vulnerabilities === 0 ? "success" : "warning";
      } else if (scan.status === "running") {
        status = "info";
      }

      const timeAgo = scan.completed_at 
        ? new Date(scan.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(scan.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      activities.push({
        id: scan.id,
        action: `Custom scan for ${scan.repository_name} ${scan.status === "running" ? "started" : "completed"}`,
        time: timeAgo,
        status,
        scan_type: 'custom',
        repository_name: scan.repository_name,
        repository_id: scan.repository_id
      });
    });

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [filterByTimeRange]);

  const calculateCustomScanStats = useCallback((
    customScans: CustomScanResult[],
    filter: TimeFilter,
    repositoryFilter: number | 'all'
  ) => {
    const filteredScans = customScans.filter(scan => {
      if (repositoryFilter !== 'all' && scan.repository_id !== repositoryFilter) return false;
      if (!filterByTimeRange(scan.started_at, filter)) return false;
      return true;
    });

    const totalCustomScans = filteredScans.length;
    const activeCustomScans = filteredScans.filter(scan => scan.status === 'running').length;
    const customScanVulnerabilities = filteredScans.reduce((total, scan) => total + scan.total_vulnerabilities, 0);
    const customScanCritical = filteredScans.reduce((total, scan) => total + scan.critical_count, 0);

    return {
      totalCustomScans,
      activeCustomScans,
      customScanVulnerabilities,
      customScanCritical
    };
  }, [filterByTimeRange]);

  const handleTimeFilterChange = useCallback((filter: TimeFilter) => {
    setTimeFilter(filter);
    setShowTimeDropdown(false);
  }, []);

  const handleRepositoryChange = useCallback((repoId: number | 'all') => {
    setSelectedRepository(repoId);
    setShowRepoDropdown(false);
  }, []);

  const toggleTimeDropdown = useCallback(() => {
    setShowRepoDropdown(false);
    setShowTimeDropdown(!showTimeDropdown);
  }, [showTimeDropdown]);

  const toggleRepoDropdown = useCallback(() => {
    setShowTimeDropdown(false);
    setShowRepoDropdown(!showRepoDropdown);
  }, [showRepoDropdown]);

  return {
    timeFilter,
    selectedRepository,
    showTimeDropdown,
    showRepoDropdown,
    timeFilterOptions,
    calculateSecurityScore,
    calculateVulnerabilityTypes,
    calculateRecentActivity,
    calculateCustomScanStats,
    handleTimeFilterChange,
    handleRepositoryChange,
    toggleTimeDropdown,
    toggleRepoDropdown,
    filterByTimeRange
  };
};