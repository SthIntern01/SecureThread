import React, { useState } from 'react';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';
import { ChevronRight } from 'lucide-react';
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
      active: false,
      count: "99+",
    },
    {
      label: "AI Chat",
      href: "/ai-chat",
      icon: <IconRobot className="h-5 w-5 shrink-0" />,
      active: true,
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
      href: "#",
      icon: <IconMessageCircle className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
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

const AIChat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm mb-4">
              <span className="font-medium text-white">User</span>
              <ChevronRight size={16} className="text-gray-300" />
              <span className="font-medium text-white">AI Chat</span>
            </div>

            {/* AI Chat Component */}
            <div className="w-full h-full">
              <AnimatedAIChat />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;