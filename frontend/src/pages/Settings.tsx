import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
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
  IconRobot,
  IconLogout,
} from '@tabler/icons-react';

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

const ResponsiveSidebar = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) => {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

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
      active: true,
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

const SettingsCard = ({ title, description, children, icon: Icon }: { 
  title: string; 
  description?: string; 
  children: React.ReactNode;
  icon?: React.ComponentType<any>;
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 shadow-sm">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="w-5 h-5 text-accent" />}
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
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

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    // Account - use actual user data or fallbacks
    firstName: user?.full_name?.split(' ')[0] || 'Lora',
    lastName: user?.full_name?.split(' ')[1] || 'Piterson',
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

  const apiKey = 'st_live_1234567890abcdef1234567890abcdef12345678';

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
      
      <ResponsiveSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
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
                  <span className="font-medium text-white">Settings</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      Settings
                    </h1>
                    <p className="text-white/80">
                      Manage your account and security preferences
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Content */}
              <div className="p-8">
                {/* Settings Tabs */}
                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="bg-white/10 backdrop-blur-lg border border-white/20 mb-8">
                    <TabsTrigger 
                      value="account" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:text-white"
                    >
                      Account
                    </TabsTrigger>
                    <TabsTrigger 
                      value="security" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:text-white"
                    >
                      Security
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notifications" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:text-white"
                    >
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger 
                      value="organization" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:text-white"
                    >
                      Organization
                    </TabsTrigger>
                    <TabsTrigger 
                      value="billing" 
                      className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/70 data-[state=active]:text-white"
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
                          <label className="block text-sm font-medium text-white mb-2">First Name</label>
                          <Input 
                            value={settings.firstName}
                            onChange={(e) => handleSettingChange('firstName', e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                          <Input 
                            value={settings.lastName}
                            onChange={(e) => handleSettingChange('lastName', e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                        <Input 
                          value={settings.email}
                          onChange={(e) => handleSettingChange('email', e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
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
                          <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                          <Input 
                            type="password" 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">New Password</label>
                          <Input 
                            type="password" 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
                          <Input 
                            type="password" 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50" 
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
                          <p className="font-medium text-white">Two-Factor Authentication</p>
                          <p className="text-sm text-white/70">
                            {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'} - Protect your account with 2FA
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

                    <SettingsCard 
                      title="API Keys" 
                      description="Manage your API keys for integrations"
                      icon={Key}
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Production API Key</label>
                          <div className="flex items-center space-x-2">
                            <Input 
                              value={showApiKey ? apiKey : '•'.repeat(apiKey.length)}
                              readOnly
                              className="bg-white/10 border-white/20 text-white font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="bg-white/10 border-white/20 text-white/70"
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(apiKey)}
                              className="bg-white/10 border-white/20 text-white/70"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" className="bg-white/10 border-white/20 text-white/70">
                            <Plus className="w-4 h-4 mr-2" />
                            Generate New Key
                          </Button>
                          <Button variant="outline" className="bg-white/10 border-white/20 text-red-400 hover:text-red-300">
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
                          <label className="block text-sm font-medium text-white mb-2">Session Timeout (hours)</label>
                          <Input 
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                            className="bg-white/10 border-white/20 text-white w-32"
                          />
                        </div>
                        <Button variant="outline" className="bg-white/10 border-white/20 text-red-400 hover:text-red-300">
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
                            <p className="font-medium text-white">Security Alerts</p>
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
                            <p className="font-medium text-white">Critical Issues Only</p>
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
                            <p className="font-medium text-white">Weekly Reports</p>
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
                          <p className="font-medium text-white">Slack Notifications</p>
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
                          <label className="block text-sm font-medium text-white mb-2">Organization Name</label>
                          <Input 
                            value={settings.orgName}
                            onChange={(e) => handleSettingChange('orgName', e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Default Member Role</label>
                          <select 
                            value={settings.defaultRole}
                            onChange={(e) => handleSettingChange('defaultRole', e.target.value)}
                            className="w-full p-2 border border-white/20 rounded-md bg-white/10 text-white"
                          >
                            <option value="viewer" className="bg-gray-800 text-white">Viewer</option>
                            <option value="developer" className="bg-gray-800 text-white">Developer</option>
                            <option value="admin" className="bg-gray-800 text-white">Admin</option>
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
                          <p className="font-medium text-white">Auto-accept Invitations</p>
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
                            <h4 className="font-semibold text-white">Professional Plan</h4>
                            <p className="text-sm text-white/70">$99/month • Up to 50 projects</p>
                          </div>
                          <Badge className="bg-accent text-accent-foreground">Active</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/10">
                          <div>
                            <p className="text-sm font-medium text-white">Projects Used</p>
                            <p className="text-2xl font-bold text-white">12 <span className="text-sm font-normal text-white/70">/ 50</span></p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Next Billing</p>
                            <p className="text-sm text-white/70">August 28, 2025</p>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            Upgrade Plan
                          </Button>
                          <Button variant="outline" className="bg-white/10 border-white/20 text-white/70">
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
                            <p className="font-medium text-white">Payment Method</p>
                            <p className="text-sm text-white/70">•••• •••• •••• 4242 (Expires 12/26)</p>
                          </div>
                          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white/70">
                            Update
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div>
                            <p className="font-medium text-white">Billing Email</p>
                            <p className="text-sm text-white/70">billing@securthread.com</p>
                          </div>
                          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white/70">
                            Change
                          </Button>
                        </div>
                      </div>
                    </SettingsCard>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Bottom Section */}
              <div className="p-8 bg-white/5 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <IconSettings className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
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
    </div>
  );
};

export default Settings;