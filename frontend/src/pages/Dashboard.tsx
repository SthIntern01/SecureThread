import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EtherealBackground } from "../components/ui/ethereal-background";
import AppSidebar from "../components/AppSidebar";
import { SecurityAlertsPieChart } from "@/components/ui/SecurityAlertsPieChart";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Activity,
  Users,
  ChevronRight,
  Play,
  Pause,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Eye,
  GitBranch,
  Settings,
  BarChart3,
  Menu,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";

// Extended types for custom scans
interface Vulnerability {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: string;
  scan_type?: 'standard' | 'custom';
}

interface Scan {
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
  scan_metadata?: {
    scan_type?: string;
    rules_count?: number;
    custom_rules_count?: number;
  };
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  source: "github" | "gitlab" | "bitbucket";
  status: "active" | "scanning" | "failed" | "completed" | "pending";
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
}

interface CustomScanResult {
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
  scan_metadata: {
    scan_type: string;
    rules_count: number;
    custom_rules_count?: number;
    files_scanned: number;
  };
}

interface DashboardData {
  securityScore: number;
  criticalIssues: number;
  totalVulnerabilities: number;
  activeProjects: number;
  scansToday: number;
  codeCoverage: number;
  activeScanningProjects: number;
  totalProjects: number;
  recentActivity: Array<{
    id: number;
    action: string;
    time: string;
    status: "success" | "warning" | "info";
    scan_type?: 'standard' | 'custom';
  }>;
  vulnerabilityTypes: Array<{
    type: string;
    count: number;
    severity: "critical" | "high" | "medium" | "low";
    scan_type?: 'standard' | 'custom';
  }>;
  customScans: CustomScanResult[];
  customScanStats: {
    totalCustomScans: number;
    activeCustomScans: number;
    customScanVulnerabilities: number;
    customScanCritical: number;
  };
}

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'custom'>('all');

  // Fetch custom scan results
  const fetchCustomScanResults = async (): Promise<CustomScanResult[]> => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/scans/custom/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.scans || [];
      }
      return [];
    } catch (err) {
      console.error("Error fetching custom scans:", err);
      return [];
    }
  };

  // Calculate security score algorithm
  const calculateSecurityScore = (repositories: Repository[], customScans: CustomScanResult[]): number => {
    const allScans: Scan[] = [];
    
    // Add repository scans
    repositories.forEach(repo => {
      if (repo.latest_scan) {
        allScans.push(repo.latest_scan);
      }
    });

    // Add custom scans
    customScans.forEach(customScan => {
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
        scan_metadata: customScan.scan_metadata
      });
    });

    if (allScans.length === 0) return 100;

    let totalScore = 0;
    let totalWeight = 0;

    allScans.forEach(scan => {
      const vulnerabilities = scan.total_vulnerabilities;
      
      // Weight vulnerabilities by severity
      const criticalWeight = scan.critical_count * 10;
      const highWeight = scan.high_count * 7;
      const mediumWeight = scan.medium_count * 4;
      const lowWeight = scan.low_count * 1;
      
      const totalWeightedVulns = criticalWeight + highWeight + mediumWeight + lowWeight;
      
      // Calculate score for this scan (0-100 scale)
      let scanScore = 100;
      if (vulnerabilities > 0) {
        const penalty = Math.min(85, totalWeightedVulns * 3);
        scanScore = Math.max(15, 100 - penalty);
      }
      
      totalScore += scanScore;
      totalWeight++;
    });

    return Math.round(totalScore / totalWeight);
  };

  // Calculate vulnerability types breakdown including custom scans
  const calculateVulnerabilityTypes = (repositories: Repository[], customScans: CustomScanResult[]) => {
    const typeCounts: { [key: string]: { count: number, scan_type: 'standard' | 'custom' } } = {};
    
    // Process repository scans
    repositories.forEach(repo => {
      if (repo.latest_scan) {
        const scan = repo.latest_scan;
        if (scan.critical_count > 0) {
          typeCounts['SQL Injection'] = { 
            count: (typeCounts['SQL Injection']?.count || 0) + scan.critical_count,
            scan_type: 'standard'
          };
        }
        if (scan.high_count > 0) {
          typeCounts['XSS'] = { 
            count: (typeCounts['XSS']?.count || 0) + scan.high_count,
            scan_type: 'standard'
          };
        }
        if (scan.medium_count > 0) {
          typeCounts['CSRF'] = { 
            count: (typeCounts['CSRF']?.count || 0) + scan.medium_count,
            scan_type: 'standard'
          };
        }
        if (scan.low_count > 0) {
          typeCounts['Outdated Dependencies'] = { 
            count: (typeCounts['Outdated Dependencies']?.count || 0) + scan.low_count,
            scan_type: 'standard'
          };
        }
      }
    });

    // Process custom scans
    customScans.forEach(scan => {
      if (scan.critical_count > 0) {
        typeCounts['Custom Rule - Critical'] = { 
          count: (typeCounts['Custom Rule - Critical']?.count || 0) + scan.critical_count,
          scan_type: 'custom'
        };
      }
      if (scan.high_count > 0) {
        typeCounts['Custom Rule - High'] = { 
          count: (typeCounts['Custom Rule - High']?.count || 0) + scan.high_count,
          scan_type: 'custom'
        };
      }
      if (scan.medium_count > 0) {
        typeCounts['Custom Rule - Medium'] = { 
          count: (typeCounts['Custom Rule - Medium']?.count || 0) + scan.medium_count,
          scan_type: 'custom'
        };
      }
      if (scan.low_count > 0) {
        typeCounts['Custom Rule - Low'] = { 
          count: (typeCounts['Custom Rule - Low']?.count || 0) + scan.low_count,
          scan_type: 'custom'
        };
      }
    });

    return Object.entries(typeCounts).map(([type, data]) => ({
      type,
      count: data.count,
      severity: type.includes('Critical') ? 'critical' as const :
                type.includes('High') ? 'high' as const :
                type.includes('Medium') ? 'medium' as const : 'low' as const,
      scan_type: data.scan_type
    })).filter(item => item.count > 0);
  };

  // Calculate recent activity including custom scans
  const calculateRecentActivity = (repositories: Repository[], customScans: CustomScanResult[]) => {
    const activities: Array<{
      id: number;
      action: string;
      time: string;
      status: "success" | "warning" | "info";
      scan_type: 'standard' | 'custom';
    }> = [];

    // Add repository scan activities
    repositories.forEach(repo => {
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
          scan_type: 'standard'
        });
      }
    });

    // Add custom scan activities
    customScans.forEach(scan => {
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
        scan_type: 'custom'
      });
    });

    // Sort by time (most recent first) and take latest 5
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  };

  // Calculate custom scan statistics
  const calculateCustomScanStats = (customScans: CustomScanResult[]) => {
    const totalCustomScans = customScans.length;
    const activeCustomScans = customScans.filter(scan => scan.status === 'running').length;
    const customScanVulnerabilities = customScans.reduce((total, scan) => total + scan.total_vulnerabilities, 0);
    const customScanCritical = customScans.reduce((total, scan) => total + scan.critical_count, 0);

    return {
      totalCustomScans,
      activeCustomScans,
      customScanVulnerabilities,
      customScanCritical
    };
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      
      // Fetch repositories with their latest scans
      const reposResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/repositories/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!reposResponse.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const reposData = await reposResponse.json();
      const repositories: Repository[] = reposData.repositories || [];

      // Fetch custom scan results
      const customScans = await fetchCustomScanResults();

      // Calculate dashboard metrics including custom scans
      const securityScore = calculateSecurityScore(repositories, customScans);
      const totalVulnerabilities = repositories.reduce((total, repo) => 
        total + (repo.vulnerabilities?.total || 0), 0
      ) + customScans.reduce((total, scan) => total + scan.total_vulnerabilities, 0);
      
      const criticalIssues = repositories.reduce((total, repo) => 
        total + (repo.vulnerabilities?.critical || 0), 0
      ) + customScans.reduce((total, scan) => total + scan.critical_count, 0);
      
      const activeProjects = repositories.filter(repo => 
        repo.status === "active" || repo.status === "completed"
      ).length;
      
      const activeScanningProjects = repositories.filter(repo => 
        repo.status === "scanning"
      ).length + customScans.filter(scan => scan.status === 'running').length;
      
      // Calculate average code coverage
      const reposWithCoverage = repositories.filter(repo => repo.code_coverage);
      const codeCoverage = reposWithCoverage.length > 0 
        ? Math.round(reposWithCoverage.reduce((sum, repo) => sum + (repo.code_coverage || 0), 0) / reposWithCoverage.length)
        : 0;

      // Count scans today
      const scansToday = repositories.filter(repo => 
        repo.latest_scan && 
        new Date(repo.latest_scan.started_at).toDateString() === new Date().toDateString()
      ).length + customScans.filter(scan => 
        new Date(scan.started_at).toDateString() === new Date().toDateString()
      ).length;

      const customScanStats = calculateCustomScanStats(customScans);

      const dynamicData: DashboardData = {
        securityScore,
        criticalIssues,
        totalVulnerabilities,
        activeProjects,
        scansToday,
        codeCoverage,
        activeScanningProjects,
        totalProjects: repositories.length,
        recentActivity: calculateRecentActivity(repositories, customScans),
        vulnerabilityTypes: calculateVulnerabilityTypes(repositories, customScans),
        customScans,
        customScanStats
      };

      setDashboardData(dynamicData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter data based on active tab
  const filteredVulnerabilityTypes = dashboardData?.vulnerabilityTypes.filter(vuln => 
    activeTab === 'all' || vuln.scan_type === activeTab
  ) || [];

  const filteredRecentActivity = dashboardData?.recentActivity.filter(activity => 
    activeTab === 'all' || activity.scan_type === activeTab
  ) || [];

  // Use mock data while loading or if no data
  const data = dashboardData || {
    securityScore: 0,
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
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "warning":
        return <Activity className="w-4 h-4 text-yellow-400" />;
      case "info":
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getScanTypeBadge = (scanType: 'standard' | 'custom') => {
    return (
      <Badge className={`text-xs ${
        scanType === 'custom' 
          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      }`}>
        {scanType === 'custom' ? 'Custom' : 'Standard'}
      </Badge>
    );
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
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white">Loading dashboard data...</p>
                  </div>
                </div>
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
            {/* Single unified container */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm mb-3">
                    <span className="font-medium text-white">SecureThread</span>
                    <ChevronRight size={16} className="text-white/60" />
                    <span className="font-medium text-white">Dashboard</span>
                  </div>
                  <Button 
                    onClick={fetchDashboardData} 
                    variant="ghost" 
                    size="sm" 
                    className="text-white/70 hover:text-white"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Security Dashboard
                    </h1>
                    <p className="text-white/80">
                      Monitor your security posture and vulnerabilities
                    </p>
                  </div>
                  
                  {/* Quick Action Badges */}
                  <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                      Critical Issues {data.criticalIssues} 
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Security Score {data.securityScore}%
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Custom Scans {data.customScanStats.totalCustomScans}
                    </Badge>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      Code Coverage {data.codeCoverage}%
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Scans Today {data.scansToday}
                    </Badge>
                  </div>
                </div>

                {/* Scan Type Tabs */}
                <div className="flex space-x-1 mt-4">
                  <Button
                    variant={activeTab === 'all' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab('all')}
                    className={activeTab === 'all' 
                      ? "bg-white/20 text-white" 
                      : "text-white/70 hover:text-white"
                    }
                  >
                    All Scans
                  </Button>
                  <Button
                    variant={activeTab === 'custom' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab('custom')}
                    className={activeTab === 'custom' 
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30" 
                      : "text-white/70 hover:text-white"
                    }
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Custom Scans
                  </Button>
                </div>
              </div>

              {/* Main Metrics Row */}
              <div className="p-6 border-b border-white/10">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl flex items-center justify-center">
                      <Shield className="w-8 h-8 text-green-400" />
                    </div>
                    <div className={`text-3xl font-bold mb-1 ${getSecurityScoreColor(data.securityScore)}`}>
                      {data.securityScore}%
                    </div>
                    <div className="text-white/70 font-medium">Security Score</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-500/20 to-red-600/30 rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="text-3xl font-bold text-red-400 mb-1">
                      {data.totalVulnerabilities}
                    </div>
                    <div className="text-white/70 font-medium">Total Vulnerabilities</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl flex items-center justify-center">
                      <FileText className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                      {data.customScanStats.totalCustomScans}
                    </div>
                    <div className="text-white/70 font-medium">Custom Scans</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center">
                      <Activity className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {data.activeScanningProjects}
                    </div>
                    <div className="text-white/70 font-medium">Active Scans</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl flex items-center justify-center">
                      <GitBranch className="w-8 h-8 text-orange-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {data.activeProjects}
                    </div>
                    <div className="text-white/70 font-medium">Active Projects</div>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid lg:grid-cols-3 gap-0">
                
                {/* Left Side - Security Overview, Recent Scans & Vulnerability Types */}
                <div className="lg:col-span-2 p-6 border-r border-white/10">
                  
                  {/* Security Overview */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-accent" />
                        Security Overview
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          Standard: {data.totalProjects}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          Custom: {data.customScanStats.totalCustomScans}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-white mb-2">
                        SecureThread Platform
                      </div>
                      <div className={`text-xl font-semibold ${getSecurityScoreColor(data.securityScore)}`}>
                        {data.securityScore}% Secure
                      </div>
                      <div className="text-white/60 text-sm mt-2">
                        {data.customScanStats.totalCustomScans} custom scans integrated
                      </div>
                    </div>
                  </div>

                  {/* Recent Scans */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-accent" />
                      Recent Scans
                    </h3>
                    <div className="space-y-1">
                      {filteredRecentActivity.length > 0 ? (
                        filteredRecentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(activity.status)}
                              <div>
                                <div className="text-white font-medium">{activity.action}</div>
                                <div className="text-white/60 text-xs">{activity.time}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getScanTypeBadge(activity.scan_type)}
                              <Badge
                                className={`text-xs ${
                                  activity.status === "success"
                                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                                    : activity.status === "warning"
                                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                }`}
                              >
                                {activity.status === "success" ? "Clean" : 
                                 activity.status === "warning" ? "Vulnerabilities" : "Scanning"}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-white/60">
                          No recent {activeTab === 'custom' ? 'custom' : ''} scans
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vulnerability Types */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-accent" />
                      Vulnerability Types
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {filteredVulnerabilityTypes.length > 0 ? (
                        filteredVulnerabilityTypes.map((vuln, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-white/80 text-sm">{vuln.type}</span>
                              {getScanTypeBadge(vuln.scan_type || 'standard')}
                            </div>
                            <Badge
                              className={`text-xs ${
                                vuln.severity === "critical"
                                  ? "bg-red-500/20 text-red-300 border-red-500/30"
                                  : vuln.severity === "high"
                                  ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                                  : vuln.severity === "medium"
                                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                              }`}
                            >
                              {vuln.count}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4 text-white/60">
                          No {activeTab === 'custom' ? 'custom scan' : ''} vulnerabilities found
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Pie Chart & Priority Queue */}
                <div className="p-6 flex flex-col">
                  
                  {/* Security Alerts Pie Chart */}
                  <div className="mb-4">
                    <SecurityAlertsPieChart 
                      critical={data.criticalIssues}
                      high={data.vulnerabilityTypes.filter(v => v.severity === 'high').reduce((sum, v) => sum + v.count, 0)}
                      medium={data.vulnerabilityTypes.filter(v => v.severity === 'medium').reduce((sum, v) => sum + v.count, 0)}
                      low={data.vulnerabilityTypes.filter(v => v.severity === 'low').reduce((sum, v) => sum + v.count, 0)}
                    />
                  </div>

                  {/* Priority Queue */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                      Priority Queue
                    </h3>
                    
                    <div className="bg-black/20 rounded-lg p-4 flex-1">
                      <div className="space-y-4">
                        {data.criticalIssues > 0 && (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <span className="text-white/90 text-sm">Critical vulnerabilities detected</span>
                              </div>
                              <span className="text-white/50 text-xs">Now</span>
                            </div>
                            <div className="text-white/60 text-xs ml-4 mb-3">
                              {data.criticalIssues} critical issue{data.criticalIssues !== 1 ? 's' : ''} across projects
                              {data.customScanStats.customScanCritical > 0 && (
                                <span className="text-purple-300 ml-1">
                                  ({data.customScanStats.customScanCritical} from custom scans)
                                </span>
                              )}
                            </div>
                          </>
                        )}
                        
                        {data.activeScanningProjects > 0 && (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span className="text-white/90 text-sm">Active scans running</span>
                              </div>
                              <span className="text-white/50 text-xs">Now</span>
                            </div>
                            <div className="text-white/60 text-xs ml-4 mb-3">
                              {data.activeScanningProjects} scan{data.activeScanningProjects !== 1 ? 's' : ''} in progress
                              {data.customScanStats.activeCustomScans > 0 && (
                                <span className="text-purple-300 ml-1">
                                  ({data.customScanStats.activeCustomScans} custom)
                                </span>
                              )}
                            </div>
                          </>
                        )}

                        {data.customScanStats.totalCustomScans > 0 && (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                <span className="text-white/90 text-sm">Custom scans completed</span>
                              </div>
                              <span className="text-white/50 text-xs">Today</span>
                            </div>
                            <div className="text-white/60 text-xs ml-4 mb-3">
                              {data.customScanStats.totalCustomScans} custom scan{data.customScanStats.totalCustomScans !== 1 ? 's' : ''} processed
                            </div>
                          </>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-white/90 text-sm">Security monitoring active</span>
                          </div>
                          <span className="text-white/50 text-xs">Now</span>
                        </div>
                        <div className="text-white/60 text-xs ml-4">
                          All systems operational
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;