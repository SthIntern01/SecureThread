import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EtherealBackground } from "../components/ui/ethereal-background";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth } from "../contexts/AuthContext";
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
} from "lucide-react";
import {
  IconDashboard,
  IconFolder,
  IconUsers,
  IconBrandGithub,
  IconCircleCheck,
  IconMessageCircle,
  IconSettings,
  IconBook,
  IconHelp,
  IconUser,
  IconLogout,
  IconRobot,
} from "@tabler/icons-react";

const Logo = () => {
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
    >
      <span className="font-medium text-brand-light">SECURE THREAD</span>
    </Link>
  );
};

const ResponsiveSidebar = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const feedLinks = [
    {
      label: "Dashboard",
      href: "/",
      icon: <IconDashboard className="h-5 w-5 shrink-0" />,
      active: true,
    },
    {
      label: "Projects",
      href: "/projects",
      icon: <IconFolder className="h-5 w-5 shrink-0" />,
      active: false,
    },
    {
      label: "Members",
      href: "/members",
      icon: <IconUsers className="h-5 w-5 shrink-0" />,
      active: false,
    },
    {
      label: "Integrations",
      href: "/integrations",
      icon: <IconBrandGithub className="h-5 w-5 shrink-0" />,
      active: false,
      count: "99+",
    },
    {
      label: "AI Chat",
      href: "/ai-chat",
      icon: <IconRobot className="h-5 w-5 shrink-0" />,
      active: false,
    },
    {
      label: "Solved",
      href: "/solved",
      icon: <IconCircleCheck className="h-5 w-5 shrink-0" />,
      active: false,
    },
  ];

  const bottomLinks = [
    {
      label: "Feedback",
      href: "/feedback",
      icon: <IconMessageCircle className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Docs",
      href: "/docs",
      icon: <IconBook className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Help",
      href: "/help",
      icon: <IconHelp className="h-5 w-5 shrink-0" />,
    },
  ];

  const profileLink = {
    label: user?.full_name || user?.github_username || "User",
    href: "#",
    icon: user?.avatar_url ? (
      <img
        src={user.avatar_url}
        alt={user.full_name || user.github_username}
        className="h-5 w-5 rounded-full shrink-0"
      />
    ) : (
      <IconUser className="h-5 w-5 shrink-0" />
    ),
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogout(!showLogout);
  };

  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col">
          <Logo />

          <div className="mt-8 flex flex-col gap-2">
            {feedLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            {bottomLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          <div className="pt-4 border-t border-brand-gray/30 relative">
            <div onClick={handleProfileClick} className="cursor-pointer">
              <SidebarLink link={profileLink} />
            </div>

            {showLogout && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <button
                  onClick={() => {
                    logout();
                    setShowLogout(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <IconLogout className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock data - replace with actual API calls
  const dashboardData = {
    securityScore: 94,
    criticalIssues: 12,
    totalVulnerabilities: 156,
    activeProjects: 1,
    scansToday: 8,
    codeCoverage: 87,
    activeScanningProjects: 3,
    totalProjects: 5,
    recentScans: [
      {
        id: 1,
        name: "E-commerce Platform",
        status: "Complete",
        time: "2 hours ago",
        result: "Clean",
      },
      {
        id: 2,
        name: "API Gateway",
        status: "Scanning",
        time: "4 hours ago",
        result: "3 Critical",
      },
      {
        id: 3,
        name: "Mobile Banking App",
        status: "Complete",
        time: "1 day ago",
        result: "2 High",
      },
    ],
    vulnerabilityTypes: [
      { type: "SQL Injection", count: 45, severity: "critical" },
      { type: "XSS", count: 32, severity: "high" },
      { type: "CSRF", count: 28, severity: "medium" },
      { type: "Outdated Dependencies", count: 51, severity: "low" },
    ],
    recentActivity: [
      {
        id: 1,
        action: "E-commerce Platform scan completed",
        time: "8:00 am",
        status: "success",
      },
      {
        id: 2,
        action: "Mobile Banking App scan completed",
        time: "9:15 am",
        status: "warning",
      },
      {
        id: 3,
        action: "API Gateway scan started",
        time: "10:30 am",
        status: "info",
      },
    ],
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

  const getActivityBadge = (status: string) => {
    switch (status) {
      case "success":
        return "Clean";
      case "warning":
        return "2 High";
      case "info":
        return "3 Critical";
      default:
        return "Clean";
    }
  };

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      <ResponsiveSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-6 lg:p-8">
          <div className="max-w-[95%] mx-auto">
            {/* Single unified container */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-white/30 shadow-2xl overflow-hidden min-h-[85vh]">
              
              {/* Header Section */}
              <div className="p-6 border-b border-white/10">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm mb-3">
                  <span className="font-medium text-white">SecureThread</span>
                  <ChevronRight size={16} className="text-white/60" />
                  <span className="font-medium text-white">Dashboard</span>
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
                      Critical Issues {dashboardData.criticalIssues} 
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Security Score {dashboardData.securityScore}%
                    </Badge>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      Code Coverage {dashboardData.codeCoverage}%
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Scans Today {dashboardData.scansToday}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Main Metrics Row */}
              <div className="p-6 border-b border-white/10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl flex items-center justify-center">
                      <Shield className="w-8 h-8 text-green-400" />
                    </div>
                    <div className={`text-3xl font-bold mb-1 ${getSecurityScoreColor(dashboardData.securityScore)}`}>
                      {dashboardData.securityScore}%
                    </div>
                    <div className="text-white/70 font-medium">Security Score</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-500/20 to-red-600/30 rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="text-3xl font-bold text-red-400 mb-1">
                      {dashboardData.totalVulnerabilities}
                    </div>
                    <div className="text-white/70 font-medium">Vulnerabilities</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center">
                      <Activity className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {dashboardData.activeScanningProjects}/{dashboardData.totalProjects}
                    </div>
                    <div className="text-white/70 font-medium">Active Scans</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl flex items-center justify-center">
                      <GitBranch className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                      {dashboardData.activeProjects}
                    </div>
                    <div className="text-white/70 font-medium">Active Projects</div>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid lg:grid-cols-3 gap-0">
                
                {/* Left Side - Security Overview, Recent Scans & Vulnerability Types */}
                <div className="lg:col-span-2 p-6 border-r border-white/10">
                  
                  {/* Security Overview - SecureThread Platform takes full width */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-accent" />
                        Security Overview
                      </h3>
                      <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* SecureThread Platform takes full width */}
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-white mb-2">
                        SecureThread Platform
                      </div>
                      <div className={`text-xl font-semibold ${getSecurityScoreColor(dashboardData.securityScore)}`}>
                        {dashboardData.securityScore}% Secure
                      </div>
                    </div>
                  </div>

                  {/* Recent Scans - now using Recent Activity data */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-accent" />
                      Recent Scans
                    </h3>
                    <div className="space-y-1">
                      {dashboardData.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(activity.status)}
                            <div>
                              <div className="text-white font-medium">{activity.action}</div>
                              <div className="text-white/60 text-xs">{activity.time}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={`text-xs ${
                                getActivityBadge(activity.status) === "Clean"
                                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                                  : getActivityBadge(activity.status).includes("Critical")
                                  ? "bg-red-500/20 text-red-300 border-red-500/30"
                                  : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                              }`}
                            >
                              {getActivityBadge(activity.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vulnerability Types */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-accent" />
                      Vulnerability Types
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {dashboardData.vulnerabilityTypes.map((vuln, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <span className="text-white/80 text-sm">{vuln.type}</span>
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
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side - Pie Chart & Priority Queue (Bigger) */}
                <div className="p-6 flex flex-col">
                  
                  {/* Security Alerts Pie Chart */}
                  <div className="mb-4">
                    <SecurityAlertsPieChart />
                  </div>

                  {/* Priority Queue - Made bigger to fill remaining space */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                      Priority Queue
                    </h3>
                    
                    <div className="bg-black/20 rounded-lg p-4 flex-1">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span className="text-white/90 text-sm">SQL Injection detected</span>
                          </div>
                          <span className="text-white/50 text-xs">5 min ago</span>
                        </div>
                        <div className="text-white/60 text-xs ml-4 mb-3">E-commerce Platform - New</div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span className="text-white/90 text-sm">Outdated dependencies</span>
                          </div>
                          <span className="text-white/50 text-xs">15 min ago</span>
                        </div>
                        <div className="text-white/60 text-xs ml-4 mb-3">Mobile Banking - Investigating</div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span className="text-white/90 text-sm">Weak password policy</span>
                          </div>
                          <span className="text-white/50 text-xs">1 hour ago</span>
                        </div>
                        <div className="text-white/60 text-xs ml-4 mb-3">Admin Dashboard - Acknowledged</div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-white/90 text-sm">Code review needed</span>
                          </div>
                          <span className="text-white/50 text-xs">2 hours ago</span>
                        </div>
                        <div className="text-white/60 text-xs ml-4 mb-3">Payment Gateway - In Progress</div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-white/90 text-sm">Security patch applied</span>
                          </div>
                          <span className="text-white/50 text-xs">3 hours ago</span>
                        </div>
                        <div className="text-white/60 text-xs ml-4">User Auth Service - Resolved</div>
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