import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
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
      active: true,
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
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            {integration.icon}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-brand-black">{integration.name}</h3>
              {integration.isPopular && (
                <Badge className="bg-accent text-accent-foreground text-xs">Popular</Badge>
              )}
            </div>
            <p className="text-sm text-brand-gray mt-1">{integration.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {integration.status === 'connected' && (
            <Button variant="outline" size="sm" className="bg-white/50">
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
            <span className="text-brand-gray">Connected Projects:</span>
            <span className="font-medium text-brand-black">{integration.connectedProjects || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-gray">Last Synced:</span>
            <span className="font-medium text-brand-black">{integration.lastSynced || 'Never'}</span>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Connected & Active</span>
          </div>
        </div>
      )}

      {integration.status === 'configured' && (
        <div className="flex items-center space-x-2 pt-2">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-yellow-600 font-medium">Configured - Pending Connection</span>
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
      <h2 className="text-xl font-semibold text-brand-black mb-4">{title}</h2>
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
      icon: <IconBrandGithub className="w-6 h-6" />,
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
      icon: <IconBrandGitlab className="w-6 h-6" />,
      category: 'source-control',
      status: 'configured',
      isPopular: true
    },
    {
      id: 'bitbucket',
      name: 'Bitbucket',
      description: 'Scan Bitbucket repositories for security vulnerabilities',
      icon: <IconCode className="w-6 h-6" />,
      category: 'source-control',
      status: 'available'
    },

    // CI/CD
    {
      id: 'github-actions',
      name: 'GitHub Actions',
      description: 'Integrate security scans into your GitHub Actions workflows',
      icon: <IconActivity className="w-6 h-6" />,
      category: 'cicd',
      status: 'connected',
      connectedProjects: 8,
      lastSynced: '1 hour ago'
    },
    {
      id: 'jenkins',
      name: 'Jenkins',
      description: 'Add security scanning to your Jenkins CI/CD pipelines',
      icon: <IconSettings className="w-6 h-6" />,
      category: 'cicd',
      status: 'available'
    },
    {
      id: 'azure-devops',
      name: 'Azure DevOps',
      description: 'Integrate with Azure DevOps for continuous security',
      icon: <IconBrandAzure className="w-6 h-6" />,
      category: 'cicd',
      status: 'available'
    },

    // Communication
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get security alerts and notifications in Slack',
      icon: <IconBrandSlack className="w-6 h-6" />,
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
      icon: <IconMessageCircle className="w-6 h-6" />,
      category: 'communication',
      status: 'available'
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Get notified about security issues in Discord',
      icon: <IconBell className="w-6 h-6" />,
      category: 'communication',
      status: 'available'
    },

    // Cloud Platforms
    {
      id: 'aws',
      name: 'Amazon Web Services',
      description: 'Scan AWS infrastructure and services for security issues',
      icon: <IconBrandAws className="w-6 h-6" />,
      category: 'cloud',
      status: 'connected',
      connectedProjects: 3,
      lastSynced: '30 minutes ago'
    },
    {
      id: 'azure',
      name: 'Microsoft Azure',
      description: 'Monitor Azure resources for security vulnerabilities',
      icon: <IconBrandAzure className="w-6 h-6" />,
      category: 'cloud',
      status: 'available'
    },
    {
      id: 'gcp',
      name: 'Google Cloud Platform',
      description: 'Secure your Google Cloud infrastructure',
      icon: <IconCloud className="w-6 h-6" />,
      category: 'cloud',
      status: 'available'
    },

    // Container & Security
    {
      id: 'docker-hub',
      name: 'Docker Hub',
      description: 'Scan container images for vulnerabilities',
      icon: <IconBrandDocker className="w-6 h-6" />,
      category: 'containers',
      status: 'available',
      isPopular: true
    },
    {
      id: 'snyk',
      name: 'Snyk',
      description: 'Enhanced vulnerability scanning with Snyk',
      icon: <IconShield className="w-6 h-6" />,
      category: 'security-tools',
      status: 'available'
    },
    {
      id: 'sonarqube',
      name: 'SonarQube',
      description: 'Integrate with SonarQube for code quality analysis',
      icon: <IconBug className="w-6 h-6" />,
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
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-black mb-2">
                Integrations
              </h1>
              <p className="text-brand-gray">Connect your tools and services to SecureThread</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-black">{connectedCount}</div>
                    <div className="text-sm text-brand-gray">Connected</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-black">{availableCount}</div>
                    <div className="text-sm text-brand-gray">Available</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <IconShield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-black">24/7</div>
                    <div className="text-sm text-brand-gray">Monitoring</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20 shadow-sm mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-gray w-4 h-4" />
                  <Input
                    placeholder="Search integrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50"
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={selectedCategory === category.id ? "bg-accent text-accent-foreground" : "bg-white/50"}
                    >
                      {category.name} ({category.count})
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Integrations Grid */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 shadow-sm">
              <div className="p-6">
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
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-brand-gray" />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-black mb-2">No integrations found</h3>
                    <p className="text-brand-gray">Try adjusting your search or filter criteria</p>
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