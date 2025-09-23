import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AppSidebar from "../components/AppSidebar";
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
import { EtherealBackground } from "../components/ui/ethereal-background";
import {
  Search,
  ChevronRight,
  UserPlus,
  Copy,
  Mail,
  Shield,
  MoreHorizontal,
  Filter,
  Users,
  Crown,
  Settings,
  Trash2,
  Check,
  X,
} from "lucide-react";
import {
  IconUser,
 } from "@tabler/icons-react";

interface Member {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  authProvider: "GitHub" | "GitLab" | "Email";
  dateJoined: string;
  status: "Active" | "Pending" | "Inactive";
  lastActive?: string;
}

const InviteMembersModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [inviteMethod, setInviteMethod] = useState<"email" | "link">("link");
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("Member");
  const [inviteLink] = useState("https://securethread.com/invite/abc123xyz");
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvites = () => {
    // Handle sending email invites
    console.log("Sending invites to:", emails, "with role:", role);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus size={20} />
            <span>Add Members to SecureThread</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Method Selection */}
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

          {/* Role Selection */}
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
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1"
                  />
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

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {inviteMethod === "email" ? (
              <Button
                onClick={handleSendInvites}
                className="flex-1 bg-accent hover:bg-accent/90"
                disabled={!emails.trim()}
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

const MemberRow = ({
  member,
  onRemove,
  onChangeRole,
}: {
  member: Member;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-b-0">
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
          <h3 className="font-semibold text-white">{member.name}</h3>
          <p className="text-sm text-white/70">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Badge className={`text-xs ${getRoleColor(member.role)}`}>
            <div className="flex items-center space-x-1">
              {getRoleIcon(member.role)}
              <span>{member.role}</span>
            </div>
          </Badge>
          <Badge className={`text-xs ${getStatusColor(member.status)}`}>
            {member.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {member.authProvider}
          </Badge>
        </div>

        <div className="text-right text-sm text-white/70">
          <div>Joined: {new Date(member.dateJoined).toLocaleDateString()}</div>
          <div>Active: {member.lastActive || "Never"}</div>
        </div>

        {member.role !== "Owner" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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
              <DropdownMenuItem onClick={() => onChangeRole(member.id, "Viewer")}>
                <IconUser className="w-4 h-4 mr-2" />
                Make Viewer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onRemove(member.id)}
                className="text-red-600 focus:text-red-600"
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

const Members = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - replace with actual API calls
  const [members, setMembers] = useState<Member[]>([
    {
      id: 1,
      name: "Sanjana Dev",
      email: "devsanjana7@gmail.com",
      role: "Owner",
      authProvider: "GitHub",
      dateJoined: "2025-07-18",
      status: "Active",
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "HashEmHsm4",
      email: "hasheemhsm4@gmail.com",
      role: "Admin",
      authProvider: "GitHub",
      dateJoined: "2025-07-18",
      status: "Active",
      lastActive: "1 day ago",
    },
  ]);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleRemoveMember = (id: number) => {
    setMembers(members.filter((member) => member.id !== id));
  };

  const handleChangeRole = (id: number, newRole: string) => {
    setMembers(
      members.map((member) =>
        member.id === id ? { ...member, role: newRole as Member["role"] } : member
      )
    );
  };

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "Active").length,
    pending: members.filter((m) => m.status === "Pending").length,
    admins: members.filter((m) => m.role === "Admin" || m.role === "Owner").length,
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
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header Section */}
              <div className="p-8 border-b border-white/10">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm mb-4">
                  <span className="font-medium text-white">SecureThread</span>
                  <ChevronRight size={16} className="text-white/60" />
                  <span className="font-medium text-white">Members</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                      Team Members
                    </h1>
                    <p className="text-white/80">
                      Manage your team members and their permissions
                    </p>
                  </div>
                  <div className="mt-6 lg:mt-0">
                    <Button
                      onClick={() => setShowInviteModal(true)}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Members
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-8 border-b border-white/10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {stats.total}
                    </div>
                    <div className="text-white/70 font-medium">
                      Total Members
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {stats.active}
                    </div>
                    <div className="text-white/70 font-medium">
                      Active
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                      {stats.pending}
                    </div>
                    <div className="text-white/70 font-medium">
                      Pending
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {stats.admins}
                    </div>
                    <div className="text-white/70 font-medium">
                      Admins
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="p-8 border-b border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full lg:w-48 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Member">Member</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-48 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Members List Section */}
              <div className="p-8">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Members Found
                    </h3>
                    <p className="text-white/70 mb-6">
                      Try adjusting your search or filter criteria.
                    </p>
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

              {/* Bottom Section */}
              <div className="p-8 bg-white/5 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Security is a Team Sport
                </h3>
                <p className="text-white/70 mb-6 max-w-md mx-auto">
                  Secure your team's projects together. Collaborate, monitor, and protect your codebase with SecureThread.
                </p>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Your Teammates
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Invite Members Modal */}
      <InviteMembersModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};

export default Members;