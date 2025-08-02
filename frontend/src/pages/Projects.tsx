import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { 
  Plus, 
  Upload, 
  Search, 
  ChevronRight,
  GitBranch,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Play,
  Settings,
  Eye,
  Star,
  Activity,
  X
} from 'lucide-react';
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
  IconBrandGitlab,
  IconBrandDocker,
  IconShield,
} from '@tabler/icons-react';

const ResponsiveSidebar = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) => {
  const feedLinks = [
    {
      label: "Dashboard",
      href: "/",
      icon: <IconDashboard className="h-5 w-5 shrink-0" />,
      active: false,
    },
    {
      label: "Projects",
      href: "/projects",
      icon: <IconFolder className="h-5 w-5 shrink-0" />,
      active: true,
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

  const bottomLinks = [
    {
      label: "Feedback",
      href: "#",
      icon: <IconMessageCircle className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
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

  const profileLink = {
    label: "Lora Piterson",
    href: "#",
    icon: <IconUser className="h-5 w-5 shrink-0" />,
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

interface Project {
  id: number;
  name: string;
  description: string;
  owner: string;
  repository: string;
  source: 'github' | 'gitlab' | 'docker';
  status: 'active' | 'scanning' | 'failed' | 'completed';
  lastScan: string;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  coverage: number;
  isStarred: boolean;
  branch: string;
  scanDuration: string;
}

// Compact Linear Project Row
const ProjectRow = ({ project, onClick }: { project: Project; onClick: () => void }) => {
  const getSourceIcon = () => {
    switch (project.source) {
      case 'github':
        return <IconBrandGithub className="w-4 h-4" />;
      case 'gitlab':
        return <IconBrandGitlab className="w-4 h-4" />;
      case 'docker':
        return <IconBrandDocker className="w-4 h-4" />;
      default:
        return <IconFolder className="w-4 h-4" />;
    }
  };

  const getStatusIcon = () => {
    switch (project.status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scanning':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const totalVulnerabilities = Object.values(project.vulnerabilities).reduce((a, b) => a + b, 0);

  return (
    <div 
      className="flex items-center justify-between p-4 border-b border-gray-200/50 hover:bg-gray-50/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      {/* Project Info */}
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {getSourceIcon()}
          {project.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-brand-black truncate">{project.name}</h3>
            {getStatusIcon()}
          </div>
          <div className="flex items-center space-x-3 text-xs text-brand-gray mt-1">
            <span className="truncate">{project.owner}</span>
            <span>•</span>
            <span>{project.branch}</span>
            <span>•</span>
            <span>{project.lastScan}</span>
          </div>
        </div>
      </div>

      {/* Vulnerabilities */}
      <div className="flex items-center space-x-2 mx-4">
        {project.vulnerabilities.critical > 0 && (
          <Badge variant="destructive" className="bg-red-500 text-white text-xs px-1">
            C{project.vulnerabilities.critical}
          </Badge>
        )}
        {project.vulnerabilities.high > 0 && (
          <Badge className="bg-orange-500 text-white text-xs px-1">
            H{project.vulnerabilities.high}
          </Badge>
        )}
        {project.vulnerabilities.medium > 0 && (
          <Badge className="bg-yellow-500 text-white text-xs px-1">
            M{project.vulnerabilities.medium}
          </Badge>
        )}
        {project.vulnerabilities.low > 0 && (
          <Badge className="bg-gray-500 text-white text-xs px-1">
            L{project.vulnerabilities.low}
          </Badge>
        )}
        {totalVulnerabilities === 0 && (
          <Badge className="bg-green-500 text-white text-xs px-1">
            Clean
          </Badge>
        )}
      </div>

      {/* Coverage */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="flex items-center space-x-2">
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-accent h-1.5 rounded-full transition-all"
              style={{ width: `${project.coverage}%` }}
            ></div>
          </div>
          <span className="text-xs text-brand-gray">{project.coverage}%</span>
        </div>
        
        <Button variant="outline" size="sm" className="bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

// Detailed Project Modal Card
const ProjectDetailModal = ({ project, isOpen, onClose }: { 
  project: Project | null; 
  isOpen: boolean; 
  onClose: () => void 
}) => {
  if (!project) return null;

  const getSourceIcon = () => {
    switch (project.source) {
      case 'github':
        return <IconBrandGithub className="w-6 h-6" />;
      case 'gitlab':
        return <IconBrandGitlab className="w-6 h-6" />;
      case 'docker':
        return <IconBrandDocker className="w-6 h-6" />;
      default:
        return <IconFolder className="w-6 h-6" />;
    }
  };

  const getStatusColor = () => {
    switch (project.status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scanning':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
    }
  };

  const totalVulnerabilities = Object.values(project.vulnerabilities).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {getSourceIcon()}
            <span>{project.name}</span>
            {project.isStarred && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status & Basic Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Badge className={`${getStatusColor()}`}>
                {project.status}
              </Badge>
              <p className="text-sm text-brand-gray">{project.description}</p>
              <div className="flex items-center space-x-4 text-sm text-brand-gray">
                <div className="flex items-center space-x-1">
                  <GitBranch className="w-4 h-4" />
                  <span>{project.branch}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{project.lastScan}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Repository Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-brand-black mb-2">Repository</h4>
            <p className="text-sm text-brand-gray font-mono">{project.repository}</p>
            <p className="text-sm text-brand-gray mt-1">Owner: {project.owner}</p>
          </div>

          {/* Vulnerabilities Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-brand-black">Security Vulnerabilities</h4>
              <span className="text-sm text-brand-gray">{totalVulnerabilities} total issues</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{project.vulnerabilities.critical}</div>
                <div className="text-xs text-red-800">Critical</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{project.vulnerabilities.high}</div>
                <div className="text-xs text-orange-800">High</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{project.vulnerabilities.medium}</div>
                <div className="text-xs text-yellow-800">Medium</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-600">{project.vulnerabilities.low}</div>
                <div className="text-xs text-gray-800">Low</div>
              </div>
            </div>
          </div>

          {/* Scan Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-brand-black mb-2">Coverage</h4>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-accent h-3 rounded-full transition-all"
                    style={{ width: `${project.coverage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-brand-black">{project.coverage}%</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-brand-black mb-2">Scan Duration</h4>
              <p className="text-2xl font-bold text-brand-black">{project.scanDuration}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              {project.status === 'scanning' ? (
                <Button disabled className="bg-blue-100 text-blue-800">
                  <Activity className="w-4 h-4 mr-2 animate-pulse" />
                  Scanning...
                </Button>
              ) : (
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Play className="w-4 h-4 mr-2" />
                  Scan Now
                </Button>
              )}
              <Button variant="outline" className="bg-white/50">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
            
            <Button variant="outline" onClick={onClose} className="bg-white/50">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Projects = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const projects: Project[] = [
    {
      id: 1,
      name: "E-commerce Platform",
      description: "Modern React-based e-commerce platform with microservices architecture",
      owner: "john.doe",
      repository: "github.com/company/ecommerce-platform",
      source: 'github',
      status: 'active',
      lastScan: '2 hours ago',
      vulnerabilities: { critical: 2, high: 5, medium: 8, low: 12 },
      coverage: 94,
      isStarred: true,
      branch: 'main',
      scanDuration: '4m 32s'
    },
    {
      id: 2,
      name: "Mobile Banking App",
      description: "Secure mobile banking application with advanced fraud detection",
      owner: "jane.smith",
      repository: "gitlab.com/fintech/mobile-banking",
      source: 'gitlab',
      status: 'scanning',
      lastScan: '1 hour ago',
      vulnerabilities: { critical: 0, high: 3, medium: 6, low: 9 },
      coverage: 87,
      isStarred: false,
      branch: 'develop',
      scanDuration: '6m 15s'
    },
    {
      id: 3,
      name: "Healthcare Portal",
      description: "HIPAA-compliant patient management system with telemedicine features",
      owner: "mike.johnson",
      repository: "github.com/health/patient-portal",
      source: 'github',
      status: 'completed',
      lastScan: '30 minutes ago',
      vulnerabilities: { critical: 1, high: 2, medium: 4, low: 7 },
      coverage: 96,
      isStarred: true,
      branch: 'main',
      scanDuration: '3m 45s'
    },
    {
      id: 4,
      name: "Container Registry",
      description: "Private Docker container registry with vulnerability scanning",
      owner: "sarah.wilson",
      repository: "docker-registry:latest",
      source: 'docker',
      status: 'failed',
      lastScan: '4 hours ago',
      vulnerabilities: { critical: 3, high: 1, medium: 2, low: 5 },
      coverage: 78,
      isStarred: false,
      branch: 'latest',
      scanDuration: '2m 18s'
    },
    {
      id: 5,
      name: "API Gateway",
      description: "Microservices API gateway with rate limiting and authentication",
      owner: "alex.chen",
      repository: "github.com/infra/api-gateway",
      source: 'github',
      status: 'active',
      lastScan: '6 hours ago',
      vulnerabilities: { critical: 0, high: 0, medium: 1, low: 3 },
      coverage: 99,
      isStarred: true,
      branch: 'production',
      scanDuration: '1m 52s'
    }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.owner.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' ||
                         (selectedFilter === 'critical' && project.vulnerabilities.critical > 0) ||
                         (selectedFilter === 'clean' && Object.values(project.vulnerabilities).every(v => v === 0)) ||
                         (selectedFilter === 'starred' && project.isStarred);
    
    const matchesSource = selectedSource === 'all' || project.source === selectedSource;
    
    return matchesSearch && matchesFilter && matchesSource;
  });

  const totalVulnerabilities = projects.reduce((acc, project) => {
    acc.critical += project.vulnerabilities.critical;
    acc.high += project.vulnerabilities.high;
    acc.medium += project.vulnerabilities.medium;
    acc.low += project.vulnerabilities.low;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0 });

  const activeScans = projects.filter(p => p.status === 'scanning').length;

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <EtherealBackground 
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      
      <ResponsiveSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm mb-4">
              <span className="font-medium text-white">User</span>
              <ChevronRight size={16} className="text-gray-300" />
              <span className="font-medium text-white">Projects</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-black mb-2">
                  Projects
                </h1>
                <p className="text-brand-gray">Manage and monitor your security scans</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
                <Button variant="outline" className="bg-white/50">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IconFolder className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-black">{projects.length}</div>
                    <div className="text-sm text-brand-gray">Total Projects</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-black">{totalVulnerabilities.critical}</div>
                    <div className="text-sm text-brand-gray">Critical Issues</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-black">{activeScans}</div>
                    <div className="text-sm text-brand-gray">Active Scans</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <IconShield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-black">91%</div>
                    <div className="text-sm text-brand-gray">Avg Coverage</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-sm mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-[140px] bg-white/50">
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      <SelectItem value="critical">Critical Issues</SelectItem>
                      <SelectItem value="clean">Clean Projects</SelectItem>
                      <SelectItem value="starred">Starred</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger className="w-[140px] bg-white/50">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="gitlab">GitLab</SelectItem>
                      <SelectItem value="docker">Docker</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Play className="w-4 h-4 mr-2" />
                    Scan All
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-gray w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white/50"
                  />
                </div>
              </div>
            </div>

            {/* Projects List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 shadow-sm">
              <div className="p-6 border-b border-gray-200/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-brand-black">
                    Projects ({filteredProjects.length})
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="bg-white/50">
                      <Settings className="w-3 h-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200/50">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <ProjectRow 
                      key={project.id} 
                      project={project} 
                      onClick={() => handleProjectClick(project)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-brand-gray" />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-black mb-2">No projects found</h3>
                    <p className="text-brand-gray mb-4">Try adjusting your search or filter criteria</p>
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Project
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal 
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Projects;