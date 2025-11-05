import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EtherealBackground } from "../components/ui/ethereal-background";
import AppSidebar from "@/components/AppSidebar";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { workspaceService } from "../services/workspaceService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ChevronRight,
  Settings,
  Users,
  GitBranch,
  Cloud,
  Package,
  Globe,
  Zap,
  Shield,
  MoreHorizontal,
  UserPlus,
  Copy,
  Mail,
  Crown,
  Trash2,
  Check,
  Plus,
  Github,
  AlertCircle,
} from "lucide-react";
import { IconUser } from "@tabler/icons-react";

// Team Member Interface
interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  authProvider: string;
  dateJoined: string;
  lastActive: string | null;
}

// Invite Modal Component
const InviteMembersModal = ({
  isOpen,
  onClose,
  onInviteSent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent: () => void;
}) => {
  const { currentWorkspace } = useWorkspace();
  const [inviteMethod, setInviteMethod] = useState<"email" | "link">("link");
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("Member");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && inviteMethod === "link" && currentWorkspace?.id) {
      generateInviteLink();
    }
  }, [isOpen, inviteMethod, role, currentWorkspace?.id]);

  const generateInviteLink = async () => {
    if (!currentWorkspace?.id) return;
    
    const workspaceId = String(currentWorkspace.id); // Convert to string
    
    try {
      setLoading(true);
      const response = await workspaceService.generateInviteLink(workspaceId, role);
      setInviteLink(response.invite_link);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvites = async () => {
    if (!emails.trim() || !currentWorkspace?.id) return;

    const workspaceId = String(currentWorkspace.id); // Convert to string

    try {
      setLoading(true);
      const emailList = workspaceService.parseEmails(emails);
      const validation = workspaceService.validateEmails(emailList);
      
      if (!validation.valid) {
        alert(validation.errors.join("\n"));
        return;
      }

      const response = await workspaceService.sendEmailInvitations(
        workspaceId,
        emailList,
        role
      );
      
      alert(`Invitations sent successfully to ${response.total_sent} recipients`);
      onInviteSent();
      onClose();
    } catch (error) {
      alert("Failed to send invitations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus size={20} />
            <span>Add Members to Workspace</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setInviteMethod("link")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                inviteMethod === "link"
                  ? "bg-white text-brand-black shadow-sm"
                  : "text-brand-gray hover:text-brand-black"
              }`}
            >
              Invite by Link
            </button>
            <button
              onClick={() => setInviteMethod("email")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                inviteMethod === "email"
                  ? "bg-white text-brand-black shadow-sm"
                  : "text-brand-gray hover:text-brand-black"
              }`}
            >
              Invite by Email
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-black mb-2">
              New members join as
            </label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Viewer">Viewer - Can view projects</SelectItem>
                <SelectItem value="Member">Member - Can view and comment</SelectItem>
                <SelectItem value="Admin">Admin - Full access except billing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {inviteMethod === "link" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-black mb-2">
                  Share this invite link
                </label>
                <div className="flex space-x-2">
                  <Input value={inviteLink} readOnly className="flex-1" />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-black mb-2">
                  Email addresses
                </label>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter email addresses separated by commas..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
                />
                <p className="text-xs text-brand-gray mt-1">
                  Separate multiple emails with commas
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {inviteMethod === "email" ? (
              <Button
                onClick={handleSendInvites}
                className="flex-1 bg-accent hover:bg-accent/90"
                disabled={!emails.trim() || loading}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invites
              </Button>
            ) : (
              <Button
                onClick={handleCopyLink}
                className="flex-1 bg-accent hover:bg-accent/90"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy Invite Link"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Member Row Component
const MemberRow = ({ 
  member,
  onRemove,
  onChangeRole,
}: { 
  member: TeamMember;
  onRemove: (id: number) => void;
  onChangeRole: (id: number, role: string) => void;
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "Admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "Member":
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return <IconUser className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Owner":
        return "bg-yellow-100 text-yellow-800";
      case "Admin":
        return "bg-blue-100 text-blue-800";
      case "Member":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b theme-border last:border-b-0">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full flex items-center justify-center">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <IconUser className="w-5 h-5 text-accent" />
          )}
        </div>
        <div>
          <h3 className="font-semibold theme-text">{member.name}</h3>
          <p className="text-sm text-white/70">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Badge className={`text-xs ${getRoleColor(member.role)}`}>
          <div className="flex items-center space-x-1">
            {getRoleIcon(member.role)}
            <span>{member.role}</span>
          </div>
        </Badge>

        <div className="text-right text-sm text-white/70">
          <div>Joined: {new Date(member.dateJoined).toLocaleDateString()}</div>
        </div>

        {member.role !== "Owner" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-100/80 dark:bg-white/10 rounded-lg transition-colors">
                <MoreHorizontal className="w-4 h-4 text-white/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onChangeRole(member.id, "Admin")}>
                <Shield className="w-4 h-4 mr-2" />
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeRole(member.id, "Member")}>
                <Users className="w-4 h-4 mr-2" />
                Make Member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onRemove(member.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

const WorkspaceSettings = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || "");
  
  // Real data loading
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadMembers();
  }, [currentWorkspace]);

  const loadMembers = async () => {
  if (!currentWorkspace) return;
  
  const workspaceId = String(currentWorkspace.id); // Convert to string
  
  try {
    setLoading(true);
    const membersData = await workspaceService.getWorkspaceMembers(workspaceId);
    
    // Explicitly map to TeamMember format
    const teamMembers: TeamMember[] = membersData.map(m => ({
      id: m.id,
      user_id: m.user_id,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      role: m.role,
      status: m.status,
      authProvider: m.authProvider,
      dateJoined: m.joined_at,
      lastActive: (m.last_active || null) as string | null,
    }));
    
    setMembers(teamMembers);
  } catch (error) {
    console.error('Error loading members:', error);
  } finally {
    setLoading(false);
  }
};

// Fix handleRemoveMember - line 413-421
const handleRemoveMember = async (id: number) => {
  if (!currentWorkspace) return;
  
  const workspaceId = String(currentWorkspace.id); // Convert to string
  
  try {
    await workspaceService.removeMember(workspaceId, id);
    await loadMembers();
  } catch (error) {
    alert("Failed to remove member");
  }
};

// Fix handleChangeRole - line 424-432
const handleChangeRole = async (id: number, newRole: string) => {
  if (!currentWorkspace) return;
  
  const workspaceId = String(currentWorkspace.id); // Convert to string
  
  try {
    await workspaceService.updateMemberRole(workspaceId, id, newRole);
    await loadMembers();
  } catch (error) {
    alert("Failed to update member role");
  }
};

  const handleInviteSent = () => {
    loadMembers();
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "teams", label: "Teams", icon: Users },
    { id: "repositories", label: "Repositories", icon: GitBranch },
    { id: "clouds", label: "Clouds", icon: Cloud },
    { id: "containers", label: "Containers", icon: Package },
    { id: "domains", label: "Domains & APIs", icon: Globe },
    { id: "integrations", label: "Integrations", icon: Zap },
    { id: "sla", label: "SLA", icon: Shield },
    { id: "advanced", label: "Advanced", icon: Settings },
  ];

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="bg-gray-100/80 dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-8 border-b theme-border">
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium theme-text">SecureThread</span>
                  <ChevronRight size={16} className="theme-text-muted" />
                  <span className="font-medium theme-text">Workspace Settings</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold theme-text mb-2">
                      {currentWorkspace?.name || workspaceName}
                    </h1>
                    <p className="theme-text-secondary">
                      Manage your workspace settings and preferences
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b theme-border">
                <div className="flex flex-wrap px-8 gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                          activeTab === tab.id
                            ? "text-accent border-b-2 border-accent"
                            : "text-white/70 hover:theme-text"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {/* General Tab */}
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <div className="theme-bg-subtle rounded-2xl border theme-border p-6">
                      <h3 className="text-xl font-semibold theme-text mb-4">
                        Workspace Info
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-2">
                            Workspace Name
                          </label>
                          <Input
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            className="bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-2">
                            Account Type
                          </label>
                          <Input
                            value="GitHub"
                            readOnly
                            className="theme-bg-subtle border-white/20 theme-text-muted"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="theme-bg-subtle rounded-2xl border theme-border p-6">
                      <h3 className="text-xl font-semibold theme-text mb-4">
                        Workspace Plan
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className="bg-purple-500 theme-text mb-2">
                            Pro Trial
                          </Badge>
                          <p className="text-white/70 text-sm">
                            You have 2 days left on SecureThread's full featured free trial
                          </p>
                        </div>
                        <Button className="bg-accent hover:bg-accent/90">
                          Upgrade Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Teams Tab */}
                {activeTab === "teams" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                        <Input
                          placeholder="Search members..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text placeholder:text-white/50"
                        />
                      </div>
                      <Button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-accent hover:bg-accent/90"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Members
                      </Button>
                    </div>

                    <div className="theme-bg-subtle rounded-2xl border theme-border p-6">
                      {loading ? (
                        <div className="text-center py-12">
                          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-white/70 mt-4">Loading members...</p>
                        </div>
                      ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold theme-text mb-2">
                            No Members Found
                          </h3>
                        </div>
                      ) : (
                        <div className="space-y-0">
                          {filteredMembers.map((member) => (
                            <MemberRow 
                              key={member.id} 
                              member={member}
                              onRemove={handleRemoveMember}
                              onChangeRole={handleChangeRole}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Repositories Tab */}
                {activeTab === "repositories" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-48 bg-gray-100/80 dark:bg-white/10 border-white/20 theme-text">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Repositories</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button className="bg-accent hover:bg-accent/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Repo
                      </Button>
                    </div>

                    <div className="theme-bg-subtle rounded-2xl border theme-border p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-4 border-b theme-border">
                          <div className="flex items-center space-x-4">
                            <Github className="w-8 h-8 text-white/70" />
                            <div>
                              <h3 className="font-semibold theme-text">deb-project</h3>
                              <p className="text-sm text-white/70">
                                Sanjanadev/deb-project
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                            <span className="text-sm text-white/70">
                              Last scan: 6m ago
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Tabs - Empty States */}
                {activeTab === "clouds" && (
                  <div className="text-center py-12 theme-bg-subtle rounded-2xl border theme-border">
                    <Cloud className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold theme-text mb-2">
                      Want to see the full picture?
                    </h3>
                    <p className="text-white/70 mb-6">
                      Harden your cloud infrastructure by finding misconfigurations in production
                    </p>
                    <Button className="bg-accent hover:bg-accent/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Connect Cloud
                    </Button>
                  </div>
                )}

                {activeTab === "containers" && (
                  <div className="text-center py-12 theme-bg-subtle rounded-2xl border theme-border">
                    <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold theme-text mb-2">
                      No Containers Connected
                    </h3>
                    <p className="text-white/70 mb-6">
                      Connect your container registries to scan for vulnerabilities
                    </p>
                    <Button className="bg-accent hover:bg-accent/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Connect Container Registry
                    </Button>
                  </div>
                )}

                {activeTab === "domains" && (
                  <div className="text-center py-12 theme-bg-subtle rounded-2xl border theme-border">
                    <Globe className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold theme-text mb-2">
                      No Domains or APIs Added
                    </h3>
                    <p className="text-white/70 mb-6">
                      Monitor your domains and APIs for security vulnerabilities
                    </p>
                    <Button className="bg-accent hover:bg-accent/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Domain or API
                    </Button>
                  </div>
                )}

                {activeTab === "integrations" && (
                  <div className="space-y-6">
                    <div className="theme-bg-subtle rounded-2xl border theme-border p-6">
                      <h3 className="text-xl font-semibold theme-text mb-4">
                        Connected Integrations
                      </h3>
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-4">
                          <Github className="w-8 h-8 theme-text" />
                          <div>
                            <h4 className="font-semibold theme-text">GitHub</h4>
                            <p className="text-sm text-white/70">
                              Connected to 1 repository
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="border-white/20 theme-text">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "sla" && (
                  <div className="space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <h3 className="font-semibold theme-text mb-1">
                            SLA Configuration
                          </h3>
                          <p className="text-white/70 text-sm">
                            Configure Service Level Agreements for vulnerability response times
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "advanced" && (
                  <div className="space-y-6">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                      <h3 className="text-xl font-semibold text-red-400 mb-4">
                        Danger Zone
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-4 border-b theme-border">
                          <div>
                            <h4 className="font-semibold theme-text">
                              Delete Workspace
                            </h4>
                            <p className="text-sm text-white/70">
                              Permanently delete this workspace and all its data
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                          >
                            Delete Workspace
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <InviteMembersModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSent={handleInviteSent}
      />
    </div>
  );
};

export default WorkspaceSettings;