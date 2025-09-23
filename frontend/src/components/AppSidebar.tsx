import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth } from "../contexts/AuthContext";
import logo from "../images/logo.png";
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
  IconLogout,
  IconRobot,
} from "@tabler/icons-react";

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

const AppSidebar: React.FC<AppSidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const location = useLocation();

  // Define all navigation links
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
      label: "Members",
      href: "/members",
      icon: <IconUsers className="h-5 w-5 shrink-0" />,
      active: location.pathname === "/members",
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
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
      active: location.pathname === "/settings",
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
    setShowLogout(!showLogout);
  };

  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col">
          {/* Logo Container - Always visible and prominent */}
          <div className="flex items-center justify-center mb-6 min-h-[80px] relative">
            <div className="flex-1 flex justify-center">
              <Logo sidebarOpen={sidebarOpen} />
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2">
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

export default AppSidebar;