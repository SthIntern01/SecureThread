import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Plus, Search, Settings, Check, AlertCircle, ChevronRight } from 'lucide-react';
import AppSidebar from '../components/AppSidebar';
import {
  IconBrandGithub,
  IconBrandGitlab,
  IconCode,
  IconActivity,
  IconSettings as IconJenkins,
  IconBrandAzure,
  IconChecklist,
} from '@tabler/icons-react';

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
}

const IntegrationCard = ({ integration, onToggle }: { integration: Integration; onToggle: (id: string) => void }) => {
  const [isConnected, setIsConnected] = useState(integration.status === 'connected');

  const handleToggle = () => {
    setIsConnected(!isConnected);
    onToggle(integration. id);
  };

  return (
    <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-14 h-14 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
            {integration.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold theme-text text-lg">{integration.name}</h3>
              {integration.isPopular && (
                <Badge className="bg-orange-500/90 backdrop-blur-sm text-white text-xs border-0">Popular</Badge>
              )}
            </div>
            <p className="text-sm theme-text-muted">{integration.description}</p>
          </div>
        </div>
        
        <Switch
          checked={isConnected}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-orange-500 ml-4 flex-shrink-0"
        />
      </div>

      {integration.status === 'connected' && (
        <div className="space-y-2 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm">
            <span className="theme-text-muted">Connected Projects:</span>
            <span className="font-semibold theme-text">{integration.connectedProjects || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="theme-text-muted">Last Synced:</span>
            <span className="font-semibold theme-text">{integration.lastSynced || 'Never'}</span>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">Connected & Active</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 bg-white/10 border-white/20 hover:bg-white/20 theme-text"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      )}

      {integration.status === 'configured' && (
        <div className="pt-4 border-t border-white/20">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400 font-medium">Configured - Pending Connection</span>
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Complete Setup
          </Button>
        </div>
      )}

      {integration.status === 'available' && (
        <div className="pt-4 border-t border-white/20">
          <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0">
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
  if (integrations.length === 0) return null;
  
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold theme-text mb-6 flex items-center">
        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full mr-3"></div>
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

  // ✅ ONLY 7 INTEGRATIONS
  const integrations: Integration[] = [
    // Source Control (3)
    {
      id: 'github',
      name: 'GitHub',
      description: 'Connect your GitHub repositories for automated security scanning',
      icon: <IconBrandGithub className="w-7 h-7 theme-text" />,
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
      icon: <IconBrandGitlab className="w-7 h-7 theme-text" />,
      category: 'source-control',
      status: 'configured',
      isPopular: true
    },
    {
      id: 'bitbucket',
      name: 'Bitbucket',
      description: 'Scan Bitbucket repositories for security vulnerabilities',
      icon: <IconCode className="w-7 h-7 theme-text" />,
      category: 'source-control',
      status: 'available'
    },

    // CI/CD (3)
    {
      id: 'github-actions',
      name: 'GitHub Actions',
      description: 'Integrate security scans into your GitHub Actions workflows',
      icon: <IconActivity className="w-7 h-7 theme-text" />,
      category: 'cicd',
      status: 'connected',
      isPopular: true,
      connectedProjects: 8,
      lastSynced: '1 hour ago'
    },
    {
      id: 'jenkins',
      name: 'Jenkins',
      description: 'Add security scanning to your Jenkins CI/CD pipelines',
      icon: <IconJenkins className="w-7 h-7 theme-text" />,
      category: 'cicd',
      status: 'available'
    },
    {
      id: 'azure-devops',
      name: 'Azure DevOps',
      description: 'Integrate with Azure DevOps for continuous security',
      icon: <IconBrandAzure className="w-7 h-7 theme-text" />,
      category: 'cicd',
      status: 'available'
    },

    // Project Management (1)
    {
      id: 'jira',
      name: 'Jira',
      description: 'Create and track security issues directly in Jira',
      icon: <IconChecklist className="w-7 h-7 theme-text" />,
      category: 'project-management',
      status: 'connected',
      isPopular: true,
      connectedProjects: 5,
      lastSynced: '10 minutes ago'
    },
  ];

  const categories = [
    { id: 'all', name: 'All Integrations', count: integrations.length },
    { id: 'source-control', name: 'Source Control', count: integrations. filter(i => i.category === 'source-control').length },
    { id: 'cicd', name: 'CI/CD', count: integrations.filter(i => i.category === 'cicd').length },
    { id: 'project-management', name: 'Project Management', count: integrations.filter(i => i.category === 'project-management').length },
  ];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleIntegration = (id: string) => {
    console.log('Toggle integration:', id);
  };

  const connectedCount = integrations.filter(i => i.status === 'connected'). length;
  const availableCount = integrations.filter(i => i.status === 'available'). length;

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
        <div className="p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {/* Liquid Glass Container */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="p-8 border-b border-white/20">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium theme-text">SecureThread</span>
                  <ChevronRight size={16} className="theme-text-muted" />
                  <span className="font-medium theme-text">Integrations</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold theme-text mb-2">
                      Integrations
                    </h1>
                    <p className="theme-text-secondary">
                      Connect your tools and services to SecureThread
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-8 border-b border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      {connectedCount}
                    </div>
                    <div className="theme-text-muted font-medium">
                      Connected
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all">
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {availableCount}
                    </div>
                    <div className="theme-text-muted font-medium">
                      Available
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all">
                    <div className="text-4xl font-bold text-purple-400 mb-2">
                      24/7
                    </div>
                    <div className="theme-text-muted font-medium">
                      Monitoring
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filters Section */}
              <div className="p-8 border-b border-white/20">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-muted w-5 h-5" />
                    <Input
                      placeholder="Search integrations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 bg-white/10 backdrop-blur-sm border-white/20 theme-text placeholder:text-white/50 h-11 focus:bg-white/15"
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
                          "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 border-0" : 
                          "bg-white/10 backdrop-blur-sm border-white/20 theme-text hover:bg-white/20"
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
                  <div className="space-y-10">
                    <IntegrationCategory 
                      title="Source Control" 
                      integrations={filteredIntegrations. filter(i => i.category === 'source-control')}
                      onToggle={handleToggleIntegration}
                    />
                    <IntegrationCategory 
                      title="CI/CD Platforms" 
                      integrations={filteredIntegrations.filter(i => i.category === 'cicd')}
                      onToggle={handleToggleIntegration}
                    />
                    <IntegrationCategory 
                      title="Project Management" 
                      integrations={filteredIntegrations.filter(i => i.category === 'project-management')}
                      onToggle={handleToggleIntegration}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                      <Search className="w-10 h-10 theme-text-muted" />
                    </div>
                    <h3 className="text-xl font-semibold theme-text mb-2">No integrations found</h3>
                    <p className="theme-text-muted">Try adjusting your search or filter criteria</p>
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