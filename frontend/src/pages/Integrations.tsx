import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { useAuth } from "../contexts/AuthContext"; // Add this import
import { Plus, Search, Settings, ExternalLink, Check, AlertCircle, ChevronRight } from 'lucide-react';
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
  IconBrandSlack,
  IconBrandDocker,
  IconCloud,
  IconBrandAws,
  IconBrandAzure,
  IconBell,
  IconShield,
  IconCode,
  IconBug,
  IconActivity,
  IconRobot,
  IconLogout, // Add this import
} from '@tabler/icons-react';

const ResponsiveSidebar = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) => {
  const { user, logout } = useAuth(); // Add this line
  const [showLogout, setShowLogout] = useState(false); // Add this state

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
      active: true, // Keep this true since this is the Integrations page
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
      href: "#",
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

  // Update the profileLink to use actual user data
  const profileLink = {
    label: user?.full_name || user?.github_username || "Lora Piterson", // Use actual user data or fallback
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

  // Add the click handler for profile
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

          {/* Update the profile section with logout functionality */}
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

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'connected' | 'available' | 'configured';
  isPopular?: boolean;
  connectedProjects?: number;
  lastSynced?: string;
  configUrl?: string;
}

const IntegrationCard = ({ integration, onToggle }: { integration: Integration; onToggle: (id: string) => void }) => {
  const [isConnected, setIsConnected] = useState(integration.status === 'connected');

  const handleToggle = () => {
    setIsConnected(!isConnected);
    onToggle(integration.id);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-sm hover:bg-white/15 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
            {integration.icon}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">{integration.name}</h3>
              {integration.isPopular && (
                <Badge className="bg-accent text-accent-foreground text-xs">Popular</Badge>
              )}
            </div>
            <p className="text-sm text-white/70 mt-1">{integration.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {integration.status === 'connected' && (
            <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Settings className="w-3 h-3 mr-1" />
              Configure
            </Button>
          )}
          <Switch
            checked={isConnected}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-accent"
          />
        </div>
      </div>

      {integration.status === 'connected' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Connected Projects:</span>
            <span className="font-medium text-white">{integration.connectedProjects || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Last Synced:</span>
            <span className="font-medium text-white">{integration.lastSynced || 'Never'}</span>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">Connected & Active</span>
          </div>
        </div>
      )}

      {integration.status === 'configured' && (
        <div className="flex items-center space-x-2 pt-2">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400 font-medium">Configured - Pending Connection</span>
        </div>
      )}

      {integration.status === 'available' && (
        <div className="pt-2">
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Connect {integration.name}
          </Button>
        </div>
      )}
    </div>
  );
};

const IntegrationCategory = ({ title, integrations, onToggle }: { 
  title: string; 
  integrations: Integration[]; 
  onToggle: (id: string) => void 
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard 
            key={integration.id} 
            integration={integration} 
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
};

const Integrations = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const integrations: Integration[] = [
    // Source Control
    {
      id: 'github',
      name: 'GitHub',
      description: 'Connect your GitHub repositories for automated security scanning',
      icon: <IconBrandGithub className="w-6 h-6 text-white" />,
      category: 'source-control',
      status: 'connected',
      isPopular: true,
      connectedProjects: 12,
      lastSynced: '2 minutes ago'
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      description: 'Integrate with GitLab for comprehensive code analysis',
      icon: <IconBrandGitlab className="w-6 h-6 text-white" />,
      category: 'source-control',
      status: 'configured',
      isPopular: true
    },
    {
      id: 'bitbucket',
      name: 'Bitbucket',
      description: 'Scan Bitbucket repositories for security vulnerabilities',
      icon: <IconCode className="w-6 h-6 text-white" />,
      category: 'source-control',
      status: 'available'
    },

    // CI/CD
    {
      id: 'github-actions',
      name: 'GitHub Actions',
      description: 'Integrate security scans into your GitHub Actions workflows',
      icon: <IconActivity className="w-6 h-6 text-white" />,
      category: 'cicd',
      status: 'connected',
      connectedProjects: 8,
      lastSynced: '1 hour ago'
    },
    {
      id: 'jenkins',
      name: 'Jenkins',
      description: 'Add security scanning to your Jenkins CI/CD pipelines',
      icon: <IconSettings className="w-6 h-6 text-white" />,
      category: 'cicd',
      status: 'available'
    },
    {
      id: 'azure-devops',
      name: 'Azure DevOps',
      description: 'Integrate with Azure DevOps for continuous security',
      icon: <IconBrandAzure className="w-6 h-6 text-white" />,
      category: 'cicd',
      status: 'available'
    },

    // Communication
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get security alerts and notifications in Slack',
      icon: <IconBrandSlack className="w-6 h-6 text-white" />,
      category: 'communication',
      status: 'connected',
      isPopular: true,
      connectedProjects: 5,
      lastSynced: '5 minutes ago'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Receive security updates in Microsoft Teams channels',
      icon: <IconMessageCircle className="w-6 h-6 text-white" />,
      category: 'communication',
      status: 'available'
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Get notified about security issues in Discord',
      icon: <IconBell className="w-6 h-6 text-white" />,
      category: 'communication',
      status: 'available'
    },

    // Cloud Platforms
    {
      id: 'aws',
      name: 'Amazon Web Services',
      description: 'Scan AWS infrastructure and services for security issues',
      icon: <IconBrandAws className="w-6 h-6 text-white" />,
      category: 'cloud',
      status: 'connected',
      connectedProjects: 3,
      lastSynced: '30 minutes ago'
    },
    {
      id: 'azure',
      name: 'Microsoft Azure',
      description: 'Monitor Azure resources for security vulnerabilities',
      icon: <IconBrandAzure className="w-6 h-6 text-white" />,
      category: 'cloud',
      status: 'available'
    },
    {
      id: 'gcp',
      name: 'Google Cloud Platform',
      description: 'Secure your Google Cloud infrastructure',
      icon: <IconCloud className="w-6 h-6 text-white" />,
      category: 'cloud',
      status: 'available'
    },

    // Container & Security
    {
      id: 'docker-hub',
      name: 'Docker Hub',
      description: 'Scan container images for vulnerabilities',
      icon: <IconBrandDocker className="w-6 h-6 text-white" />,
      category: 'containers',
      status: 'available',
      isPopular: true
    },
    {
      id: 'snyk',
      name: 'Snyk',
      description: 'Enhanced vulnerability scanning with Snyk',
      icon: <IconShield className="w-6 h-6 text-white" />,
      category: 'security-tools',
      status: 'available'
    },
    {
      id: 'sonarqube',
      name: 'SonarQube',
      description: 'Integrate with SonarQube for code quality analysis',
      icon: <IconBug className="w-6 h-6 text-white" />,
      category: 'security-tools',
      status: 'available'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Integrations', count: integrations.length },
    { id: 'source-control', name: 'Source Control', count: integrations.filter(i => i.category === 'source-control').length },
    { id: 'cicd', name: 'CI/CD', count: integrations.filter(i => i.category === 'cicd').length },
    { id: 'communication', name: 'Communication', count: integrations.filter(i => i.category === 'communication').length },
    { id: 'cloud', name: 'Cloud Platforms', count: integrations.filter(i => i.category === 'cloud').length },
    { id: 'containers', name: 'Containers', count: integrations.filter(i => i.category === 'containers').length },
    { id: 'security-tools', name: 'Security Tools', count: integrations.filter(i => i.category === 'security-tools').length },
  ];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleIntegration = (id: string) => {
    console.log('Toggle integration:', id);
    // Handle integration toggle logic here
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const availableCount = integrations.filter(i => i.status === 'available').length;

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
        <div className="p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {/* Single unified container */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="p-8 border-b border-white/10">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium text-white">SecureThread</span>
                  <ChevronRight size={16} className="text-white/60" />
                  <span className="font-medium text-white">Integrations</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      Integrations
                    </h1>
                    <p className="text-white/80">
                      Connect your tools and services to SecureThread
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-8 border-b border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {connectedCount}
                    </div>
                    <div className="text-white/70 font-medium">
                      Connected
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {availableCount}
                    </div>
                    <div className="text-white/70 font-medium">
                      Available
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                      24/7
                    </div>
                    <div className="text-white/70 font-medium">
                      Monitoring
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filters Section */}
              <div className="p-8 border-b border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                    <Input
                      placeholder="Search integrations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className={selectedCategory === category.id ? 
                          "bg-accent text-accent-foreground" : 
                          "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        }
                      >
                        {category.name} ({category.count})
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Integrations Grid Section */}
              <div className="p-8">
                {selectedCategory === 'all' ? (
                  <div className="space-y-8">
                    <IntegrationCategory 
                      title="Source Control" 
                      integrations={filteredIntegrations.filter(i => i.category === 'source-control')}
                      onToggle={handleToggleIntegration}
                    />
                    <IntegrationCategory 
                      title="CI/CD Platforms" 
                      integrations={filteredIntegrations.filter(i => i.category === 'cicd')}
                      onToggle={handleToggleIntegration}
                    />
                    <IntegrationCategory 
                      title="Communication" 
                      integrations={filteredIntegrations.filter(i => i.category === 'communication')}
                      onToggle={handleToggleIntegration}
                    />
                    <IntegrationCategory 
                      title="Cloud Platforms" 
                      integrations={filteredIntegrations.filter(i => i.category === 'cloud')}
                      onToggle={handleToggleIntegration}
                    />
                    <IntegrationCategory 
                      title="Containers & Security Tools" 
                      integrations={filteredIntegrations.filter(i => i.category === 'containers' || i.category === 'security-tools')}
                      onToggle={handleToggleIntegration}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredIntegrations.map((integration) => (
                      <IntegrationCard 
                        key={integration.id} 
                        integration={integration} 
                        onToggle={handleToggleIntegration}
                      />
                    ))}
                  </div>
                )}

                {filteredIntegrations.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-white/70" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No integrations found</h3>
                    <p className="text-white/70">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;