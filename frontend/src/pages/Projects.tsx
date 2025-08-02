import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { EtherealBackground } from "../components/ui/ethereal-background";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth } from "../contexts/AuthContext";
import {
  Search,
  ChevronRight,
  GitBranch,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Play,
  Settings,
  Eye,
  Star,
  Activity,
  TrendingUp,
  Upload,
  Github,
} from "lucide-react";
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
  IconBrandGitlab,
  IconBrandDocker,
  IconShield,
  IconLogout,
  IconPlus,
} from "@tabler/icons-react";

interface Repository {
  id: number;
  github_id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  language: string;
  is_private: boolean;
  is_fork: boolean;
  is_imported?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  owner: string;
  repository: string;
  source: "github" | "gitlab" | "docker";
  status: "active" | "scanning" | "failed" | "completed";
  lastScan: string;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  coverage: number;
  isStarred: boolean;
  branch: string;
  scanDuration: string;
}

const ResponsiveSidebar = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => {
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
      active: true,
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

  const handleProfileClick = () => {
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

const ImportRepositoriesModal = ({
  isOpen,
  onClose,
  onImport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (repoIds: number[]) => void;
}) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchAvailableRepositories();
    }
  }, [isOpen]);

  const fetchAvailableRepositories = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      console.log(
        "Fetching repositories with token:",
        token ? "Present" : "Missing"
      );

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/repositories/github/available`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers.get("content-type"));

      if (response.ok) {
        const data = await response.json();
        console.log("Repository data:", data);
        setRepositories(data.repositories || []);
      } else {
        const errorData = await response.text();
        console.error("Error response:", errorData);
        setError(
          `Failed to fetch repositories: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
      setError("Network error occurred while fetching repositories");
    } finally {
      setLoading(false);
    }
  };

  const handleRepoToggle = (repoId: number) => {
    setSelectedRepos((prev) =>
      prev.includes(repoId)
        ? prev.filter((id) => id !== repoId)
        : [...prev, repoId]
    );
  };

  const handleImport = async () => {
    if (selectedRepos.length === 0) return;

    setImporting(true);
    try {
      await onImport(selectedRepos);
      setSelectedRepos([]);
      onClose();
    } catch (error) {
      console.error("Error importing repositories:", error);
    } finally {
      setImporting(false);
    }
  };

  const filteredRepos = repositories
    .filter((repo) => !repo.is_imported)
    .filter(
      (repo) =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Github size={20} />
            <span>Import GitHub Repositories</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {loading ? (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-brand-gray">Loading repositories...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div>
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchAvailableRepositories} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="text-sm text-brand-gray">
                  {selectedRepos.length} selected
                </div>
              </div>

              <div className="flex-1 overflow-y-auto border rounded-lg">
                {filteredRepos.length === 0 ? (
                  <div className="text-center py-8">
                    <Github className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-brand-gray">
                      {repositories.filter((r) => !r.is_imported).length === 0
                        ? "All your repositories have been imported!"
                        : "No repositories found matching your search."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredRepos.map((repo) => (
                      <div
                        key={repo.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={selectedRepos.includes(repo.github_id)}
                            onCheckedChange={() =>
                              handleRepoToggle(repo.github_id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm font-medium text-brand-black truncate">
                                {repo.full_name}
                              </h3>
                              {repo.is_private && (
                                <Badge variant="secondary" className="text-xs">
                                  Private
                                </Badge>
                              )}
                              {repo.is_fork && (
                                <Badge variant="outline" className="text-xs">
                                  Fork
                                </Badge>
                              )}
                              {repo.language && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-800"
                                >
                                  {repo.language}
                                </Badge>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-brand-gray mb-2 line-clamp-2">
                                {repo.description}
                              </p>
                            )}
                            <div className="flex items-center text-xs text-brand-gray space-x-4">
                              <span>Branch: {repo.default_branch}</span>
                              <span>
                                Updated:{" "}
                                {new Date(
                                  repo.updated_at || ""
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-brand-gray">
                  {filteredRepos.length} repositories available for import
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={selectedRepos.length === 0 || importing}
                    className="min-w-[120px]"
                  >
                    {importing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Importing...</span>
                      </div>
                    ) : (
                      `Import ${selectedRepos.length} ${
                        selectedRepos.length === 1
                          ? "Repository"
                          : "Repositories"
                      }`
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProjectCard = ({ project }: { project: Project }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "scanning":
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "scanning":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "github":
        return <IconBrandGithub className="w-4 h-4" />;
      case "gitlab":
        return <IconBrandGitlab className="w-4 h-4" />;
      case "docker":
        return <IconBrandDocker className="w-4 h-4" />;
      default:
        return <IconFolder className="w-4 h-4" />;
    }
  };

  const totalVulnerabilities =
    project.vulnerabilities.critical +
    project.vulnerabilities.high +
    project.vulnerabilities.medium +
    project.vulnerabilities.low;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
            {getSourceIcon(project.source)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-brand-black">
              {project.name}
            </h3>
            <p className="text-sm text-brand-gray">{project.owner}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-brand-gray hover:text-accent transition-colors">
            <Star
              className={`w-4 h-4 ${
                project.isStarred ? "fill-yellow-400 text-yellow-400" : ""
              }`}
            />
          </button>
          <button className="text-brand-gray hover:text-brand-black transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-brand-gray mb-4 line-clamp-2">
        {project.description}
      </p>

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(project.status)}
          <Badge className={`text-xs ${getStatusColor(project.status)}`}>
            {project.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-2 text-sm text-brand-gray">
          <GitBranch className="w-4 h-4" />
          <span>{project.branch}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-brand-gray mb-1">Vulnerabilities</div>
          <div className="text-lg font-semibold text-brand-black">
            {totalVulnerabilities}
          </div>
          {totalVulnerabilities > 0 && (
            <div className="flex space-x-1 mt-1">
              {project.vulnerabilities.critical > 0 && (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              )}
              {project.vulnerabilities.high > 0 && (
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              )}
              {project.vulnerabilities.medium > 0 && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              )}
              {project.vulnerabilities.low > 0 && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-brand-gray mb-1">Coverage</div>
          <div className="text-lg font-semibold text-brand-black">
            {project.coverage}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div
              className="bg-accent h-1 rounded-full"
              style={{ width: `${project.coverage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-brand-gray">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Last scan: {project.lastScan}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Activity className="w-3 h-3" />
          <span>{project.scanDuration}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200/50">
        <Button size="sm" variant="outline" className="flex-1">
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
        <Button size="sm" className="flex-1">
          <Play className="w-4 h-4 mr-2" />
          Run Scan
        </Button>
      </div>
    </div>
  );
};

const Projects = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const mockProjects: Project[] = [
    {
      id: 1,
      name: "E-commerce Platform",
      description: "Modern e-commerce platform built with React and Node.js",
      owner: "acme-corp",
      repository: "ecommerce-platform",
      source: "github",
      status: "active",
      lastScan: "2 hours ago",
      vulnerabilities: { critical: 2, high: 5, medium: 8, low: 12 },
      coverage: 87,
      isStarred: true,
      branch: "main",
      scanDuration: "5m 32s",
    },
    {
      id: 2,
      name: "Mobile Banking App",
      description:
        "Secure mobile banking application with advanced security features",
      owner: "fintech-solutions",
      repository: "mobile-banking",
      source: "gitlab",
      status: "scanning",
      lastScan: "1 hour ago",
      vulnerabilities: { critical: 0, high: 2, medium: 4, low: 6 },
      coverage: 94,
      isStarred: false,
      branch: "develop",
      scanDuration: "3m 45s",
    },
    {
      id: 3,
      name: "Admin Dashboard",
      description:
        "Internal admin dashboard for managing user accounts and analytics",
      owner: "internal-tools",
      repository: "admin-dashboard",
      source: "github",
      status: "completed",
      lastScan: "6 hours ago",
      vulnerabilities: { critical: 1, high: 3, medium: 2, low: 1 },
      coverage: 76,
      isStarred: false,
      branch: "main",
      scanDuration: "2m 18s",
    },
    {
      id: 4,
      name: "API Gateway",
      description:
        "Microservices API gateway with authentication and rate limiting",
      owner: "backend-team",
      repository: "api-gateway",
      source: "docker",
      status: "failed",
      lastScan: "12 hours ago",
      vulnerabilities: { critical: 5, high: 8, medium: 12, low: 15 },
      coverage: 45,
      isStarred: true,
      branch: "production",
      scanDuration: "8m 12s",
    },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setProjects(mockProjects);
      setFilteredProjects(mockProjects);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = projects;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          project.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    // Filter by source
    if (sourceFilter !== "all") {
      filtered = filtered.filter((project) => project.source === sourceFilter);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, sourceFilter, projects]);

  const handleImportRepositories = async (repoIds: number[]) => {
    try {
      const token = localStorage.getItem("access_token");

      for (const repoId of repoIds) {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:8000"
          }/api/v1/repositories/import`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              github_id: repoId,
              source: "github",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to import repository ${repoId}`);
        }
      }

      // Refresh projects list after import
      // In a real app, you'd fetch the updated projects from the API
      console.log("Successfully imported repositories:", repoIds);
    } catch (error) {
      console.error("Error importing repositories:", error);
      throw error;
    }
  };

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    scanning: projects.filter((p) => p.status === "scanning").length,
    failed: projects.filter((p) => p.status === "failed").length,
  };

  return (
    <div className="w-full h-screen font-sans relative flex overflow-hidden">
      <EtherealBackground
        color="rgba(255, 255, 255, 0.6)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 0.8, scale: 1.2 }}
        sizing="fill"
      />

      <ResponsiveSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm mb-4">
              <span className="font-medium text-white">SecureThread</span>
              <ChevronRight size={16} className="text-gray-300" />
              <span className="font-medium text-white">Projects</span>
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                  Projects
                </h1>
                <p className="text-white/80">
                  Manage and monitor your security projects
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <Button
                  onClick={() => setShowImportModal(true)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Github className="w-4 h-4 mr-2" />
                  Import Repositories
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="text-2xl font-bold text-brand-black">
                  {stats.total}
                </div>
                <div className="text-sm text-brand-gray font-medium">
                  Total Projects
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
                <div className="text-sm text-brand-gray font-medium">
                  Active
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.scanning}
                </div>
                <div className="text-sm text-brand-gray font-medium">
                  Scanning
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="text-2xl font-bold text-red-600">
                  {stats.failed}
                </div>
                <div className="text-sm text-brand-gray font-medium">
                  Failed
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scanning">Scanning</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="docker">Docker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Projects Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-white">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-lg">
                  <IconFolder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-brand-black mb-2">
                    {projects.length === 0
                      ? "No Projects Yet"
                      : "No Projects Found"}
                  </h3>
                  <p className="text-brand-gray mb-6">
                    {projects.length === 0
                      ? "Get started by importing your first repository from GitHub."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                  {projects.length === 0 && (
                    <Button
                      onClick={() => setShowImportModal(true)}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      Import from GitHub
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <ImportRepositoriesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportRepositories}
      />
    </div>
  );
};

export default Projects;
