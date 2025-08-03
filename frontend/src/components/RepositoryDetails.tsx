import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EtherealBackground } from "../components/ui/ethereal-background";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Download,
  ExternalLink,
  GitBranch,
  Calendar,
  User,
  Star,
  Eye,
  GitFork,
  Code,
  FileText,
  Image as ImageIcon,
  Archive,
  Settings,
  RefreshCw,
  Copy,
  Check,
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
  IconLogout,
} from "@tabler/icons-react";
import ScanDetailsModal from "./ScanDetailsModal";

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
  source: "github" | "gitlab" | "docker";
  status: "active" | "scanning" | "failed" | "completed" | "pending";
  lastScan: string | null;
  vulnerabilities: {
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
}

interface FileContent {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  download_url?: string;
}

interface CodeViewerProps {
  fileName: string;
  content: string;
  language: string;
  onClose: () => void;
}

const CodeViewer: React.FC<CodeViewerProps> = ({
  fileName,
  content,
  language,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy content:", error);
    }
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: "bg-yellow-100 text-yellow-800",
      typescript: "bg-blue-100 text-blue-800",
      python: "bg-green-100 text-green-800",
      java: "bg-red-100 text-red-800",
      cpp: "bg-purple-100 text-purple-800",
      c: "bg-gray-100 text-gray-800",
      go: "bg-cyan-100 text-cyan-800",
      rust: "bg-orange-100 text-orange-800",
      php: "bg-indigo-100 text-indigo-800",
      ruby: "bg-red-100 text-red-800",
      swift: "bg-orange-100 text-orange-800",
      kotlin: "bg-purple-100 text-purple-800",
      html: "bg-orange-100 text-orange-800",
      css: "bg-blue-100 text-blue-800",
      json: "bg-gray-100 text-gray-800",
      yaml: "bg-purple-100 text-purple-800",
      markdown: "bg-gray-100 text-gray-800",
      default: "bg-gray-100 text-gray-800",
    };
    return colors[lang.toLowerCase()] || colors.default;
  };

  const lines = content.split("\n");

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="w-5 h-5 text-accent" />
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {fileName}
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`text-xs ${getLanguageColor(language)}`}>
                    {language || "text"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {lines.length} lines
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Code Area */}
        <div className="flex-1 min-h-0 relative">
          <div
            className="absolute inset-0 bg-gray-50 overflow-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E1 #F1F5F9",
            }}
          >
            <div className="flex">
              {/* Line Numbers */}
              <div className="bg-gray-100 border-r border-gray-300 px-4 py-4 text-right select-none flex-shrink-0">
                <div className="font-mono text-sm text-gray-500 leading-6">
                  {lines.map((_, index) => (
                    <div
                      key={index + 1}
                      style={{ height: "24px", lineHeight: "24px" }}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Content */}
              <div className="flex-1 px-4 py-4">
                <pre className="font-mono text-sm leading-6 text-gray-800">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      style={{ height: "24px", lineHeight: "24px" }}
                    >
                      {line || " "}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

interface RepositoryDetailsProps {
  project: Project;
  onBack: () => void;
}

const RepositoryDetails: React.FC<RepositoryDetailsProps> = ({
  project,
  onBack,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contents, setContents] = useState<FileContent[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [fileStatuses, setFileStatuses] = useState<{ [key: string]: any }>({});
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    content: string;
    language: string;
  } | null>(null);

  useEffect(() => {
    fetchContents(currentPath);
  }, [currentPath]);

  const fetchContents = async (path: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/repositories/${project.id}/content?path=${encodeURIComponent(
          path
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContents(data.content || []);
      } else {
        setError("Failed to fetch repository contents");
      }
    } catch (error) {
      console.error("Error fetching contents:", error);
      setError("Network error occurred while fetching contents");
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (filePath: string, fileName: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/repositories/${project.id}/file?file_path=${encodeURIComponent(
          filePath
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const extension = fileName.split(".").pop()?.toLowerCase() || "";
        const language = getLanguageFromExtension(extension);
        setSelectedFile({
          name: fileName,
          content: data.content,
          language,
        });
      } else {
        console.error("Failed to fetch file content:", response.status);
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  useEffect(() => {
    if (project.latest_scan?.status === "completed") {
      fetchVulnerabilities();
      if (project.latest_scan?.id) {
        fetchFileScanStatuses(project.latest_scan.id);
      }
    }
  }, [project.latest_scan]);

  const fetchVulnerabilities = async () => {
    if (!project.latest_scan?.id) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/scans/${project.latest_scan.id}/vulnerabilities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVulnerabilities(data);
      }
    } catch (error) {
      console.error("Error fetching vulnerabilities:", error);
    }
  };

  const fetchFileScanStatuses = async (scanId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/scans/${scanId}/file-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const statusMap: { [key: string]: any } = {};

        data.file_results.forEach((file: any) => {
          statusMap[file.file_path] = {
            status: file.status,
            reason: file.reason,
            vulnerabilities: file.vulnerabilities || [],
          };
        });

        setFileStatuses(statusMap);
      }
    } catch (error) {
      console.error("Error fetching file scan statuses:", error);
    }
  };

  const getVulnerabilityForFile = (filePath: string) => {
    return vulnerabilities.filter((vuln) => vuln.file_path === filePath);
  };

  const hasVulnerabilities = (filePath: string) => {
    return getVulnerabilityForFile(filePath).length > 0;
  };

  const getHighestSeverityForFile = (filePath: string) => {
    const fileVulns = getVulnerabilityForFile(filePath);
    if (fileVulns.length === 0) return null;

    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const highest = fileVulns.reduce((max, vuln) =>
      severityOrder[vuln.severity] > severityOrder[max.severity] ? vuln : max
    );
    return highest.severity;
  };

  const getLanguageFromExtension = (extension: string): string => {
    const extensionMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rs: "rust",
      php: "php",
      rb: "ruby",
      swift: "swift",
      kt: "kotlin",
      html: "html",
      css: "css",
      json: "json",
      yml: "yaml",
      yaml: "yaml",
      md: "markdown",
      xml: "xml",
      sql: "sql",
      sh: "bash",
      dockerfile: "dockerfile",
    };
    return extensionMap[extension] || "text";
  };

  const handleFolderClick = (folderPath: string) => {
    setCurrentPath(folderPath);
    setPathHistory([...pathHistory, folderPath]);
  };

  const handleFileClick = (file: FileContent) => {
    if (isViewableFile(file.name)) {
      fetchFileContent(file.path, file.name);
    }
  };

  const isViewableFile = (fileName: string): boolean => {
    const viewableExtensions = [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "go",
      "rs",
      "php",
      "rb",
      "swift",
      "kt",
      "html",
      "css",
      "json",
      "yml",
      "yaml",
      "md",
      "txt",
      "xml",
      "sql",
      "sh",
      "dockerfile",
      "gitignore",
      "env",
      "config",
    ];
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    return (
      viewableExtensions.includes(extension) ||
      fileName.toLowerCase().includes("readme")
    );
  };

  const getFileIcon = (
    fileName: string,
    type: string,
    filePath: string = ""
  ) => {
    const baseIcon = getBaseFileIcon(fileName, type);

    if (type === "file") {
      const fileStatus = fileStatuses[filePath];

      if (fileStatus) {
        switch (fileStatus.status) {
          case "vulnerable":
            return (
              <div className="relative">
                {baseIcon}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
            );
          case "scanned":
            return (
              <div className="relative">
                {baseIcon}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
            );
          case "skipped":
            return (
              <div className="relative">
                {baseIcon}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="text-white text-xs">-</span>
                </div>
              </div>
            );
          case "error":
            return (
              <div className="relative">
                {baseIcon}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white text-xs">×</span>
                </div>
              </div>
            );
        }
      }

      // Show old vulnerability indicator for backward compatibility
      if (hasVulnerabilities(filePath)) {
        const severity = getHighestSeverityForFile(filePath);
        const severityColors = {
          critical: "text-red-600",
          high: "text-orange-600",
          medium: "text-yellow-600",
          low: "text-gray-600",
        };

        return (
          <div className="relative">
            {baseIcon}
            <div
              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${severityColors[severity]} bg-current`}
            ></div>
          </div>
        );
      }
    }

    return baseIcon;
  };

  const getBaseFileIcon = (fileName: string, type: string) => {
    if (type === "dir") {
      return <Folder className="w-5 h-5 text-blue-500" />;
    }

    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    const iconMap: Record<string, JSX.Element> = {
      js: <File className="w-5 h-5 text-yellow-500" />,
      jsx: <File className="w-5 h-5 text-yellow-500" />,
      ts: <File className="w-5 h-5 text-blue-500" />,
      tsx: <File className="w-5 h-5 text-blue-500" />,
      py: <File className="w-5 h-5 text-green-500" />,
      java: <File className="w-5 h-5 text-red-500" />,
      html: <File className="w-5 h-5 text-orange-500" />,
      css: <File className="w-5 h-5 text-blue-500" />,
      json: <File className="w-5 h-5 text-gray-500" />,
      md: <FileText className="w-5 h-5 text-gray-600" />,
      yml: <File className="w-5 h-5 text-purple-500" />,
      yaml: <File className="w-5 h-5 text-purple-500" />,
      png: <ImageIcon className="w-5 h-5 text-green-500" />,
      jpg: <ImageIcon className="w-5 h-5 text-green-500" />,
      jpeg: <ImageIcon className="w-5 h-5 text-green-500" />,
      gif: <ImageIcon className="w-5 h-5 text-green-500" />,
      svg: <ImageIcon className="w-5 h-5 text-green-500" />,
      zip: <Archive className="w-5 h-5 text-gray-500" />,
      tar: <Archive className="w-5 h-5 text-gray-500" />,
      gz: <Archive className="w-5 h-5 text-gray-500" />,
    };

    return iconMap[extension] || <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getBreadcrumbPath = () => {
    if (!currentPath) return ["Root"];
    return ["Root", ...currentPath.split("/").filter(Boolean)];
  };

  const navigateToPath = (index: number) => {
    const newPath = index === 0 ? "" : pathHistory[index];
    setCurrentPath(newPath);
    setPathHistory(pathHistory.slice(0, index + 1));
  };

  const filteredContents = contents.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort contents: directories first, then files
  const sortedContents = [...filteredContents].sort((a, b) => {
    if (a.type === "dir" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "dir") return 1;
    return a.name.localeCompare(b.name);
  });

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
            {/* Header */}
            <div className="flex items-center space-x-2 text-sm mb-4">
              <span className="font-medium text-white">SecureThread</span>
              <ChevronRight size={16} className="text-gray-300" />
              <button
                onClick={onBack}
                className="font-medium text-white hover:text-accent transition-colors"
              >
                Projects
              </button>
              <ChevronRight size={16} className="text-gray-300" />
              <span className="font-medium text-white">{project.name}</span>
            </div>

            {/* Project Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Projects</span>
                  </Button>
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <IconBrandGithub className="w-6 h-6 text-gray-600" />
                      <h1 className="text-2xl font-bold text-brand-black">
                        {project.full_name}
                      </h1>
                      {project.is_private && (
                        <Badge variant="secondary">Private</Badge>
                      )}
                      {project.is_fork && <Badge variant="outline">Fork</Badge>}
                    </div>
                    <p className="text-brand-gray">{project.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {project.latest_scan?.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedScanId(project.latest_scan!.id);
                        setShowScanModal(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Scan Report
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.html_url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on GitHub
                  </Button>
                </div>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-brand-black">
                    {project.language || "N/A"}
                  </div>
                  <div className="text-sm text-brand-gray">
                    Primary Language
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-brand-black">
                    {project.default_branch}
                  </div>
                  <div className="text-sm text-brand-gray">Default Branch</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-brand-black">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-brand-gray">Last Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-brand-black capitalize">
                    {project.status}
                  </div>
                  <div className="text-sm text-brand-gray">Scan Status</div>
                </div>
              </div>
            </div>

            {/* File Browser */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
              {/* Browser Header */}
              <div className="p-4 border-b border-gray-200/50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold text-brand-black">
                      Repository Files
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchContents(currentPath)}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>

                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 mt-4">
                  {getBreadcrumbPath().map((segment, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <button
                        onClick={() => navigateToPath(index)}
                        className="text-sm text-brand-gray hover:text-brand-black transition-colors"
                      >
                        {segment}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* File List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-brand-gray">Loading files...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <File className="w-12 h-12 text-red-300 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button
                      onClick={() => fetchContents(currentPath)}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : sortedContents.length === 0 ? (
                  <div className="p-8 text-center">
                    <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-brand-gray">
                      {searchTerm
                        ? "No files match your search."
                        : "This directory is empty."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {sortedContents.map((item, index) => (
                      <div
                        key={`${item.path}-${index}`}
                        onClick={() => {
                          if (item.type === "dir") {
                            handleFolderClick(item.path);
                          } else {
                            handleFileClick(item);
                          }
                        }}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          item.type === "dir" || isViewableFile(item.name)
                            ? "cursor-pointer"
                            : "cursor-default"
                        } ${
                          hasVulnerabilities(item.path)
                            ? "bg-red-50 border-l-4 border-red-400"
                            : fileStatuses[item.path]?.status === "vulnerable"
                            ? "bg-red-50 border-l-4 border-red-400"
                            : fileStatuses[item.path]?.status === "scanned"
                            ? "bg-green-50 border-l-4 border-green-400"
                            : fileStatuses[item.path]?.status === "skipped"
                            ? "bg-gray-50 border-l-4 border-gray-400"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(item.name, item.type, item.path)}
                            <div>
                              <div className="font-medium text-brand-black flex items-center space-x-2">
                                <span>{item.name}</span>
                                {/* Show vulnerability badges */}
                                {hasVulnerabilities(item.path) && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {getVulnerabilityForFile(item.path).length}{" "}
                                    issues
                                  </Badge>
                                )}
                                {/* Show scan status badges */}
                                {fileStatuses[item.path] && (
                                  <Badge
                                    className={`text-xs ${
                                      fileStatuses[item.path].status ===
                                      "vulnerable"
                                        ? "bg-red-100 text-red-800"
                                        : fileStatuses[item.path].status ===
                                          "scanned"
                                        ? "bg-green-100 text-green-800"
                                        : fileStatuses[item.path].status ===
                                          "skipped"
                                        ? "bg-gray-100 text-gray-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {fileStatuses[item.path].status}
                                  </Badge>
                                )}
                              </div>
                              {item.type === "file" && item.size && (
                                <div className="text-sm text-brand-gray">
                                  {formatFileSize(item.size)}
                                </div>
                              )}
                              {/* Show scan status reason */}
                              {fileStatuses[item.path] && (
                                <div className="text-xs text-brand-gray mt-1">
                                  {fileStatuses[item.path].reason}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.type === "file" &&
                              isViewableFile(item.name) && (
                                <Badge variant="secondary" className="text-xs">
                                  Viewable
                                </Badge>
                              )}
                            {item.type === "file" && item.download_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(item.download_url, "_blank");
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {selectedFile && (
        <CodeViewer
          fileName={selectedFile.name}
          content={selectedFile.content}
          language={selectedFile.language}
          onClose={() => setSelectedFile(null)}
        />
      )}
      {/* Scan Details Modal */}
      <ScanDetailsModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        scanId={selectedScanId}
        repositoryName={project.name}
      />
    </div>
  );
};

export default RepositoryDetails;
