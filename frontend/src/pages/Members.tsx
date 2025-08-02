import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EtherealBackground } from '../components/ui/ethereal-background';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Filter, Search, Trash2, Link as LinkIcon, UserPlus, ChevronRight } from 'lucide-react';

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
      active: true,
    },
    {
      label: "Integrations",
      href: "/integrations",
      icon: <IconBrandGithub className="h-5 w-5 shrink-0" />,
      active: false,
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

const HighFiveIllustration = () => {
  return (
    <div className="flex items-center justify-center mb-6">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M25 60C25 55 28 50 35 48C40 46 45 48 48 52L52 58L48 65C45 68 40 70 35 68C28 66 25 62 25 60Z"
          fill="hsl(var(--accent))"
          opacity="0.8"
        />
        <path
          d="M95 60C95 55 92 50 85 48C80 46 75 48 72 52L68 58L72 65C75 68 80 70 85 68C92 66 95 62 95 60Z"
          fill="hsl(var(--accent))"
          opacity="0.8"
        />
        <circle cx="60" cy="60" r="8" fill="hsl(var(--accent))" opacity="0.6" />
        <circle cx="60" cy="60" r="12" fill="none" stroke="hsl(var(--accent))" strokeWidth="2" opacity="0.4" />
        <circle cx="60" cy="60" r="16" fill="none" stroke="hsl(var(--accent))" strokeWidth="1" opacity="0.2" />
      </svg>
    </div>
  );
};

const Members = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const members = [
    {
      id: 1,
      name: "Lora Piterson",
      email: "lora@example.com",
      auth: "GitHub",
      role: "Org Admin",
      dateJoined: "18 Jul 2025",
      isCurrentUser: true,
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop"
    },
    {
      id: 2,
      name: "John Smith",
      email: "john@example.com",
      auth: "GitHub",
      role: "Developer",
      dateJoined: "15 Jul 2025",
      isCurrentUser: false,
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop"
    },
    {
      id: 3,
      name: "Sarah Wilson",
      email: "sarah@example.com",
      auth: "GitHub",
      role: "Designer",
      dateJoined: "12 Jul 2025",
      isCurrentUser: false,
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop"
    }
  ];

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <EtherealBackground 
        color="rgba(255, 255, 255, 0.6)"    // White shadows moving over black
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />
      
      <ResponsiveSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-brand-black mb-2">
                Members
              </h1>
              <p className="text-brand-gray">User &gt; Members</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 shadow-sm">
              <div className="p-6 border-b border-gray-200/50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Button variant="outline" className="bg-white/50 border-gray-300">
                      <Filter className="w-4 h-4" />
                    </Button>
                    
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-gray w-4 h-4" />
                      <Input
                        placeholder="Search name, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/50"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add members
                    </Button>
                    <button className="text-sm text-brand-gray hover:text-brand-black flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      Copy invite link
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-brand-gray">
                    {filteredMembers.length} of {members.length} Members
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50">
                      <th className="text-left py-4 px-6 text-sm font-semibold text-brand-black">NAME</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-brand-black">AUTH</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-brand-black">ROLE</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-brand-black">DATE JOINED</th>
                      <th className="w-12 py-4 px-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b border-gray-200/30 hover:bg-gray-50/50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                              <img 
                                src={member.avatar} 
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-brand-black">{member.name}</span>
                                {member.isCurrentUser && (
                                  <Badge variant="secondary" className="text-xs bg-accent/20 text-accent-foreground">
                                    YOU
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-brand-gray">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <IconBrandGithub className="w-4 h-4" />
                            <span className="text-sm text-brand-black">{member.auth}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-brand-black">{member.role}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-brand-gray">{member.dateJoined}</span>
                        </td>
                        <td className="py-4 px-6">
                          <button className="text-brand-gray hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-12 text-center border-t border-gray-200/50">
                <HighFiveIllustration />
                <h3 className="text-xl font-semibold text-brand-black mb-2">
                  Security is a team sport
                </h3>
                <p className="text-brand-gray mb-6">
                  Secure your team's projects, together.
                </p>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground mb-4">
                  Invite your teammates
                </Button>
                <div>
                  <button className="text-sm text-brand-gray hover:text-brand-black underline">
                    Don't show this again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Members;