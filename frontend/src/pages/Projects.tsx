import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppSidebar from "../components/AppSidebar";
import RepositoryDetails from "../components/RepositoryDetails";
import ScanDetailsModal from "../components/SimpleScanDetailsModal";
import ScanMethodModal from "../components/ScanMethodModal"; 
import { useAuth } from "../contexts/AuthContext"; // Keep this
import FileScanStatus from "../components/FileScanStatus"; // New component
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
import {
  IconBrandGithub,
  IconBrandGitlab, 
  IconBrandDocker,
  IconFolder,
} from "@tabler/icons-react";
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
  Github,
  FileText,
  StopCircle,
} from "lucide-react";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Trash2, RefreshCw } from "lucide-react";

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
  owner: string;
  repository: string;
  source: "github" | "gitlab" | "bitbucket"; 
  status: "active" | "scanning" | "failed" | "completed" | "pending";
  lastScan: string | null;
  vulnerabilities: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } | null;
  coverage: number | null;
  isStarred: boolean;
  branch: string;
  scanDuration: string | null;
  created_at: string;
  updated_at: string;
  latest_scan?: {
    id: number;
    status: string;
    started_at: string;
    completed_at?: string;
    scan_duration?: string;
  } | null;
  security_score?: number | null;
  code_coverage?: number | null;
}






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
      setSelectedRepos([]);
      fetchAvailableRepositories();
    }
  }, [isOpen]);

  const fetchAvailableRepositories = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");
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

      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      } else {
        const errorData = await response.text();
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
    setSelectedRepos((prev) => {
      const newSelection = prev.includes(repoId)
        ? prev.filter((id) => id !== repoId)
        : [...prev, repoId];
      return newSelection;
    });
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
                    {filteredRepos.map((repo, index) => (
                      <div
                        key={`repo-${repo.github_id}-${index}`}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex items-center mt-1">
                            <input
                              type="checkbox"
                              id={`repo-checkbox-${repo.id}`}
                              checked={selectedRepos.includes(repo.id)}
                              onChange={(e) => {
                                const repoId = repo.id;
                                const isChecked = e.target.checked;

                                setSelectedRepos((prevSelected) => {
                                  let newSelected;
                                  if (isChecked) {
                                    newSelected = prevSelected.includes(repoId)
                                      ? prevSelected
                                      : [...prevSelected, repoId];
                                  } else {
                                    newSelected = prevSelected.filter(
                                      (id) => id !== repoId
                                    );
                                  }
                                  return newSelected;
                                });
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                          </div>
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



const ImportBitbucketRepositoriesModal = ({
  isOpen,
  onClose,
  onImport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (repoIds: string[]) => void;
}) => {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedRepos([]);
      fetchAvailableBitbucketRepositories();
    }
  }, [isOpen]);

  const fetchAvailableBitbucketRepositories = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/repositories/bitbucket/available`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      } else {
        const errorData = await response.text();
        setError(
          `Failed to fetch repositories: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error fetching Bitbucket repositories:", error);
      setError("Network error occurred while fetching repositories");
    } finally {
      setLoading(false);
    }
  };

  const handleRepoToggle = (repoId: string) => {
    setSelectedRepos((prev) => {
      const newSelection = prev.includes(repoId)
        ? prev.filter((id) => id !== repoId)
        : [...prev, repoId];
      return newSelection;
    });
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
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
            </svg>
            <span>Import Bitbucket Repositories</span>
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
                <Button onClick={fetchAvailableBitbucketRepositories} variant="outline">
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
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
                    </svg>
                    <p className="text-brand-gray">
                      {repositories.filter((r) => !r.is_imported).length === 0
                        ? "All your repositories have been imported!"
                        : "No repositories found matching your search."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredRepos.map((repo, index) => (
                      <div
                        key={`bitbucket-repo-${repo.id}-${index}`}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex items-center mt-1">
                            <input
                              type="checkbox"
                              id={`bitbucket-repo-checkbox-${repo.id}`}
                              checked={selectedRepos.includes(repo.id)}
                              onChange={(e) => handleRepoToggle(repo.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                          </div>
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
                                {new Date(repo.updated_at || "").toLocaleDateString()}
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
                        selectedRepos.length === 1 ? "Repository" : "Repositories"
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

const ProjectCard = ({
  project,
  onDelete,
  onSync,
  onViewDetails,
  onStartScan,
  onStopScan,
  onViewFileScanStatus,
  onViewScanDetails,
}: {
  project: Project;
  onDelete: (projectId: number) => void;
  onSync: (projectId: number) => void;
  onViewDetails: (project: Project) => void;
  onStartScan: (projectId: number) => void;
  onStopScan: (projectId: number) => void;
  onViewFileScanStatus: (project: Project) => void;
  onViewScanDetails: (project: Project) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "scanning":
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return "bg-green-100 text-green-800";
      case "scanning":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
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
    case "bitbucket":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
        </svg>
      );
    case "docker":
      return <IconBrandDocker className="w-4 h-4" />;
    default:
      return <IconFolder className="w-4 h-4" />;
  }
};

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(project.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(project.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalVulnerabilities = project.vulnerabilities
    ? project.vulnerabilities.critical +
      project.vulnerabilities.high +
      project.vulnerabilities.medium +
      project.vulnerabilities.low
    : null;

  const hasScanned =
    project.vulnerabilities !== null && project.coverage !== null;
  const isScanning =
    project.latest_scan?.status === "running" ||
    project.latest_scan?.status === "pending";

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
            {getSourceIcon(project.source)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {project.name}
            </h3>
            <p className="text-sm text-white/70">{project.owner}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-white/70 hover:text-accent transition-colors">
            <Star
              className={`w-4 h-4 ${
                project.isStarred ? "fill-yellow-400 text-yellow-400" : ""
              }`}
            />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleSync}
                disabled={isSyncing}
                className="cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing ? "Syncing..." : "Sync Project"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Project"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <p className="text-sm text-white/70 mb-4 line-clamp-2">
        {project.description}
      </p>
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(project.status)}
          <Badge className={`text-xs ${getStatusColor(project.status)}`}>
            {project.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-2 text-sm text-white/70">
          <GitBranch className="w-4 h-4" />
          <span>{project.branch}</span>
        </div>
        {project.language && (
          <Badge
            variant="secondary"
            className="text-xs bg-blue-100 text-blue-800"
          >
            {project.language}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-white/70 mb-1">Vulnerabilities</div>
          {hasScanned ? (
            <>
              <div className="text-lg font-semibold text-white">
                {totalVulnerabilities}
              </div>
              {totalVulnerabilities && totalVulnerabilities > 0 && (
                <div className="flex space-x-1 mt-1">
                  {project.vulnerabilities!.critical > 0 && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                  {project.vulnerabilities!.high > 0 && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                  {project.vulnerabilities!.medium > 0 && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  )}
                  {project.vulnerabilities!.low > 0 && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-lg font-semibold text-white/40">N/A</div>
              <div className="text-xs text-white/50">Scan to get details</div>
            </>
          )}
        </div>
        <div>
          <div className="text-xs text-white/70 mb-1">Coverage</div>
          {hasScanned ? (
            <>
              <div className="text-lg font-semibold text-white">
                {project.coverage}%
              </div>
              <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                <div
                  className="bg-accent h-1 rounded-full"
                  style={{ width: `${project.coverage}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-semibold text-white/40">N/A</div>
              <div className="text-xs text-white/50">Scan to get details</div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-white/70 mb-4">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>
            {project.lastScan
              ? `Last scan: ${project.lastScan}`
              : "Never scanned"}
          </span>
        </div>
        {project.scanDuration && (
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>{project.scanDuration}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col space-y-2 pt-4 border-t border-white/20">
        {/* Top row - View Details always shown */}
        <Button
          size="sm"
          variant="outline"
          className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={() => onViewDetails(project)}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>

        {/* Show File Status button if scan is completed */}
        {project.latest_scan?.status === "completed" && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => onViewFileScanStatus(project)}
            >
              <FileText className="w-4 h-4 mr-1" />
              File Status
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => onViewScanDetails(project)}
            >
              <Activity className="w-4 h-4 mr-1" />
              Scan Report
            </Button>
          </div>
        )}

        {/* Show different buttons based on scan status */}
        {isScanning ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-red-400 hover:text-red-300 border-red-300 hover:border-red-400 bg-white/10 hover:bg-white/20"
            onClick={() => onStopScan(project.id)}
          >
            <StopCircle className="w-4 h-4 mr-2" />
            Stop Scan
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full bg-accent hover:bg-accent/90"
            onClick={() => onStartScan(project.id)}
            disabled={project.latest_scan?.status === "pending"}
          >
            <Play className="w-4 h-4 mr-2" />
            {project.latest_scan?.status === "pending"
              ? "Starting..."
              : "Run Scan"}
          </Button>
        )}
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
  const [importProvider, setImportProvider] = useState<'github' | 'bitbucket' | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [selectedRepoName, setSelectedRepoName] = useState("");
  const [showFileScanModal, setShowFileScanModal] = useState(false);
  const [error, setError] = useState("");
  const [showImportDropdown, setShowImportDropdown] = useState(false); 
  const [showScanMethodModal, setShowScanMethodModal] = useState(false);
  const [selectedProjectForScan, setSelectedProjectForScan] = useState<Project | null>(null);
  const [scanningProjects, setScanningProjects] = useState<Set<number>>(
    new Set()
  );
  const { user } = useAuth();
  const navigate = useNavigate();

  // Polling management
  const [pollIntervals, setPollIntervals] = useState<
    Map<number, NodeJS.Timeout>
  >(new Map());

  // Helper functions for dynamic provider detection
  const getAuthProvider = (): 'github' | 'bitbucket' | null => {
  console.log('=== DEBUG AUTH PROVIDER ===');
  console.log('User object:', user);
  console.log('user.github_username:', user?.github_username);
  console.log('user.bitbucket_username:', user?.bitbucket_username);
  
  if (!user) {
    console.log('No user - returning null');
    return null;
  }
  if (user.github_username) {
    console.log('Found GitHub username - returning github');
    return 'github';
  }
  if (user.bitbucket_username) {
    console.log('Found Bitbucket username - returning bitbucket');
    return 'bitbucket';
  }
  console.log('No provider found - returning null');
  return null;
};

  

  const getProviderIcon = (provider: 'github' | 'bitbucket' | null) => {
    switch (provider) {
      case 'github':
        return <Github className="w-4 h-4 mr-2" />;
      case 'bitbucket':
        return (
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
          </svg>
        );
      default:
        return <Github className="w-4 h-4 mr-2" />;
    }
  };

  const getProviderName = (provider: 'github' | 'bitbucket' | null) => {
    switch (provider) {
      case 'github': return 'GitHub';
      case 'bitbucket': return 'Bitbucket';
      default: return 'GitHub';
    }
  };

  const handleImportClick = () => {
  console.log('=== IMPORT CLICK ===');
  
  // If user has a specific provider account, use it directly
  const provider = getAuthProvider();
  if (provider) {
    console.log('Detected provider:', provider);
    setImportProvider(provider);
  } else {
    // If Google login (no specific provider), show dropdown
    setShowImportDropdown(true);
  }
};

const handleProviderSelection = (provider: 'github' | 'bitbucket') => {
  console.log('Selected provider:', provider);
  setShowImportDropdown(false);
  setImportProvider(provider);
};



  useEffect(() => {
    fetchProjects();

    // Cleanup function to clear all polling intervals
    return () => {
      pollIntervals.forEach((interval) => clearInterval(interval));
    };
  }, []);

  

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/repositories/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const repositories = data.repositories || [];

        const transformedProjects: Project[] = repositories.map(
          (repo: any) => ({
            id: repo.id,
            github_id: repo.github_id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || "No description available",
            html_url: repo.html_url,
            clone_url: repo.clone_url,
            default_branch: repo.default_branch || "main",
            language: repo.language,
            is_private: repo.is_private,
            is_fork: repo.is_fork,
            owner: repo.full_name.split("/")[0],
            repository: repo.name,
            source: repo.source || "github" as const,
            status:
              repo.latest_scan?.status === "running"
                ? ("scanning" as const)
                : repo.latest_scan?.status === "completed"
                ? ("completed" as const)
                : repo.latest_scan?.status === "failed"
                ? ("failed" as const)
                : ("pending" as const),
            lastScan: repo.latest_scan?.completed_at
              ? new Date(repo.latest_scan.completed_at).toLocaleDateString()
              : null,
            vulnerabilities: repo.vulnerabilities
              ? {
                  total: repo.vulnerabilities.total,
                  critical: repo.vulnerabilities.critical,
                  high: repo.vulnerabilities.high,
                  medium: repo.vulnerabilities.medium,
                  low: repo.vulnerabilities.low,
                }
              : null,
            coverage: repo.code_coverage,
            isStarred: false,
            branch: repo.default_branch || "main",
            scanDuration: repo.latest_scan?.scan_duration,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            latest_scan: repo.latest_scan,
            security_score: repo.security_score,
            code_coverage: repo.code_coverage,
          })
        );

        setProjects(transformedProjects);
        setFilteredProjects(transformedProjects);

        // Start polling for any projects that are currently scanning
        transformedProjects.forEach((project) => {
          if (
            project.latest_scan?.status === "running" ||
            project.latest_scan?.status === "pending"
          ) {
            startScanPolling(project.latest_scan.id, project.id);
          }
        });
      } else {
        setError("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Network error occurred while fetching projects");
    } finally {
      setLoading(false);
    }
  };

  const clearScanPolling = useCallback(
    (scanId: number) => {
      const interval = pollIntervals.get(scanId);
      if (interval) {
        clearInterval(interval);
        setPollIntervals((prev) => {
          const newMap = new Map(prev);
          newMap.delete(scanId);
          return newMap;
        });
      }
    },
    [pollIntervals]
  );

  const startScanPolling = useCallback(
    (scanId: number, projectId: number) => {
      // Clear any existing polling for this scan
      clearScanPolling(scanId);

      const pollInterval = setInterval(async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(
            `${
              import.meta.env.VITE_API_URL || "http://localhost:8000"
            }/api/v1/scans/${scanId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const scanData = await response.json();

            setProjects((prevProjects) =>
              prevProjects.map((project) =>
                project.id === projectId
                  ? {
                      ...project,
                      latest_scan: {
                        id: scanData.id,
                        status: scanData.status,
                        started_at: scanData.started_at,
                        completed_at: scanData.completed_at,
                        scan_duration: scanData.scan_duration,
                      },
                      status:
                        scanData.status === "completed"
                          ? ("completed" as const)
                          : scanData.status === "failed"
                          ? ("failed" as const)
                          : ("scanning" as const),
                      vulnerabilities:
                        scanData.total_vulnerabilities !== undefined
                          ? {
                              total: scanData.total_vulnerabilities,
                              critical: scanData.critical_count,
                              high: scanData.high_count,
                              medium: scanData.medium_count,
                              low: scanData.low_count,
                            }
                          : project.vulnerabilities,
                      security_score: scanData.security_score,
                      code_coverage: scanData.code_coverage,
                      coverage: scanData.code_coverage,
                      scanDuration: scanData.scan_duration,
                      lastScan: scanData.completed_at
                        ? new Date(scanData.completed_at).toLocaleDateString()
                        : null,
                    }
                  : project
              )
            );

            // Stop polling if scan is completed, failed, or stopped
            if (["completed", "failed", "stopped"].includes(scanData.status)) {
              clearScanPolling(scanId);
              setScanningProjects((prev) => {
                const newSet = new Set(prev);
                newSet.delete(projectId);
                return newSet;
              });
            }
          } else {
            console.error("Failed to fetch scan status:", response.status);
            // Stop polling on error
            clearScanPolling(scanId);
            setScanningProjects((prev) => {
              const newSet = new Set(prev);
              newSet.delete(projectId);
              return newSet;
            });
          }
        } catch (error) {
          console.error("Error polling scan status:", error);
          // Stop polling on error
          clearScanPolling(scanId);
          setScanningProjects((prev) => {
            const newSet = new Set(prev);
            newSet.delete(projectId);
            return newSet;
          });
        }
      }, 5000); // Poll every 5 seconds

      // Store the interval
      setPollIntervals((prev) => new Map(prev).set(scanId, pollInterval));

      // Auto-stop polling after 30 minutes to prevent infinite polling
      setTimeout(() => {
        clearScanPolling(scanId);
        setScanningProjects((prev) => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      }, 30 * 60 * 1000);
    },
    [clearScanPolling]
  );

  const handleStartScan = async (projectId: number) => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;
  
  setSelectedProjectForScan(project);
  setShowScanMethodModal(true);
};

const handleGenAIScan = async () => {
  if (!selectedProjectForScan) return;
  
  setShowScanMethodModal(false);
  
  const projectId = selectedProjectForScan.id;
  
  if (scanningProjects.has(projectId)) {
    console.log("Scan already in progress for project", projectId);
    return;
  }

  try {
    setScanningProjects((prev) => new Set(prev).add(projectId));

    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      }/api/v1/scans/start`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repository_id: projectId,
          scan_config: {
            max_files: 10,
            max_vulnerabilities: 5,
            priority_scan: true,
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Scan started:", data);

      // Update the project status immediately
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                latest_scan: {
                  id: data.id,
                  status: "pending",
                  started_at: data.started_at,
                },
                status: "scanning" as const,
              }
            : project
        )
      );

      // Start polling for scan status
      startScanPolling(data.id, projectId);
    } else {
      const errorData = await response.json();
      console.error("Failed to start scan:", errorData);
      setError(errorData.detail || "Failed to start scan");
      setScanningProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  } catch (error) {
    console.error("Error starting scan:", error);
    setError("Network error occurred while starting scan");
    setScanningProjects((prev) => {
      const newSet = new Set(prev);
      newSet.delete(projectId);
      return newSet;
    });
  } finally {
    setSelectedProjectForScan(null);
  }
};


const handleStopScan = async (projectId: number) => {
  try {
    const project = projects.find((p) => p.id === projectId);
    if (!project?.latest_scan?.id) return;

    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      }/api/v1/scans/${project.latest_scan.id}/stop`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      // Stop polling
      clearScanPolling(project.latest_scan.id);
      setScanningProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });

      // Update project status
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                status: "failed" as const,
                latest_scan: {
                  ...p.latest_scan!,
                  status: "stopped",
                },
              }
            : p
        )
      );
    } else {
      console.error("Failed to stop scan");
    }
  } catch (error) {
    console.error("Error stopping scan:", error);
  }
};

// Update your handleCustomScan function:
const handleCustomScan = async (selectedRules: number[], customRules?: any[]) => {
  if (!selectedProjectForScan) {
    console.error("No project selected for scan");
    return;
  }

  const projectId = selectedProjectForScan.id;
  setShowScanMethodModal(false);
  
  // Temporarily use the regular scan endpoint for testing
  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/scans/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repository_id: projectId,
        scan_config: {
          max_files: 10,
          max_vulnerabilities: 5,
          priority_scan: true,
          scan_type: "custom_rules", // Add this to distinguish
          selected_rules: selectedRules,
          custom_rules: customRules
        }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Custom scan started:", data);
      await fetchProjects();
    } else {
      const errorData = await response.json();
      console.error("Custom scan failed:", errorData);
      setError(typeof errorData.detail === 'string' ? errorData.detail : 'Failed to start custom scan');
    }
  } catch (error) {
    console.error("Custom scan failed:", error);
    setError("Network error occurred while starting custom scan");
  } finally {
    setSelectedProjectForScan(null);
  }
};

  const handleDeleteProject = async (projectId: number) => {
    try {
      // Stop any ongoing scan polling
      const project = projects.find((p) => p.id === projectId);
      if (project?.latest_scan?.id) {
        clearScanPolling(project.latest_scan.id);
      }
      setScanningProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/repositories/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.filter((project) => project.id !== projectId)
        );
      } else {
        console.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleViewScanDetails = (project: Project) => {
    if (project.latest_scan && project.latest_scan.status === "completed") {
      setSelectedScanId(project.latest_scan.id);
      setSelectedRepoName(project.name);
      setShowScanModal(true);
    }
  };

  const handleViewFileScanStatus = (project: Project) => {
    if (project.latest_scan && project.latest_scan.status === "completed") {
      setSelectedScanId(project.latest_scan.id);
      setSelectedRepoName(project.name);
      setShowFileScanModal(true);
    }
  };

  const handleSyncProject = async (projectId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/repositories/${projectId}/sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedRepo = await response.json();
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  description:
                    updatedRepo.repository?.description || p.description,
                  default_branch:
                    updatedRepo.repository?.default_branch || p.default_branch,
                  language: updatedRepo.repository?.language || p.language,
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        );
      } else {
        console.error("Failed to sync project");
      }
    } catch (error) {
      console.error("Error syncing project:", error);
    }
  };

  const handleViewDetails = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  // Filter projects effect
  useEffect(() => {
    let filtered = projects;

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

    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((project) => project.source === sourceFilter);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, sourceFilter, projects]);
  
  // Add this useEffect after your other useEffects
  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (showImportDropdown) {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setShowImportDropdown(false);
      }
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showImportDropdown]);
  const handleImportRepositories = async (repoIds: number[]) => {
    try {
      const token = localStorage.getItem("access_token");
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
            repository_ids: repoIds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Import error:", errorData);
        throw new Error(`Failed to import repositories: ${response.status}`);
      }

      const result = await response.json();
      console.log("Import successful:", result);
      await fetchProjects();
    } catch (error) {
      console.error("Error importing repositories:", error);
      throw error;
    }
  };

  const handleImportBitbucketRepositories = async (repoIds: string[]) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/repositories/bitbucket/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repository_ids: repoIds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Import error:", errorData);
        throw new Error(`Failed to import repositories: ${response.status}`);
      }

      const result = await response.json();
      console.log("Import successful:", result);
      await fetchProjects();
    } catch (error) {
      console.error("Error importing repositories:", error);
      throw error;
    }
  };

  const stats = {
    total: projects.length,
    active: projects.filter(
      (p) => p.status === "active" || p.status === "completed"
    ).length,
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

    <AppSidebar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />

    <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Single unified container */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            
            {/* Header Section */}
            <div className="p-8 border-b border-white/10">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-sm mb-4">
                <span className="font-medium text-white">SecureThread</span>
                <ChevronRight size={16} className="text-white/60" />
                <span className="font-medium text-white">Projects</span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                    Projects
                  </h1>
                  <p className="text-white/80">
                    Manage and monitor your security projects
                  </p>
                </div>
                <div className="mt-6 lg:mt-0 relative">
                  <Button
                    onClick={handleImportClick}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {getAuthProvider() ? (
                      <>
                        {getProviderIcon(getAuthProvider())}
                        Import from {getProviderName(getAuthProvider())}
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4 mr-2" />
                        Import Repository
                      </>
                    )}
                  </Button>
                  
                  {/* Import Provider Dropdown */}
                  {showImportDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => handleProviderSelection('github')}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        <span>Import from GitHub</span>
                      </button>
                      <button
                        onClick={() => handleProviderSelection('bitbucket')}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
                        </svg>
                        <span>Import from Bitbucket</span>
                      </button>
                    </div>
                  )}
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
                    Total Projects
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
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {stats.scanning}
                  </div>
                  <div className="text-white/70 font-medium">
                    Scanning
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {stats.failed}
                  </div>
                  <div className="text-white/70 font-medium">
                    Failed
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
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scanning">Scanning</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full lg:w-48 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="bitbucket">Bitbucket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Projects Content Section */}
            <div className="p-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                  <p className="text-white">Loading projects...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Error Loading Projects
                  </h3>
                  <p className="text-red-400 mb-6">{error}</p>
                  <Button
                    onClick={fetchProjects}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Try Again
                  </Button>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <IconFolder className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {projects.length === 0
                      ? "No Projects Yet"
                      : "No Projects Found"}
                  </h3>
                  <p className="text-white/70 mb-6">
                    {projects.length === 0
                      ? "Get started by importing your first repository."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                  {projects.length === 0 && (
                    <Button
                      onClick={handleImportClick}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      Import Repository
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={handleDeleteProject}
                      onSync={handleSyncProject}
                      onViewDetails={handleViewDetails}
                      onStartScan={handleStartScan}
                      onStopScan={handleStopScan}
                      onViewFileScanStatus={handleViewFileScanStatus}
                      onViewScanDetails={handleViewScanDetails}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>

    {/* Dynamic Import Modals */}
    {importProvider === 'github' && (
      <ImportRepositoriesModal
        isOpen={true}
        onClose={() => setImportProvider(null)}
        onImport={handleImportRepositories}
      />
    )}

    {importProvider === 'bitbucket' && (
      <ImportBitbucketRepositoriesModal
        isOpen={true}
        onClose={() => setImportProvider(null)}
        onImport={handleImportBitbucketRepositories}
      />
    )}

    {/* Scan Details Modal */}
    <ScanDetailsModal
      isOpen={showScanModal}
      onClose={() => setShowScanModal(false)}
      scanId={selectedScanId}
      repositoryName={selectedRepoName}
    />

    {/* File Scan Status Modal */}
    <FileScanStatus
      isOpen={showFileScanModal}
      onClose={() => setShowFileScanModal(false)}
      scanId={selectedScanId}
      repositoryName={selectedRepoName}
    />

    {/* Scan Method Modal */}
<ScanMethodModal
  isOpen={showScanMethodModal}
  onClose={() => {
    setShowScanMethodModal(false);
    setSelectedProjectForScan(null);
  }}
  onSelectGenAI={handleGenAIScan}
  onSelectCustom={handleCustomScan}
  projectName={selectedProjectForScan?.name}
/>

  </div>
);
};

export default Projects;