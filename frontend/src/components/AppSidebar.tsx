import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth } from "../contexts/AuthContext";
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
} from "@tabler/icons-react";
import { ChevronDown, Plus, Settings } from "lucide-react";

interface AppSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
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
  
  // TODO: Replace with actual workspace data from your API/context
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>({
    id: "1",
    name: "Demo w8NGeD0tIl2",
    role: "Owner"
  });
  
  const [workspaces] = useState<Workspace[]>([
    { id: "1", name: "Demo w8NGeD0tIl2", role: "Owner" },
    { id: "2", name: "Production Workspace", role: "Admin" },
    { id: "3", name: "Development Team", role: "Member" },
  ]);

  const handleWorkspaceSwitch = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setShowDropdown(false);
    // TODO: Add API call to switch workspace context
  };

  const handleCreateWorkspace = () => {
    setShowDropdown(false);
    navigate("/workspace/create");
  };

  const handleWorkspaceSettings = () => {
    setShowDropdown(false);
    navigate("/workspace/settings");
  };

  return (
    <div className="relative px-3 mb-4">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10 ${
          !sidebarOpen ? "justify-center" : ""
        }`}
      >
        {sidebarOpen ? (
          <>
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-accent/40 to-accent/60 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {currentWorkspace.name.charAt(0)}
                </span>
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-white font-medium text-sm truncate">
                  {currentWorkspace.name}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/70 flex-shrink-0 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
          </>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-accent/40 to-accent/60 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {currentWorkspace.name.charAt(0)}
            </span>
          </div>
        )}
      </button>

      {showDropdown && sidebarOpen && (
        <div className="absolute top-full left-3 right-3 mt-2 bg-[#1a1a2e] rounded-lg shadow-2xl border border-white/20 py-2 z-50 max-h-[400px] overflow-y-auto">
          {/* Current Workspace Info */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-accent/40 to-accent/60 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {currentWorkspace.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-white font-medium text-sm">
                  {currentWorkspace.name}
                </div>
                <div className="text-white/50 text-xs">Current Workspace</div>
              </div>
            </div>
          </div>

          {/* Other Workspaces */}
          <div className="py-1">
            {workspaces
              .filter(w => w.id !== currentWorkspace.id)
              .map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleWorkspaceSwitch(workspace)}
                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-white/20 to-white/10 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {workspace.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-sm truncate">
                      {workspace.name}
                    </div>
                    <div className="text-white/50 text-xs">{workspace.role}</div>
                  </div>
                </button>
              ))}
          </div>

          {/* Actions */}
          <div className="border-t border-white/10 py-1 mt-1">
            <button
              onClick={handleCreateWorkspace}
              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-white/10 transition-colors text-white/90"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Create New Workspace</span>
            </button>
            <button
              onClick={handleWorkspaceSettings}
              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-white/10 transition-colors text-white/90"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Workspace Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AppSidebar: React.FC<AppSidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation links (Members removed)
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

  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col">
          {/* Logo */}
          <div className="flex items-center justify-center mb-4 min-h-[80px] relative">
            <div className="flex-1 flex justify-center">
              <Logo sidebarOpen={sidebarOpen} />
            </div>
          </div>

          {/* Workspace Switcher */}
          <WorkspaceSwitcher sidebarOpen={sidebarOpen} />

          {/* Main Navigation */}
          <div className="mt-2 flex flex-col gap-2">
            {feedLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          {/* Bottom Navigation */}
          <div className="mt-auto flex flex-col gap-2">
            {bottomLinks.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          {/* Profile Section with Enhanced Dropdown */}
          <div className="pt-4 border-t border-brand-gray/30 relative">
            <div onClick={handleProfileClick} className="cursor-pointer">
              <SidebarLink link={profileLink} />
            </div>

            {showProfileDropdown && (
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
            )}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

export default AppSidebar;