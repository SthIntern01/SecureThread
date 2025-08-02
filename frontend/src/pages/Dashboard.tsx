import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, ArrowUp, Play, Pause, Square, Shield, Bug, CheckCircle, Clock, Zap, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Sidebar, SidebarBody, SidebarLink, SidebarSection } from '../components/ui/sidebar';
import { motion } from 'framer-motion';
import {
  IconActivity,
  IconSettings,
  IconBug,
  IconMoon,
  IconCircleCheck,
  IconDatabase,
  IconContainer,
  IconCloud,
  IconDeviceDesktop,
  IconApi,
  IconShield,
  IconDashboard,
  IconFolder,
  IconUsers,
  IconBrandGithub,
  IconMessageCircle,
  IconBook,
  IconHelp,
  IconUser,
} from '@tabler/icons-react';

const ResponsiveSidebar = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) => {
  // Feed items with proper icons
  const feedLinks = [
    {
      label: "Dashboard",
      href: "#",
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
      label: "Solved",
      href: "#",
      icon: <IconCircleCheck className="h-5 w-5 shrink-0" />,
      active: false,
    },
  ];

  // Infrastructure sections with icons
  const bottomLinks = [
    {
      label: "Feedback",
      href: "#",
      icon: <IconMessageCircle className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Settings",
      href: "#",
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Docs",
      href: "#",
      icon: <IconBook className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Help",
      href: "#",
      icon: <IconHelp className="h-5 w-5 shrink-0" />,
    },
  ];

  // Profile section
  const profileLink = {
    label: "Lora Piterson",
    href: "#",
    icon: <IconUser className="h-5 w-5 shrink-0" />,
  };
  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col">
          {/* Logo */}
          <Logo />
          
          {/* Feed Links */}
          <div className="mt-8 flex flex-col gap-2">
            {feedLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          {/* Bottom Links with larger gap to push to bottom */}
          <div className="mt-auto flex flex-col gap-2">
            {bottomLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          {/* Profile Section - stays at very bottom */}
          <div className="pt-4 border-t border-brand-gray/30">
            <SidebarLink link={profileLink} />
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
    >
      <span className="font-medium text-brand-light">SECURE THREAD</span>
    </a>
  );
};

const StatsRow = () => {
  const stats = [
    { label: 'Critical Issues', value: '12', bgColor: 'bg-red-500', textColor: 'text-white', trend: 'down' },
    { label: 'Security Score', value: '94%', bgColor: 'bg-green-500', textColor: 'text-white', trend: 'up' },
    { label: 'Code Coverage', value: '87%', bgColor: 'bg-accent', textColor: 'text-accent-foreground', pattern: true, trend: 'up' },
    { label: 'Scans Today', value: '8', bgColor: 'bg-brand-light', textColor: 'text-brand-black', trend: 'up' }
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bgColor} ${stat.textColor} px-4 py-2 rounded-full text-sm font-medium ${
            stat.pattern ? 'relative overflow-hidden' : ''
          } flex items-center space-x-2`}
        >
          {stat.pattern && (
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, white 4px, white 8px)'
            }}></div>
          )}
          <span className="relative font-semibold">{stat.label} {stat.value}</span>
          {stat.trend === 'up' ? (
            <TrendingUp size={14} className="relative" />
          ) : (
            <TrendingDown size={14} className="relative" />
          )}
        </div>
      ))}
    </div>
  );
};

const TopStatsCards = () => {
  const stats = [
    { number: '23', label: 'Active Projects', icon: <IconFolder className="w-6 h-6" /> },
    { number: '156', label: 'Vulnerabilities', icon: <IconBug className="w-6 h-6" /> },
    { number: '94%', label: 'Security Score', icon: <IconShield className="w-6 h-6" /> }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-brand-black">{stat.number}</div>
              <div className="text-sm text-brand-gray font-medium">{stat.label}</div>
            </div>
            <div className="text-accent opacity-60">
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SecurityOverviewCard = () => {
  const [expandedSection, setExpandedSection] = useState('Recent Scans');
  
  const sections = [
    { 
      name: 'Recent Scans', 
      content: (
        <div className="space-y-3 mt-3 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <span className="text-sm font-medium text-brand-black">E-commerce Platform</span>
                <div className="text-xs text-brand-gray">2 hours ago</div>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Clean</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <span className="text-sm font-medium text-brand-black">API Gateway</span>
                <div className="text-xs text-brand-gray">4 hours ago</div>
              </div>
            </div>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">3 Critical</span>
          </div>
        </div>
      )
    },
    { 
      name: 'Vulnerability Types', 
      content: (
        <div className="space-y-2 mt-3 pb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-black">SQL Injection</span>
            <span className="text-sm font-medium text-red-600">8</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-black">XSS</span>
            <span className="text-sm font-medium text-orange-600">12</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-brand-black">Dependency Issues</span>
            <span className="text-sm font-medium text-yellow-600">24</span>
          </div>
        </div>
      )
    },
    { name: 'Security Policies', content: null },
    { name: 'Compliance Status', content: null }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      {/* Security Overview Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full mb-4 border-4 border-white/50 flex items-center justify-center">
          <IconShield className="w-16 h-16 text-accent" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-brand-black mb-1">Security Overview</h3>
          <p className="text-sm text-brand-gray font-medium mb-3">SecureThread Platform</p>
          <div className="bg-accent/20 text-brand-black px-4 py-2 rounded-full text-sm font-bold">
            94% Secure
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div key={index} className="border-b border-gray-200/50 last:border-b-0">
            <button
              onClick={() => setExpandedSection(expandedSection === section.name ? null : section.name)}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <span className="text-sm font-semibold text-brand-black">{section.name}</span>
              {expandedSection === section.name ? (
                <ChevronUp size={16} className="text-brand-gray" />
              ) : (
                <ChevronDown size={16} className="text-brand-gray" />
              )}
            </button>
            {expandedSection === section.name && section.content && (
              <div>{section.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SecurityScoreWidget = () => {
  const scoreHistory = [
    { day: 'M', score: 87 },
    { day: 'T', score: 91 },
    { day: 'W', score: 89 },
    { day: 'T', score: 94 },
    { day: 'F', score: 96 },
    { day: 'S', score: 94 }
  ];
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-brand-black">Security Score</h3>
        <TrendingUp size={16} className="text-green-500" />
      </div>
      <p className="text-sm text-brand-gray mb-6 font-medium">Weekly security trend</p>
      
      <div className="flex items-end space-x-3 h-24 mb-4">
        {scoreHistory.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full relative">
              <div 
                className={`w-full rounded-t ${index === 4 ? 'bg-accent' : 'bg-gray-200'}`}
                style={{ height: `${item.score}%`, minHeight: '8px' }}
              ></div>
              {index === 4 && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded font-semibold whitespace-nowrap">
                  {item.score}%
                </div>
              )}
            </div>
            <span className="text-xs text-brand-gray mt-2 font-medium">{item.day}</span>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-brand-black">94%</div>
        <div className="text-sm text-brand-gray">Current Score</div>
      </div>
    </div>
  );
};

const ScanStatusWidget = () => {
  const [isScanning, setIsScanning] = useState(true);
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-brand-black">Active Scans</h3>
        <Activity size={16} className="text-blue-500" />
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="hsl(var(--accent))"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${75} ${225}`}
              strokeLinecap="round"
              className={isScanning ? "animate-pulse" : ""}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-brand-black">3/5</div>
            <div className="text-xs text-brand-gray font-medium">Projects</div>
          </div>
        </div>
        
        <div className="w-full space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-brand-black">E-commerce API</span>
            <span className="text-blue-600">Scanning...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-black">Mobile App</span>
            <span className="text-green-600">Complete</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
          >
            {isScanning ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
            <Square size={14} />
          </button>
          <button className="w-8 h-8 bg-brand-black rounded-full flex items-center justify-center text-brand-light hover:bg-brand-black/80 transition-colors">
            <Zap size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SecurityAlertsPanel = () => {
  const alerts = [
    { id: 1, type: 'Critical', message: 'SQL Injection detected in user authentication', project: 'E-commerce Platform', time: '5 min ago', status: 'new' },
    { id: 2, type: 'High', message: 'Outdated dependency with known CVE', project: 'Mobile Banking App', time: '15 min ago', status: 'investigating' },
    { id: 3, type: 'Medium', message: 'Weak password policy detected', project: 'Admin Dashboard', time: '1 hour ago', status: 'acknowledged' },
    { id: 4, type: 'High', message: 'Cross-site scripting vulnerability', project: 'User Portal', time: '2 hours ago', status: 'fixed' },
    { id: 5, type: 'Critical', message: 'Exposed API keys in repository', project: 'Payment Gateway', time: '3 hours ago', status: 'new' }
  ];
  
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-red-600';
      case 'investigating': return 'text-blue-600';
      case 'acknowledged': return 'text-yellow-600';
      case 'fixed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-brand-black">Security Alerts</h3>
        <span className="text-lg font-bold text-brand-black">12</span>
      </div>
      
      <div className="mb-6">
        <div className="flex space-x-2 mb-3">
          <div className="flex-1 bg-red-500 h-2 rounded-full"></div>
          <div className="flex-1 bg-orange-500 h-2 rounded-full"></div>
          <div className="flex-1 bg-yellow-500 h-2 rounded-full"></div>
          <div className="flex-1 bg-gray-200 h-2 rounded-full"></div>
        </div>
        <div className="flex justify-between text-xs text-brand-gray font-medium">
          <span>5 Critical</span>
          <span>4 High</span>
          <span>3 Medium</span>
          <span>0 Low</span>
        </div>
      </div>
      
      <div className="mb-4">
        <span className="text-sm font-semibold text-brand-gray">Recent Alerts</span>
      </div>
      
      <div className="bg-brand-black/95 backdrop-blur-sm rounded-xl p-4">
        <div className="text-brand-light text-sm font-semibold mb-4">Priority Queue</div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ${getAlertColor(alert.type)}`}>
                !
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-brand-light text-sm font-medium truncate">{alert.message}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-brand-gray text-xs truncate">{alert.project}</div>
                  <div className="text-brand-gray text-xs">{alert.time}</div>
                </div>
                <div className={`text-xs mt-1 ${getStatusColor(alert.status)} capitalize`}>
                  {alert.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RecentActivityStrip = () => {
  const activities = [
    { time: '8:00 am', type: 'scan', project: 'E-commerce Platform', status: 'completed' },
    { time: '9:15 am', type: 'alert', project: 'Mobile Banking App', status: 'critical' },
    { time: '10:30 am', type: 'scan', project: 'User Portal', status: 'in-progress' },
    { time: '11:45 am', type: 'fix', project: 'API Gateway', status: 'resolved' }
  ];
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scan': return <Shield className="w-3 h-3" />;
      case 'alert': return <AlertTriangle className="w-3 h-3" />;
      case 'fix': return <CheckCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'critical': return 'bg-red-500';
      case 'in-progress': return 'bg-blue-500';
      case 'resolved': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-semibold text-brand-black">Recent Activity</div>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-xs text-brand-gray font-medium w-16">{activity.time}</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getStatusColor(activity.status)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <div className="text-sm font-medium text-brand-black">{activity.project}</div>
                <div className="text-xs text-brand-gray capitalize">{activity.type} - {activity.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      {/* Ethereal Shadows Background - Black base with white moving effects */}
      <EtherealBackground 
        color="rgba(255, 255, 255, 0.6)"    // White shadows moving over black
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      
      {/* Responsive Sidebar */}
      <ResponsiveSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content Area - No navbar, clean layout with proper z-index */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation - White text for dark background */}
            <div className="flex items-center space-x-2 text-sm mb-4">
              <span className="font-medium text-white">SecureThread</span>
              <ChevronRight size={16} className="text-gray-300" />
              <span className="font-medium text-white">Dashboard</span>
            </div>
            
            {/* Main heading - White text for dark background */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6">Security Dashboard</h1>
            
            <StatsRow />
            <TopStatsCards />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
              <div className="lg:col-span-4 xl:col-span-3">
                <SecurityOverviewCard />
              </div>
              
              <div className="lg:col-span-5 xl:col-span-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <SecurityScoreWidget />
                  <ScanStatusWidget />
                </div>
                <RecentActivityStrip />
              </div>
              
              <div className="lg:col-span-3">
                <SecurityAlertsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;