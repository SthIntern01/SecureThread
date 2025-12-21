import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EtherealBackground } from "../components/ui/ethereal-background";
import AppSidebar from "@/components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";
import {
  Github,
  ExternalLink,
  Mail,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { IconBrandGitlab, IconBrandBitbucket, IconUser } from "@tabler/icons-react";

const Profile = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [criticalIssue, setCriticalIssue] = useState(false);

  const getLinkedAccounts = () => {
    const accounts = [];
    
    if (user?.github_username) {
      accounts.push({
        provider: "GitHub",
        username: user.github_username,
        icon: <Github className="w-5 h-5" />,
      });
    }
    
    if (user?.gitlab_username) {
      accounts.push({
        provider: "GitLab",
        username: user.gitlab_username,
        icon: <IconBrandGitlab className="w-5 h-5" />,
      });
    }
    
    if (user?.bitbucket_username) {
      accounts.push({
        provider: "Bitbucket",
        username: user.bitbucket_username,
        icon: <IconBrandBitbucket className="w-5 h-5" />,
      });
    }
    
    return accounts;
  };

  const linkedAccounts = getLinkedAccounts();

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Main Container */}
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-8 border-b theme-border">
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium theme-text">SecureThread</span>
                  <ChevronRight size={16} className="theme-text-muted" />
                  <span className="font-medium theme-text">My Profile</span>
                </div>

                <div className="flex items-center space-x-6">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || user.github_username}
                      className="w-20 h-20 rounded-full border-2 border-accent"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/40 to-accent/60 flex items-center justify-center border-2 border-accent">
                      <IconUser className="w-10 h-10 theme-text" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold theme-text mb-1">
                      {user?.full_name || user?.github_username || user?.gitlab_username || user?.bitbucket_username || "User"}
                    </h1>
                    <p className="text-white/70">
                      {user?.email || "No email available"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Profile */}
                  <div className="theme-bg-subtle rounded-2xl border theme-border p-6">
                    <h3 className="text-xl font-semibold theme-text mb-6 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2 text-accent" />
                      Personal Profile
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold theme-text-secondary mb-3 uppercase tracking-wide">
                          Linked Accounts
                        </h4>
                        {linkedAccounts.length > 0 ? (
                          <div className="space-y-3">
                            {linkedAccounts.map((account, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between p-3 theme-bg-subtle rounded-lg border theme-border hover:bg-gray-100/80 dark:bg-white/10 transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="theme-text">
                                    {account.icon}
                                  </div>
                                  <div>
                                    <div className="theme-text font-medium">
                                      {user?.full_name || account.username}
                                    </div>
                                    <div className="theme-text-muted text-sm">
                                      {account.provider}
                                    </div>
                                  </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-white/40" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 theme-bg-subtle rounded-lg border theme-border">
                            <Github className="w-12 h-12 text-white/30 mx-auto mb-3" />
                            <p className="theme-text-muted text-sm">
                              No accounts linked yet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email Notifications */}
                  <div className="theme-bg-subtle rounded-2xl border theme-border p-6">
                    <h3 className="text-xl font-semibold theme-text mb-6 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-accent" />
                      Email Notifications
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold theme-text-secondary mb-3 uppercase tracking-wide">
                          Notification Email
                        </h4>
                        <div className="flex items-center justify-between p-3 theme-bg-subtle rounded-lg border theme-border">
                          <span className="theme-text">
                            {user?.email || "No email available"}
                          </span>
                          <ExternalLink className="w-4 h-4 text-white/40" />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold theme-text-secondary mb-4 uppercase tracking-wide">
                          Notification Preferences
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 theme-bg-subtle rounded-lg border theme-border hover:bg-gray-100/80 dark:bg-white/10 transition-colors">
                            <div>
                              <label htmlFor="weekly-digest" className="theme-text font-medium cursor-pointer block">
                                Weekly Digest
                              </label>
                              <p className="theme-text-muted text-sm">
                                Receive a summary every Monday
                              </p>
                            </div>
                            <Switch
                              id="weekly-digest"
                              checked={weeklyDigest}
                              onCheckedChange={setWeeklyDigest}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 theme-bg-subtle rounded-lg border theme-border hover:bg-gray-100/80 dark:bg-white/10 transition-colors">
                            <div>
                              <label htmlFor="critical-issue" className="theme-text font-medium cursor-pointer block">
                                Critical Issues
                              </label>
                              <p className="theme-text-muted text-sm">
                                Get notified of critical vulnerabilities
                              </p>
                            </div>
                            <Switch
                              id="critical-issue"
                              checked={criticalIssue}
                              onCheckedChange={setCriticalIssue}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info Section */}
                <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                  <div className="flex items-start space-x-3">
                    <UserIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold theme-text mb-1">
                        Profile Information
                      </h4>
                      <p className="text-white/70 text-sm">
                        Your profile information is synced with your connected authentication provider. 
                        To update your name or avatar, please update it through your {linkedAccounts[0]?.provider || "authentication"} account.
                      </p>
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

export default Profile;
