import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { 
  Search, 
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Filter,
  Download,
  Eye,
  GitCommit,
  User,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';
import {
  IconBrandGithub,
  IconBrandGitlab,
  IconBrandDocker,
  IconCode,
} from '@tabler/icons-react';

interface SolvedIssue {
  id: number;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  project: string;
  projectId: number;
  repository: string;
  source: 'github' | 'gitlab' | 'docker';
  resolvedBy: string;
  resolvedAt: string;
  resolutionTime: string;
  category: 'vulnerability' | 'code-quality' | 'security-hotspot' | 'bug';
  cve?: string;
  fixCommit?: string;
  pullRequest?: string;
  effort: 'easy' | 'medium' | 'hard';
}

const SolvedIssueCard = ({ issue, onClick }: { issue: SolvedIssue; onClick: () => void }) => {
  const getSeverityColor = () => {
    switch (issue.severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = () => {
    switch (issue.category) {
      case 'vulnerability':
        return <AlertTriangle className="w-4 h-4" />;
      case 'code-quality':
        return <IconCode className="w-4 h-4" />;
      case 'security-hotspot':
        return <ShieldCheck className="w-4 h-4" />;
      case 'bug':
        return <Zap className="w-4 h-4" />;
    }
  };

  const getSourceIcon = () => {
    switch (issue.source) {
      case 'github':
        return <IconBrandGithub className="w-4 h-4" />;
      case 'gitlab':
        return <IconBrandGitlab className="w-4 h-4" />;
      case 'docker':
        return <IconBrandDocker className="w-4 h-4" />;
    }
  };

  const getEffortColor = () => {
    switch (issue.effort) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'hard':
        return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div 
      className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex items-center space-x-2 mt-1">
            <div className="text-white/70">
              {getCategoryIcon()}
            </div>
            <div className="text-white/70">
              {getSourceIcon()}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-white group-hover:text-accent transition-colors truncate">
                {issue.title}
              </h3>
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            </div>
            
            <p className="text-sm text-white/70 line-clamp-2 mb-3">
              {issue.description}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-white/70">
              <span className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{issue.resolvedBy}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{issue.resolutionTime}</span>
              </span>
              <span>{issue.resolvedAt}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2 ml-4">
          <Badge className={`text-xs px-2 py-1 ${getSeverityColor()}`}>
            {issue.severity}
          </Badge>
          <Badge className={`text-xs px-2 py-1 ${getEffortColor()}`}>
            {issue.effort}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center space-x-4 text-sm text-white/70">
          <span className="font-medium">{issue.project}</span>
          <span>•</span>
          <span className="truncate font-mono text-xs">{issue.repository}</span>
          {issue.cve && (
            <>
              <span>•</span>
              <span className="font-mono text-xs">{issue.cve}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {issue.pullRequest && (
            <Badge variant="outline" className="text-xs bg-white/10 border-white/20 text-white/70">
              PR #{issue.pullRequest}
            </Badge>
          )}
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ResolutionTimelineCard = () => {
  const timelineData = [
    { month: 'Jan', resolved: 45, target: 50 },
    { month: 'Feb', resolved: 52, target: 50 },
    { month: 'Mar', resolved: 38, target: 50 },
    { month: 'Apr', resolved: 67, target: 50 },
    { month: 'May', resolved: 58, target: 50 },
    { month: 'Jun', resolved: 72, target: 50 },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Resolution Timeline</h3>
        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white/70">
          <Download className="w-3 h-3 mr-1" />
          Export
        </Button>
      </div>
      
      <div className="flex items-end space-x-3 h-32 mb-4">
        {timelineData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full relative">
              <div 
                className="w-full bg-accent rounded-t transition-all"
                style={{ height: `${(data.resolved / 80) * 100}%`, minHeight: '8px' }}
              ></div>
              <div 
                className="w-full bg-white/20 rounded-t absolute bottom-0 -z-10"
                style={{ height: `${(data.target / 80) * 100}%`, minHeight: '4px' }}
              ></div>
            </div>
            <span className="text-xs text-white/70 mt-2">{data.month}</span>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent rounded"></div>
            <span className="text-white/70">Resolved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white/20 rounded"></div>
            <span className="text-white/70">Target</span>
          </div>
        </div>
        <span className="text-white/70">Issues per month</span>
      </div>
    </div>
  );
};

const Solved = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  const solvedIssues: SolvedIssue[] = [
    {
      id: 1,
      title: "SQL Injection vulnerability in user authentication",
      description: "Parameterized queries implemented to prevent SQL injection attacks in the login system. Updated all database queries to use prepared statements.",
      severity: 'critical',
      project: 'E-commerce Platform',
      projectId: 1,
      repository: 'github.com/company/ecommerce-platform',
      source: 'github',
      resolvedBy: 'John Doe',
      resolvedAt: '2 days ago',
      resolutionTime: '4h 32m',
      category: 'vulnerability',
      cve: 'CVE-2024-1234',
      fixCommit: 'a1b2c3d',
      pullRequest: '156',
      effort: 'medium'
    },
    {
      id: 2,
      title: "Insecure cryptographic algorithm usage",
      description: "Replaced deprecated MD5 hashing with SHA-256 for password storage. Updated all existing password hashes during next login.",
      severity: 'high',
      project: 'Mobile Banking App',
      projectId: 2,
      repository: 'gitlab.com/fintech/mobile-banking',
      source: 'gitlab',
      resolvedBy: 'Jane Smith',
      resolvedAt: '1 week ago',
      resolutionTime: '2h 15m',
      category: 'vulnerability',
      cve: 'CVE-2024-5678',
      fixCommit: 'e4f5g6h',
      pullRequest: '89',
      effort: 'easy'
    },
    {
      id: 3,
      title: "Hardcoded credentials in configuration file",
      description: "Moved API keys and database credentials to environment variables. Implemented proper secrets management using HashiCorp Vault.",
      severity: 'critical',
      project: 'Healthcare Portal',
      projectId: 3,
      repository: 'github.com/health/patient-portal',
      source: 'github',
      resolvedBy: 'Mike Johnson',
      resolvedAt: '3 days ago',
      resolutionTime: '6h 45m',
      category: 'security-hotspot',
      fixCommit: 'i7j8k9l',
      pullRequest: '201',
      effort: 'hard'
    },
    {
      id: 4,
      title: "Cross-Site Scripting (XSS) in comment system",
      description: "Implemented proper input sanitization and output encoding. Added Content Security Policy headers to prevent XSS attacks.",
      severity: 'high',
      project: 'E-commerce Platform',
      projectId: 1,
      repository: 'github.com/company/ecommerce-platform',
      source: 'github',
      resolvedBy: 'Sarah Wilson',
      resolvedAt: '5 days ago',
      resolutionTime: '3h 20m',
      category: 'vulnerability',
      cve: 'CVE-2024-9012',
      fixCommit: 'm1n2o3p',
      pullRequest: '145',
      effort: 'medium'
    },
    {
      id: 5,
      title: "Vulnerable dependency: lodash@4.17.15",
      description: "Updated lodash to version 4.17.21 to fix prototype pollution vulnerability. Ran security audit to ensure no other vulnerable dependencies.",
      severity: 'medium',
      project: 'API Gateway',
      projectId: 5,
      repository: 'github.com/infra/api-gateway',
      source: 'github',
      resolvedBy: 'Alex Chen',
      resolvedAt: '1 week ago',
      resolutionTime: '1h 10m',
      category: 'vulnerability',
      fixCommit: 'q4r5s6t',
      pullRequest: '78',
      effort: 'easy'
    },
    {
      id: 6,
      title: "Docker image with known vulnerabilities",
      description: "Updated base image from ubuntu:18.04 to ubuntu:22.04. Removed unnecessary packages and implemented multi-stage build for smaller attack surface.",
      severity: 'high',
      project: 'Container Registry',
      projectId: 4,
      repository: 'docker-registry:latest',
      source: 'docker',
      resolvedBy: 'David Park',
      resolvedAt: '4 days ago',
      resolutionTime: '5h 30m',
      category: 'vulnerability',
      fixCommit: 'u7v8w9x',
      effort: 'medium'
    },
    {
      id: 7,
      title: "Code quality: Complex method with high cyclomatic complexity",
      description: "Refactored authentication method by breaking it into smaller, more manageable functions. Improved code readability and maintainability.",
      severity: 'medium',
      project: 'Mobile Banking App',
      projectId: 2,
      repository: 'gitlab.com/fintech/mobile-banking',
      source: 'gitlab',
      resolvedBy: 'Lisa Zhang',
      resolvedAt: '6 days ago',
      resolutionTime: '4h 00m',
      category: 'code-quality',
      fixCommit: 'y8z9a1b',
      pullRequest: '67',
      effort: 'medium'
    },
    {
      id: 8,
      title: "Missing error handling in API endpoints",
      description: "Added comprehensive error handling and logging to all API endpoints. Implemented proper HTTP status codes and error messages.",
      severity: 'low',
      project: 'Healthcare Portal',
      projectId: 3,
      repository: 'github.com/health/patient-portal',
      source: 'github',
      resolvedBy: 'Tom Brown',
      resolvedAt: '1 week ago',
      resolutionTime: '2h 45m',
      category: 'bug',
      fixCommit: 'c2d3e4f',
      pullRequest: '189',
      effort: 'easy'
    }
  ];

  const filteredIssues = solvedIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.project.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesProject = selectedProject === 'all' || issue.project === selectedProject;
    
    return matchesSearch && matchesSeverity && matchesCategory && matchesProject;
  });

  // Statistics
  const totalSolved = solvedIssues.length;
  const criticalSolved = solvedIssues.filter(issue => issue.severity === 'critical').length;
  const avgResolutionTime = "3h 42m"; // This could be calculated from actual data
  const thisMonthSolved = 23; // This could be calculated from actual data

  const projects = Array.from(new Set(solvedIssues.map(issue => issue.project)));

  const handleIssueClick = (issue: SolvedIssue) => {
    console.log('View issue details:', issue);
    // Handle viewing issue details
  };

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
        <div className="p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Single unified container */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="p-8 border-b border-white/10">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium text-white">SecureThread</span>
                  <ChevronRight size={16} className="text-white/60" />
                  <span className="font-medium text-white">Solved</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      Solved Issues
                    </h1>
                    <p className="text-white/80">
                      Security vulnerabilities and issues that have been resolved
                    </p>
                  </div>
                  <div className="mt-6 lg:mt-0 flex items-center space-x-3">
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white/70">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Award className="w-4 h-4 mr-2" />
                      View Achievements
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-8 border-b border-white/10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {totalSolved}
                    </div>
                    <div className="text-white/70 font-medium">
                      Total Solved
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400 mb-1">
                      {criticalSolved}
                    </div>
                    <div className="text-white/70 font-medium">
                      Critical Fixed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {avgResolutionTime}
                    </div>
                    <div className="text-white/70 font-medium">
                      Avg Resolution
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                      {thisMonthSolved}
                    </div>
                    <div className="text-white/70 font-medium">
                      This Month
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolution Timeline Section */}
              <div className="p-8 border-b border-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ResolutionTimelineCard />
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">Resolution Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Fastest Resolution</span>
                        <span className="font-semibold text-white">45m</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Most Active Resolver</span>
                        <span className="font-semibold text-white">John Doe</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Top Category</span>
                        <span className="font-semibold text-white">Vulnerabilities</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Success Rate</span>
                        <span className="font-semibold text-green-400">94.2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="p-8 border-b border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                      <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="vulnerability">Vulnerabilities</SelectItem>
                        <SelectItem value="code-quality">Code Quality</SelectItem>
                        <SelectItem value="security-hotspot">Security Hotspots</SelectItem>
                        <SelectItem value="bug">Bugs</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project} value={project}>{project}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                      <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white/70">
                      <Filter className="w-3 h-3 mr-1" />
                      More Filters
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                    <Input
                      placeholder="Search solved issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>
              </div>

              {/* Solved Issues List Section */}
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Resolved Issues ({filteredIssues.length})
                  </h2>
                </div>
                
                {filteredIssues.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredIssues.map((issue) => (
                      <SolvedIssueCard 
                        key={issue.id} 
                        issue={issue} 
                        onClick={() => handleIssueClick(issue)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Solved Issues Found
                    </h3>
                    <p className="text-white/70 mb-6">
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Section */}
              <div className="p-8 bg-white/5 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Excellence in Security Resolution
                </h3>
                <p className="text-white/70 mb-6 max-w-md mx-auto">
                  Your team's commitment to resolving security issues keeps your projects safe and secure.
                </p>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Award className="w-4 h-4 mr-2" />
                  View Team Achievements
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Solved;