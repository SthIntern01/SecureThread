// frontend/src/pages/Settings.tsx - COMPLETE FILE

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EtherealBackground } from '../components/ui/ethereal-background';
import AppSidebar from '@/components/AppSidebar';
import { useAuth } from "../contexts/AuthContext";
import { 
  ChevronRight, 
  Save, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  AlertCircle,
  Shield,
  Bell,
  CreditCard,
  Key,
  Users,
  Lock
} from 'lucide-react';
import {
 IconBrandGithub,
 IconUser,
 IconSettings,
} from '@tabler/icons-react';
import { GitHubPATModal } from '../components/GitHubPATModal';
import { githubIntegrationService } from '../services/githubIntegrationService';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<any>;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, children, icon: Icon }) => {
  return (
    <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 shadow-sm">
      <div className="p-6 border-b theme-border">
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="w-5 h-5 text-accent" />}
          <div>
            <h3 className="text-lg font-semibold theme-text">{title}</h3>
            {description && <p className="text-sm text-white/70 mt-1">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { user } = useAuth();
  
  const [settings, setSettings] = useState({
    // Account - use actual user data or fallbacks
    firstName: user?.full_name?.split(' ')[0] || 'Lora',  // Fixed: removed space before split
    lastName: user?.full_name?.split(' ')[1] || 'Piterson',  // Fixed: removed space before split
    email: user?.email || 'lora@securthread.com',
    // Security
    twoFactorEnabled: true,
    sessionTimeout: '24',
    // Notifications
    emailAlerts: true,
    slackNotifications: true,
    criticalIssuesOnly: false,
    weeklyReports: true,
    // Organization
    orgName: 'SecureThread Inc.',
    autoInvite: false,
    defaultRole: 'developer',
  });

  // GitHub PAT state
  const [showPATModal, setShowPATModal] = useState(false);
  const [hasPATToken, setHasPATToken] = useState(false);
  const [patTokenInfo, setPatTokenInfo] = useState<any>(null);
  const [loadingPAT, setLoadingPAT] = useState(true);

  const apiKey = 'st_live_1234567890abcdef1234567890abcdef12345678';

  // Check PAT status on component mount
  useEffect(() => {
    checkPATStatus();
  }, []);

  const checkPATStatus = async () => {
    setLoadingPAT(true);
    try {
      const status = await githubIntegrationService.checkPATStatus();
      setHasPATToken(status.has_token);
      setPatTokenInfo(status);
    } catch (error) {
      console.error('Error checking PAT status:', error);
    } finally {
      setLoadingPAT(false);
    }
  };

  const handlePATSuccess = () => {
    setShowPATModal(false);
    checkPATStatus();
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="p-8 border-b theme-border">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium theme-text">SecureThread</span>
                  <ChevronRight size={16} className="theme-text-muted" />
                  <span className="font-medium theme-text">Settings</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold theme-text mb-2">
                      Settings
                    </h1>
                    <p className="theme-text-secondary">
                      Manage your account and security preferences
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Content */}
              <div className="p-8">
                {/* Settings Tabs */}
                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg border border-white/20 mb-8">
                    <TabsTrigger 
                      value="account" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:theme-text"
                    >
                      Account
                    </TabsTrigger>
                    <TabsTrigger 
                      value="security" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:theme-text"
                    >
                      Security
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notifications" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:theme-text"  // Fixed: removed space after :
                    >
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger 
                      value="organization" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:theme-text"  // Fixed: removed space after :
                    >
                      Organization
                    </TabsTrigger>
                    <TabsTrigger 
                      value="billing" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:theme-text"  // Fixed: removed space after :
                    >
                      Billing
                    </TabsTrigger>
                  </TabsList>

                  {/* Account Settings */}
                  <TabsContent value="account" className="space-y-6">
                    <SettingsCard 
                      title="Profile Information" 
                      description="Update your personal information"
                      icon={IconUser}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium theme-text mb-2">First Name</label>
                          <Input 
                            value={settings.firstName}
                            onChange={(e) => handleSettingChange('firstName', e.target.value)}
                            className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium theme-text mb-2">Last Name</label>
                          <Input 
                            value={settings.lastName}
                            onChange={(e) => handleSettingChange('lastName', e.target.value)}
                            className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium theme-text mb-2">Email Address</label>
                        <Input 
                          value={settings.email}
                          onChange={(e) => handleSettingChange('email', e.target.value)}
                          className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50"
                        />
                      </div>
                      <div className="mt-6 flex justify-end">
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </SettingsCard>

                    <SettingsCard 
                      title="Change Password" 
                      description="Update your account password"
                      icon={Lock}
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium theme-text mb-2">Current Password</label>
                          <Input 
                            type="password" 
                            className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium theme-text mb-2">New Password</label>
                          <Input 
                            type="password" 
                            className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium theme-text mb-2">Confirm New Password</label>
                          <Input 
                            type="password" 
                            className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50" 
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                          Update Password
                        </Button>
                      </div>
                    </SettingsCard>
                  </TabsContent>

                  {/* Security Settings */}
                  <TabsContent value="security" className="space-y-6">
                    <SettingsCard 
                      title="Two-Factor Authentication" 
                      description="Add an extra layer of security to your account"
                      icon={Shield}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium theme-text">Two-Factor Authentication</p>
                          <p className="text-sm text-white/70">
                            {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'} - Protect your account with 2FA  // Fixed: removed space after ?
                          </p>
                        </div>
                        <Switch
                          checked={settings.twoFactorEnabled}
                          onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
                          className="data-[state=checked]:bg-accent"
                        />
                      </div>
                      {settings.twoFactorEnabled && (
                        <div className="mt-4 p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-green-400" />
                            <span className="text-sm font-medium text-green-300">2FA is active on your account</span>
                          </div>
                        </div>
                      )}
                    </SettingsCard>

                    {/* GitHub Integration Section - NEW!  */}
                    <SettingsCard 
                      title="GitHub Integration" 
                      description="Connect your GitHub account to create pull requests"
                      icon={IconBrandGithub}
                    >
                      {loadingPAT ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                        </div>
                      ) : hasPATToken ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Shield className="w-5 h-5 text-green-400" />
                                <div>
                                  <p className="text-sm font-medium text-green-300">
                                    GitHub Token Connected
                                  </p>
                                  <p className="text-xs text-green-400/70 mt-1">
                                    Added on {patTokenInfo?.created_at ? new Date(patTokenInfo.created_at).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPATModal(true)}
                                className="bg-gray-100/80 dark:bg-white/10 border-white/20 text-white/70"
                              >
                                Update Token
                              </Button>
                            </div>
                          </div>
                          {patTokenInfo?.is_valid === false && (  // Fixed: removed space before is_valid
                            <div className="p-4 bg-orange-500/20 rounded-lg border border-orange-500/30">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-orange-400" />
                                <span className="text-sm font-medium text-orange-300">
                                  Token may be invalid or expired. Please update it.  // Fixed: removed extra space
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                            <div className="flex items-center space-x-3 mb-3">
                              <AlertCircle className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="text-sm font-medium text-blue-300">
                                  GitHub Token Not Connected
                                </p>
                                <p className="text-xs text-blue-400/70 mt-1">
                                  Add your Personal Access Token to enable pull request creation
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => setShowPATModal(true)}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          >
                            <IconBrandGithub className="w-4 h-4 mr-2" />
                            Add GitHub Token
                          </Button>
                        </div>
                      )}
                    </SettingsCard>

                    <SettingsCard 
                      title="API Keys" 
                      description="Manage your API keys for integrations"
                      icon={Key}
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium theme-text mb-2">Production API Key</label>
                          <div className="flex items-center space-x-2">
                            <Input 
                              value={showApiKey ? apiKey : '•'.repeat(apiKey.length)}  // Fixed: removed space before .repeat
                              readOnly
                              className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text font-mono text-sm"  // Fixed: removed space after dark:
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="bg-gray-100/80 dark:bg-white/10 border-white/20 text-white/70"
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(apiKey)}
                              className="bg-gray-100/80 dark:bg-white/10 border-white/20 text-white/70"  // Fixed: removed space after dark:
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" className="bg-gray-100/80 dark:bg-white/10 border-white/20 text-white/70">
                            <Plus className="w-4 h-4 mr-2" />
                            Generate New Key
                          </Button>
                          <Button variant="outline" className="bg-gray-100/80 dark:bg-white/10 border-white/20 text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Revoke Key
                          </Button>
                        </div>
                      </div>
                    </SettingsCard>

                    <SettingsCard 
                      title="Session Management" 
                      description="Control your login sessions"
                      icon={Lock}
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium theme-text mb-2">Session Timeout (hours)</label>
                          <Input 
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                            className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text w-32"
                          />
                        </div>
                        <Button variant="outline" className="bg-gray-100/80 dark:bg-white/10 border-white/20 text-red-400 hover:text-red-300">
                          Sign Out All Devices
                        </Button>
                      </div>
                    </SettingsCard>
                  </TabsContent>

                  {/* Notification Settings */}
                  <TabsContent value="notifications" className="space-y-6">
                    <SettingsCard 
                      title="Email Notifications" 
                      description="Configure when you receive email alerts"
                      icon={Bell}
                    >
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium theme-text">Security Alerts</p>
                            <p className="text-sm text-white/70">Get notified about security issues</p>
                          </div>
                          <Switch
                            checked={settings.emailAlerts}
                            onCheckedChange={(checked) => handleSettingChange('emailAlerts', checked)}
                            className="data-[state=checked]:bg-accent"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium theme-text">Critical Issues Only</p>
                            <p className="text-sm text-white/70">Only receive alerts for critical vulnerabilities</p>
                          </div>
                          <Switch
                            checked={settings.criticalIssuesOnly}
                            onCheckedChange={(checked) => handleSettingChange('criticalIssuesOnly', checked)}
                            className="data-[state=checked]:bg-accent"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium theme-text">Weekly Reports</p>
                            <p className="text-sm text-white/70">Receive weekly security summary reports</p>
                          </div>
                          <Switch
                            checked={settings.weeklyReports}
                            onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                            className="data-[state=checked]:bg-accent"
                          />
                        </div>
                      </div>
                    </SettingsCard>

                    <SettingsCard 
                      title="Integration Notifications" 
                      description="Configure notifications from your integrations"
                      icon={IconBrandGithub}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium theme-text">Slack Notifications</p>
                          <p className="text-sm text-white/70">Send alerts to your Slack workspace</p>
                        </div>
                        <Switch
                          checked={settings.slackNotifications}
                          onCheckedChange={(checked) => handleSettingChange('slackNotifications', checked)}
                          className="data-[state=checked]:bg-accent"
                        />
                      </div>
                    </SettingsCard>
                  </TabsContent>

                  {/* Organization Settings */}
                  <TabsContent value="organization" className="space-y-6">
                    <SettingsCard 
                      title="Organization Details" 
                      description="Manage your organization settings"
                      icon={Users}
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium theme-text mb-2">Organization Name</label>
                          <Input 
                            value={settings.orgName}
                            onChange={(e) => handleSettingChange('orgName', e.target.value)}
                            className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50"  // Fixed: removed space after placeholder:
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium theme-text mb-2">Default Member Role</label>
                          <select 
                            value={settings.defaultRole}  // Fixed: removed space before defaultRole
                            onChange={(e) => handleSettingChange('defaultRole', e.target.value)}
                            className="w-full p-2 border border-white/20 rounded-md bg-gray-100/80 dark:bg-white/10 theme-text"
                          >
                            <option value="viewer" className="bg-gray-800 theme-text">Viewer</option>
                            <option value="developer" className="bg-gray-800 theme-text">Developer</option>
                            <option value="admin" className="bg-gray-800 theme-text">Admin</option>
                          </select>
                        </div>
                      </div>
                    </SettingsCard>

                    <SettingsCard 
                      title="Member Management" 
                      description="Control how new members join your organization"
                      icon={Users}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium theme-text">Auto-accept Invitations</p>
                          <p className="text-sm text-white/70">Automatically accept members from your domain</p>
                        </div>
                        <Switch
                          checked={settings.autoInvite}
                          onCheckedChange={(checked) => handleSettingChange('autoInvite', checked)}
                          className="data-[state=checked]:bg-accent"
                        />
                      </div>
                    </SettingsCard>
                  </TabsContent>

                  {/* Billing Settings */}
                  <TabsContent value="billing" className="space-y-6">
                    <SettingsCard 
                      title="Current Plan" 
                      description="Manage your subscription and billing"
                      icon={CreditCard}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold theme-text">Professional Plan</h4>
                            <p className="text-sm text-white/70">$99/month • Up to 50 projects</p>
                          </div>
                          <Badge className="bg-accent text-accent-foreground">Active</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 py-4 border-t theme-border">
                          <div>
                            <p className="text-sm font-medium theme-text">Projects Used</p>
                            <p className="text-2xl font-bold theme-text">12 <span className="text-sm font-normal text-white/70">/ 50</span></p>
                          </div>
                          <div>
                            <p className="text-sm font-medium theme-text">Next Billing</p>
                            <p className="text-sm text-white/70">August 28, 2025</p>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            Upgrade Plan
                          </Button>
                          <Button variant="outline" className="bg-gray-100/80 dark:bg-white/10 border-white/20 text-white/70">
                            View Usage
                          </Button>
                        </div>
                      </div>
                    </SettingsCard>

                    <SettingsCard 
                      title="Billing Information" 
                      description="Update your billing details and payment method"
                      icon={CreditCard}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium theme-text">Payment Method</p>
                            <p className="text-sm text-white/70">•••• •••• •••• 4242 (Expires 12/26)</p>
                          </div>
                          <Button variant="outline" size="sm" className="bg-gray-100/80 dark:bg-white/10 border-white/20 text-white/70">
                            Update
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t theme-border">
                          <div>
                            <p className="font-medium theme-text">Billing Email</p>
                            <p className="text-sm text-white/70">billing@securthread.com</p>
                          </div>
                          <Button variant="outline" size="sm" className="bg-gray-100/80 dark:bg-white/10 border-white/20 text-white/70">
                            Change
                          </Button>
                        </div>
                      </div>
                    </SettingsCard>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Bottom Section */}
              <div className="p-8 theme-bg-subtle text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <IconSettings className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold theme-text mb-2">
                  Secure Configuration
                </h3>
                <p className="text-white/70 mb-6 max-w-md mx-auto">
                  Your security settings help protect your team and projects. Keep your configuration up to date. 
                </p>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Shield className="w-4 h-4 mr-2" />
                  Review Security Settings
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* GitHub PAT Modal */}
      <GitHubPATModal
        isOpen={showPATModal}
        onClose={() => setShowPATModal(false)}
        onSuccess={handlePATSuccess}
      />
    </div>
  );
};

export default Settings;