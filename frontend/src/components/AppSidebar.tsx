// src/components/AppSidebar.tsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import logo from "../images/logo.png";
import {
  IconDashboard,
  IconFolder,
  IconBrandGithub,
  IconCircleCheck,
  IconMessageCircle,
  IconSettings,
  IconBook,
  IconHelp,
  IconUser,
  IconLogout,
  IconRobot,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { ChevronDown, Plus, Settings, Check } from "lucide-react";

interface AppSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Logo = ({ sidebarOpen }: { sidebarOpen: boolean }) => {
  return (
    <Link
      to="/"
      className={`relative z-20 flex items-center ${
        sidebarOpen ? "space-x-3 px-3" : "justify-center px-0"
      } py-3 text-sm font-normal transition-all duration-300`}
    >
      <img
        src={logo}
        alt="Secure Thread Logo"
        className={`${sidebarOpen ? "h-12" : "h-14"} w-auto flex-shrink-0 transition-all duration-300`}
      />
      {sidebarOpen && (
        <div className="font-bold text-white text-lg tracking-wide text-center">
          <div>SECURE</div>
          <div>THREAD</div>
        </div>
      )}
    </Link>
  );
};

const WorkspaceSwitcher = ({ sidebarOpen }: { sidebarOpen: boolean }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();

  const handleWorkspaceSwitch = async (workspaceId: number) => {
    try {
      await switchWorkspace(workspaceId);
      setShowDropdown(false);
      // Reload to refresh all data for the new workspace
      window.location.reload();
    } catch (error) {
      console.error('Error switching workspace:', error);
    }
  };

  const handleCreateWorkspace = () => {
    setShowDropdown(false);
    navigate("/workspace/create");
  };

  const handleWorkspaceSettings = () => {
    setShowDropdown(false);
    navigate("/workspace/settings");
  };

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className={`relative mb-4 ${sidebarOpen ? 'px-3' : 'flex justify-center'}`}>
      <button
        onClick={() => sidebarOpen && setShowDropdown(!showDropdown)}
        className={`flex items-center transition-all duration-200 ${
          sidebarOpen 
            ? 'w-full space-x-3 p-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-neutral-800' 
            : 'w-12 h-12 justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg'
        }`}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
          <span className="text-white font-bold text-base">
            {currentWorkspace.name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {sidebarOpen && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-white font-semibold text-sm truncate">
                {currentWorkspace.name.replace("'s Workspace", "").replace("'s Team", "").trim()}
              </div>
              <div className="text-neutral-400 text-xs">
                {currentWorkspace.repository_count} {currentWorkspace.repository_count === 1 ? 'repo' : 'repos'}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {showDropdown && sidebarOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          <div className="absolute top-full left-3 right-3 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 max-h-[400px] overflow-y-auto">
            {/* Current Workspace */}
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Current Workspace</p>
            </div>
            <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {currentWorkspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-900 text-sm font-medium truncate">
                    {currentWorkspace.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {currentWorkspace.repository_count} {currentWorkspace.repository_count === 1 ? 'repository' : 'repositories'}
                  </p>
                </div>
              </div>
              <Check className="w-5 h-5 text-accent flex-shrink-0" />
            </div>

            {/* Other Workspaces */}
            {workspaces.filter(w => w.id !== currentWorkspace.id).length > 0 && (
              <>
                <div className="px-4 py-2 border-t border-gray-200 mt-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Switch to</p>
                </div>
                {workspaces
                  .filter(w => w.id !== currentWorkspace.id)
                  .map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => handleWorkspaceSwitch(workspace.id)}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-700 text-sm font-semibold">
                          {workspace.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-900 text-sm font-medium truncate">
                          {workspace.name}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {workspace.repository_count} {workspace.repository_count === 1 ? 'repo' : 'repos'}
                        </p>
                      </div>
                    </button>
                  ))}
              </>
            )}

            {/* Actions */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={handleCreateWorkspace}
                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
              >
                <Plus className="w-5 h-5 text-gray-700 flex-shrink-0" />
                <span className="text-gray-900 text-sm font-medium">Create New Workspace</span>
              </button>

              <button
                onClick={handleWorkspaceSettings}
                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-gray-700 flex-shrink-0" />
                <span className="text-gray-900 text-sm font-medium">Workspace Settings</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AppSidebar: React.FC<AppSidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const location = useLocation();
  const navigate = useNavigate();

  const feedLinks = [
    {
      label: "Dashboard",
      href: "/",
      icon: <IconDashboard className="h-5 w-5 shrink-0" />,
      active: location.pathname === "/",
    },
    {
      label: "Projects",
      href: "/projects",
      icon: <IconFolder className="h-5 w-5 shrink-0" />,
      active: location.pathname.startsWith("/projects"),
    },
    {
      label: "Integrations",
      href: "/integrations",
      icon: <IconBrandGithub className="h-5 w-5 shrink-0" />,
      active: location.pathname === "/integrations",
      count: "99+",
    },
    {
      label: "AI Chat",
      href: "/ai-chat",
      icon: <IconRobot className="h-5 w-5 shrink-0" />,
      active: location.pathname === "/ai-chat",
    },
    {
      label: "Solved",
      href: "/solved",
      icon: <IconCircleCheck className="h-5 w-5 shrink-0" />,
      active: location.pathname === "/solved",
    },
  ];

  const bottomLinks = [
    {
      label: "Feedback",
      href: "/feedback",
      icon: <IconMessageCircle className="h-5 w-5 shrink-0" />,
      active: location.pathname === "/feedback",
    },
    {
      label: "Docs",
      href: "/docs",
      icon: <IconBook className="h-5 w-5 shrink-0" />,
      active: location.pathname === "/docs",
    },
    {
      label: "Help",
      href: "/help",
      icon: <IconHelp className="h-5 w-5 shrink-0" />,
      active: location.pathname === "/help",
    },
  ];

  const profileLink = {
    label: user?.full_name || user?.github_username || user?.bitbucket_username || "User",
    href: "#",
    icon: user?.avatar_url ? (
      <img
        src={user.avatar_url}
        alt={user.full_name || user.github_username || user.bitbucket_username}
        className="h-5 w-5 rounded-full shrink-0"
      />
    ) : (
      <IconUser className="h-5 w-5 shrink-0" />
    ),
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Implement theme switching logic
    console.log('Theme toggled:', !isDarkMode ? 'dark' : 'light');
  };

  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-center mb-4 min-h-[80px] relative">
            <div className="flex-1 flex justify-center">
              <Logo sidebarOpen={sidebarOpen} />
            </div>
          </div>

          <WorkspaceSwitcher sidebarOpen={sidebarOpen} />

          <div className="mt-2 flex flex-col gap-2">
            {feedLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            {bottomLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
            
            {/* Theme Toggle - Button Style */}
            {sidebarOpen ? (
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 bg-neutral-800 rounded-lg p-1">
                  <button
                    onClick={() => setIsDarkMode(false)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all ${
                      !isDarkMode
                        ? 'bg-white text-gray-900'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <IconSun className="h-4 w-4" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setIsDarkMode(true)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all ${
                      isDarkMode
                        ? 'bg-neutral-700 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <IconMoon className="h-4 w-4" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={handleThemeToggle}
                className="flex justify-center py-3 cursor-pointer"
              >
                <div className="relative w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-600 transition-colors">
                  {isDarkMode ? (
                    <IconMoon className="h-5 w-5 text-neutral-400" />
                  ) : (
                    <IconSun className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-brand-gray/30 relative">
            <div onClick={handleProfileClick} className="cursor-pointer">
              <SidebarLink link={profileLink} />
            </div>

            {showProfileDropdown && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileDropdown(false)}
                />
                
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <IconUser className="h-4 w-4" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/settings");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <IconSettings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <IconLogout className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

export default AppSidebar;