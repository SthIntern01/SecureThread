import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Plus, Search, Settings, Check, AlertCircle, ChevronRight } from 'lucide-react';
import AppSidebar from '../components/AppSidebar';
import { toast } from 'sonner';
import {
  IconBrandGithub,
  IconBrandGitlab,
  IconCode,
  IconActivity,
  IconSettings as IconJenkins,
  IconBrandAzure,
  IconChecklist,
  IconBrandSlack,
} from '@tabler/icons-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://2l577wm4-8000.inc1.devtunnels.ms';

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
  customComponent?: React.ReactNode;
}

const IntegrationCard = ({ integration, onToggle }: { integration: Integration; onToggle: (id: string) => void }) => {
  const [isConnected, setIsConnected] = useState(integration.status === 'connected');

  // If custom component provided, render it
  if (integration.customComponent) {
    return <>{integration.customComponent}</>;
  }

  const handleToggle = () => {
    setIsConnected(!isConnected);
    onToggle(integration.id);
  };

  return (
    <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/15 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-14 h-14 bg-[#D6E6FF] dark:bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-[#003D6B]/20 dark:border-white/20">
            {integration.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{integration.name}</h3>
              {integration.isPopular && (
                <Badge style={{ color: 'white' }} className="bg-[#003D6B] dark:bg-orange-500 text-xs border-0">Popular</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60">{integration.description}</p>
          </div>
        </div>
        
        <Switch
          checked={isConnected}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-[#003D6B] dark:data-[state=checked]:bg-orange-500 ml-4 flex-shrink-0"
        />
      </div>

      {integration.status === 'connected' && (
        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-white/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-white/60">Connected Projects:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{integration.connectedProjects || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-white/60">Last Synced:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{integration.lastSynced || 'Never'}</span>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Connected & Active</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-2 bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20 hover:bg-[#003D6B] hover:text-white hover:border-[#003D6B] dark:hover:bg-orange-500 text-gray-900 dark:text-white transition-colors [&:hover_svg]:text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      )}

      {integration.status === 'configured' && (
        <div className="pt-4 border-t border-gray-200 dark:border-white/20">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Configured - Pending Connection</span>
          </div>
          <Button 
            style={{ color: 'white' }}
            className="w-full bg-[#003D6B] hover:bg-[#002A4D] dark:bg-orange-500 dark:hover:bg-orange-600 border-0 font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" style={{ color: 'white' }} />
            Complete Setup
          </Button>
        </div>
      )}

      {integration.status === 'available' && (
        <div className="pt-4 border-t border-gray-200 dark:border-white/20">
          <Button 
            style={{ color: 'white' }}
            className="w-full bg-[#003D6B] hover:bg-[#002A4D] dark:bg-orange-500 dark:hover:bg-orange-600 border-0 font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" style={{ color: 'white' }} />
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
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <div className="w-1 h-8 bg-[#003D6B] dark:bg-orange-500 rounded-full mr-3"></div>
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

  // Slack OAuth State
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackWorkspace, setSlackWorkspace] = useState<string | null>(null);
  const [slackChannel, setSlackChannel] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check Slack connection status on mount
  useEffect(() => {
    checkSlackStatus();
    
    // Check for OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack_connected') === 'true') {
      toast.success('Slack connected successfully!');
      checkSlackStatus();
      // Clean up URL
      window.history.replaceState({}, '', '/integrations');
    } else if (params.get('slack_error')) {
      const error = params.get('slack_error');
      toast.error(`Slack connection failed: ${error}`);
      window.history.replaceState({}, '', '/integrations');
    }
  }, []);

  // Check Slack connection status
  const checkSlackStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/slack/oauth/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSlackConnected(data.connected);
        setSlackWorkspace(data.workspace_name);
        setSlackChannel(data.channel_name);
      }
    } catch (error) {
      console.error('Failed to check Slack status:', error);
    }
  };

  // Connect Slack
  const handleConnectSlack = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/slack/oauth/initiate`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Slack OAuth page
        window.location.href = data.oauth_url;
      } else {
        toast.error('Failed to initiate Slack connection');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Failed to connect Slack:', error);
      toast.error('Failed to connect Slack');
      setIsConnecting(false);
    }
  };

  // Disconnect Slack
  const handleDisconnectSlack = async () => {
    if (!confirm('Are you sure you want to disconnect Slack?')) {
      return;
    }
    
    setIsDisconnecting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/slack/oauth/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        setSlackConnected(false);
        setSlackWorkspace(null);
        setSlackChannel(null);
        toast.success('Slack disconnected successfully');
      } else {
        toast.error('Failed to disconnect Slack');
      }
    } catch (error) {
      console.error('Failed to disconnect Slack:', error);
      toast.error('Failed to disconnect Slack');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Slack Custom Component
  const SlackIntegrationCard = () => (
    <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/15 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-14 h-14 bg-[#D6E6FF] dark:bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-[#003D6B]/20 dark:border-white/20">
            <IconBrandSlack className="w-7 h-7 text-[#611f69]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Slack</h3>
              <Badge style={{ color: 'white' }} className="bg-[#003D6B] dark:bg-orange-500 text-xs border-0">Popular</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-white/60">
              {slackConnected 
                ? `Connected to ${slackWorkspace}` 
                : 'Get real-time security alerts in Slack'}
            </p>
          </div>
        </div>
        
        {slackConnected ? (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Connected
          </span>
        ) : (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            Not Connected
          </span>
        )}
      </div>

      {slackConnected ? (
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/20">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
            <Check className="w-5 h-5 text-green-500" />
            <span>Workspace: <strong className="text-gray-900 dark:text-white">{slackWorkspace}</strong></span>
          </div>
          
          {slackChannel && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
              <Check className="w-5 h-5 text-purple-500" />
              <span>Channel: <strong className="text-gray-900 dark:text-white">{slackChannel}</strong></span>
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDisconnectSlack}
              disabled={isDisconnecting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
            >
              {isDisconnecting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-4 border-t border-gray-200 dark:border-white/20">
          <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
            Connect your Slack workspace to receive:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
              <Check className="w-4 h-4 text-green-500" />
              Real-time vulnerability alerts
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
              <Check className="w-4 h-4 text-green-500" />
              Scan completion notifications
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
              <Check className="w-4 h-4 text-green-500" />
              Security score updates
            </li>
          </ul>
          
          <button
            onClick={handleConnectSlack}
            disabled={isConnecting}
            style={{ color: 'white' }}
            className="w-full px-4 py-2 bg-[#611f69] hover:bg-[#4a1751] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <IconBrandSlack className="w-5 h-5" />
                Connect Slack
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const integrations: Integration[] = [
    {
      id: 'github',
      name: 'GitHub',
      description: 'Connect your GitHub repositories for automated security scanning',
      icon: <IconBrandGithub className="w-7 h-7 text-gray-900 dark:text-white" />,
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
      icon: <IconBrandGitlab className="w-7 h-7 text-gray-900 dark:text-white" />,
      category: 'source-control',
      status: 'configured',
      isPopular: true
    },
    {
      id: 'bitbucket',
      name: 'Bitbucket',
      description: 'Scan Bitbucket repositories for security vulnerabilities',
      icon: <IconCode className="w-7 h-7 text-gray-900 dark:text-white" />,
      category: 'source-control',
      status: 'available'
    },
    {
      id: 'github-actions',
      name: 'GitHub Actions',
      description: 'Integrate security scans into your GitHub Actions workflows',
      icon: <IconActivity className="w-7 h-7 text-gray-900 dark:text-white" />,
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
      icon: <IconJenkins className="w-7 h-7 text-gray-900 dark:text-white" />,
      category: 'cicd',
      status: 'available'
    },
    {
      id: 'azure-devops',
      name: 'Azure DevOps',
      description: 'Integrate with Azure DevOps for continuous security',
      icon: <IconBrandAzure className="w-7 h-7 text-gray-900 dark:text-white" />,
      category: 'cicd',
      status: 'available'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get real-time security alerts in Slack',
      icon: <IconBrandSlack className="w-7 h-7 text-[#611f69]" />,
      category: 'notifications',
      status: slackConnected ? 'connected' : 'available',
      isPopular: true,
      customComponent: <SlackIntegrationCard key="slack-card" />
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Create and track security issues directly in Jira',
      icon: <IconChecklist className="w-7 h-7 text-gray-900 dark:text-white" />,
      category: 'project-management',
      status: 'connected',
      isPopular: true,
      connectedProjects: 5,
      lastSynced: '10 minutes ago'
    },
  ];

  const categories = [
    { id: 'all', name: 'All Integrations', count: integrations.length },
    { id: 'source-control', name: 'Source Control', count: integrations.filter(i => i.category === 'source-control').length },
    { id: 'cicd', name: 'CI/CD', count: integrations.filter(i => i.category === 'cicd').length },
    { id: 'notifications', name: 'Notifications', count: integrations.filter(i => i.category === 'notifications').length },
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
      
      <AppSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="p-8 border-b border-gray-200 dark:border-white/20">
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium text-gray-900 dark:text-white">SecureThread</span>
                  <ChevronRight size={16} className="text-gray-500 dark:text-white/60" />
                  <span className="font-medium text-gray-900 dark:text-white">Integrations</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      Integrations
                    </h1>
                    <p className="text-gray-700 dark:text-white/80">
                      Connect your tools and services to SecureThread
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-8 border-b border-gray-200 dark:border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 dark:bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-green-200 dark:border-white/20 hover:bg-green-100 dark:hover:bg-white/15 transition-all">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {connectedCount}
                    </div>
                    <div className="text-gray-700 dark:text-white/70 font-medium">
                      Connected
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-blue-200 dark:border-white/20 hover:bg-blue-100 dark:hover:bg-white/15 transition-all">
                    <div className="text-4xl font-bold text-[#003D6B] dark:text-blue-400 mb-2">
                      {availableCount}
                    </div>
                    <div className="text-gray-700 dark:text-white/70 font-medium">
                      Available
                    </div>
                  </div>
                  <div className="bg-[#E8F0FF] dark:bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-[#003D6B]/20 dark:border-white/20 hover:bg-[#D6E6FF] dark:hover:bg-white/15 transition-all">
                    <div className="text-4xl font-bold text-[#003D6B] dark:text-purple-400 mb-2">
                      24/7
                    </div>
                    <div className="text-gray-700 dark:text-white/70 font-medium">
                      Monitoring
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filters Section */}
              <div className="p-8 border-b border-gray-200 dark:border-white/20">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-white/60 w-5 h-5" />
                    <Input
                      placeholder="Search integrations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 bg-white dark:bg-white/10 backdrop-blur-sm border-gray-300 dark:border-white/20 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50 h-11 focus:bg-gray-50 dark:focus:bg-white/15"
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        style={selectedCategory === category.id ? { color: 'white' } : undefined}
                        className={selectedCategory === category.id ? 
                          "bg-[#003D6B] hover:bg-[#002A4D] dark:bg-orange-500 dark:hover:bg-orange-600 border-0 font-medium transition-colors !text-white" : 
                          "bg-white dark:bg-white/10 backdrop-blur-sm border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-[#003D6B] hover:text-white hover:border-[#003D6B] dark:hover:bg-orange-500 dark:hover:text-white dark:hover:border-orange-500 transition-colors"
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
                      integrations={filteredIntegrations.filter(i => i.category === 'source-control')}
                      onToggle={handleToggleIntegration}
                    />
                    <IntegrationCategory 
                      title="CI/CD Platforms" 
                      integrations={filteredIntegrations.filter(i => i.category === 'cicd')}
                      onToggle={handleToggleIntegration}
                    />
                    <IntegrationCategory 
                      title="Notifications" 
                      integrations={filteredIntegrations.filter(i => i.category === 'notifications')}
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
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-white/20">
                      <Search className="w-10 h-10 text-gray-400 dark:text-white/60" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No integrations found</h3>
                    <p className="text-gray-600 dark:text-white/60">Try adjusting your search or filter criteria</p>
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