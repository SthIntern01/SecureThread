import React, { useState, useEffect, useRef, useMemo } from "react";
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
import AppSidebar from "../components/AppSidebar"; 
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  File,
  Folder,
  Download,
  ExternalLink,
  Code,
  FileText,
  Image as ImageIcon,
  Archive,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import {
  IconBrandGithub,
} from "@tabler/icons-react";
import ScanDetailsModal from "./ScanDetailsModal";
import { GitHubPATModal } from './GitHubPATModal';
import { CodeEditorModal } from './CodeEditorModal';
import { CreatePRModal } from './CreatePRModal';
import { githubIntegrationService } from '../services/githubIntegrationService';

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
  vulnerabilities?: Array<{
    id: number;
    title: string;
    description: string;
    severity: "critical" | "high" | "medium" | "low";
    line_number?: number;
    line_end_number?: number;
    code_snippet?: string;
    recommendation: string;
  }>;
  onClose: () => void;
  onFixClick?: (vuln: any) => void;
}

const CodeViewer: React.FC<CodeViewerProps> = ({
  fileName,
  content,
  language,
  vulnerabilities = [],
  onClose,
  onFixClick,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedVuln, setSelectedVuln] = useState<number | null>(null);
  const [processedContent, setProcessedContent] = useState<string>("");

  useEffect(() => {
    let contentString: string;

    try {
      if (!content) {
        contentString = "// No content available";
      } else if (typeof content === 'string') {
        contentString = content;
      } else if (typeof content === 'object') {
        if ('content' in content && typeof content.content === 'string') {
          try {
            contentString = atob(content.content.replace(/\n/g, ''));
          } catch (e) {
            console.error('Failed to decode base64:', e);
            contentString = content.content;
          }
        } else {
          contentString = JSON.stringify(content, null, 2);
        }
      } else {
        contentString = String(content);
      }

      setProcessedContent(contentString);
    } catch (error) {
      console.error('Error processing content:', error);
      setProcessedContent("// Error: Unable to display content");
    }
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(processedContent);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 border-red-600 theme-text";
      case "high":
        return "bg-orange-500 border-orange-600 theme-text";
      case "medium":
        return "bg-yellow-500 border-yellow-600 theme-text";
      case "low":
        return "bg-blue-500 border-blue-600 theme-text";
      default:
        return "bg-gray-500 border-gray-600 theme-text";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "medium":
        return "🟡";
      case "low":
        return "🔵";
      default:
        return "⚪";
    }
  };

  const lines = processedContent.split("\n");

  const vulnsByLine = new Map<number, Array<(typeof vulnerabilities)[0]>>();
  vulnerabilities.forEach((vuln) => {
    if (vuln.line_number) {
      const lineVulns = vulnsByLine.get(vuln.line_number) || [];
      lineVulns.push(vuln);
      vulnsByLine.set(vuln.line_number, lineVulns);
    }
  });

  if (!processedContent) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[95vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003D6B] dark:border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading file content...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-800 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="w-5 h-5 text-[#003D6B] dark:text-orange-500" />
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  {fileName}
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`text-xs ${getLanguageColor(language)}`}>
                    {language || "text"}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {lines.length} lines
                  </span>
                  {vulnerabilities.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {vulnerabilities.length}{" "}
                      {vulnerabilities.length === 1
                        ? "vulnerability"
                        : "vulnerabilities"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center space-x-1 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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

        <div className="flex-1 min-h-0 flex">
          <div className="flex-1 relative">
            <div
              className="absolute inset-0 bg-gray-50 dark:bg-[#0d1117] overflow-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E1 #0d1117",
              }}
            >
              <div className="flex">
                <div className="bg-gray-100 dark:bg-[#161b22] border-r border-gray-300 dark:border-gray-700 px-4 py-4 text-right select-none flex-shrink-0">
                  <div className="font-mono text-sm text-gray-500 dark:text-gray-500 leading-6">
                    {lines.map((_, index) => {
                      const lineNumber = index + 1;
                      const lineVulns = vulnsByLine.get(lineNumber) || [];
                      const hasVulns = lineVulns.length > 0;
                      const highestSeverity = hasVulns
                        ? lineVulns.reduce((highest, vuln) => {
                            const severityOrder = {
                              critical: 4,
                              high: 3,
                              medium: 2,
                              low: 1,
                            };
                            return severityOrder[vuln.severity] >
                              severityOrder[highest.severity]
                              ? vuln
                              : highest;
                          }).severity
                        : null;

                      return (
                        <div
                          key={lineNumber}
                          className={`flex items-center justify-end space-x-1 ${
                            hasVulns ? "font-bold" : ""
                          }`}
                          style={{ height: "24px", lineHeight: "24px" }}
                        >
                          {hasVulns && (
                            <span className="text-xs">
                              {getSeverityIcon(highestSeverity!)}
                            </span>
                          )}
                          <span
                            className={
                              hasVulns ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-600"
                            }
                          >
                            {lineNumber}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 px-4 py-4">
                  <pre className="font-mono text-sm leading-6 text-gray-800 dark:text-gray-300">
                    {lines.map((line, index) => {
                      const lineNumber = index + 1;
                      const lineVulns = vulnsByLine.get(lineNumber) || [];
                      const hasVulns = lineVulns.length > 0;
                      const highestSeverity = hasVulns
                        ? lineVulns.reduce((highest, vuln) => {
                            const severityOrder = {
                              critical: 4,
                              high: 3,
                              medium: 2,
                              low: 1,
                            };
                            return severityOrder[vuln.severity] >
                              severityOrder[highest.severity]
                              ? vuln
                              : highest;
                          }).severity
                        : null;

                      return (
                        <div
                          key={lineNumber}
                          className={`relative group ${
                            hasVulns
                              ? highestSeverity === "critical"
                                ? "bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500"
                                : highestSeverity === "high"
                                ? "bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500"
                                : highestSeverity === "medium"
                                ? "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500"
                                : "bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500"
                              : ""
                          } ${hasVulns ? "pl-2" : ""}`}
                          style={{ height: "24px", lineHeight: "24px" }}
                          onMouseEnter={() =>
                            hasVulns && setSelectedVuln(lineNumber)
                          }
                          onMouseLeave={() => setSelectedVuln(null)}
                        >
                          <span className={hasVulns ? "font-semibold" : ""}>
                            {line || " "}
                          </span>

                          {hasVulns && selectedVuln === lineNumber && (
                            <div className="absolute left-full top-0 ml-2 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-md">
                              <div className="space-y-2">
                                {lineVulns.map((vuln) => (
                                  <div
                                    key={vuln.id}
                                    className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0"
                                  >
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Badge
                                        className={`text-xs ${getSeverityColor(
                                          vuln.severity
                                        )}`}
                                      >
                                        {vuln.severity}
                                      </Badge>
                                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                        {vuln.title}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                      {vuln.description}
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                      <strong>Fix:</strong>{" "}
                                      {vuln.recommendation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {vulnerabilities.length > 0 && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Vulnerabilities ({vulnerabilities.length})
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {vulnerabilities.map((vuln) => (
                  <div
                    key={vuln.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-sm dark:hover:bg-gray-800 transition-colors"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        if (vuln.line_number) {
                          setSelectedVuln(vuln.line_number);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge
                          className={`text-xs ${getSeverityColor(vuln.severity)}`}
                        >
                          {vuln.severity}
                        </Badge>
                        {vuln.line_number && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Line {vuln.line_number}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        {vuln.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {vuln.description}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                        <strong>Fix: </strong> {vuln.recommendation}
                      </p>
                    </div>
                    
                    {/* Fix Code Button - Styled for Navy/Orange themes */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onFixClick) {
                          onFixClick(vuln);
                        }
                      }}
                      className="w-full mt-2 px-3 py-2 bg-[#003D6B] dark:bg-orange-500 text-white rounded-lg hover:bg-[#002A4D] dark:hover:bg-orange-600 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Code className="w-4 h-4" />
                      Fix This Vulnerability
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
  const [scanPollingInterval, setScanPollingInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [latestScanData, setLatestScanData] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [fileStatuses, setFileStatuses] = useState<{ [key: string]: any }>({});
  const [showPATModal, setShowPATModal] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  const [hasPATToken, setHasPATToken] = useState(false);
  const [selectedVulnerability, setSelectedVulnerability] = useState<any>(null);
  const [savedFixId, setSavedFixId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    content: string;
    language: string;
    vulnerabilities?: Array<{
      id: number;
      title: string;
      description: string;
      severity: "critical" | "high" | "medium" | "low";
      line_number?: number;
      line_end_number?: number;
      code_snippet?: string;
      recommendation: string;
    }>;
  } | null>(null);

  useEffect(() => {
    if (project.latest_scan?.status === "completed") {
      fetchVulnerabilities();
      if (project.latest_scan?.id) {
        fetchFileScanStatuses(project.latest_scan.id);
      }
    }
  }, [project.latest_scan]);

  useEffect(() => {
    fetchContents(currentPath);
  }, [currentPath]);

  useEffect(() => {
    checkPATStatus();
  }, []);

  const checkPATStatus = async () => {
    try {
      const status = await githubIntegrationService.checkPATStatus();
      setHasPATToken(status.has_token);
    } catch (error) {
      console.error('Error checking PAT status:', error);
    }
  };

  const handleFixVulnerability = (vuln: any) => {
    setSelectedVulnerability(vuln);
    if (!hasPATToken) {
      setSelectedFile(null);
      setShowPATModal(true);
    } else {
      setShowCodeEditor(true);
    }
  };

  const handleFixSaved = (fixId: number) => {
    setSavedFixId(fixId);
    setShowCodeEditor(false);
    setTimeout(() => {
      setShowPRModal(true);
    }, 500);
  };

  const handlePRSuccess = (prUrl: string) => {
    alert(`Pull request created! ${prUrl}`);
    setShowPRModal(false);
    window.open(prUrl, '_blank');
  };

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

  const getVcsProviderName = (): string => {
    if (project?.html_url) {
      if (project.html_url.includes('github.com')) {
        return 'GitHub';
      } else if (project.html_url.includes('bitbucket.org')) {
        return 'Bitbucket';
      } else if (project.html_url.includes('gitlab.com')) {
        return 'GitLab';
      }
    }
    return 'Repository';
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

        const fileVulnerabilities = getVulnerabilityForFile(filePath);

        setSelectedFile({
          name: fileName,
          content: data.content,
          language,
          vulnerabilities: fileVulnerabilities,
        });
      } else {
        console.error("Failed to fetch file content:", response.status);
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  const handleFileClick = (file: FileContent) => {
    if (isViewableFile(file.name)) {
      fetchFileContent(file.path, file.name);
    }
  };

  useEffect(() => {
    if (
      project.latest_scan?.status === "running" ||
      project.latest_scan?.status === "pending"
    ) {
      startScanPolling();
    }

    return () => {
      if (scanPollingInterval) {
        clearInterval(scanPollingInterval);
      }
    };
  }, [project.latest_scan]);

  const startScanPolling = () => {
    if (scanPollingInterval) {
      clearInterval(scanPollingInterval);
    }

    const interval = setInterval(async () => {
      if (!project.latest_scan?.id) return;

      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:8000"
          }/api/v1/scans/${project.latest_scan.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const scanData = await response.json();
          setLatestScanData(scanData);

          if (scanData.status === "completed" || scanData.status === "failed") {
            clearInterval(interval);
            setScanPollingInterval(null);

            if (scanData.status === "completed") {
              fetchVulnerabilities();
              fetchFileScanStatuses(scanData.id);
            }
          }
        }
      } catch (error) {
        console.error("Error polling scan status:", error);
      }
    }, 5000);

    setScanPollingInterval(interval);
  };

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
        }/api/v1/scans/${scanId}/detailed`,
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

        const fileResults =
          data.file_results ||
          data.scan?.scan_metadata?.file_scan_results ||
          [];

        fileResults.forEach((file: any) => {
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
                  <span className="theme-text text-xs font-bold">!</span>
                </div>
              </div>
            );
          case "scanned":
            return (
              <div className="relative">
                {baseIcon}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="theme-text text-xs">✓</span>
                </div>
              </div>
            );
          case "skipped":
            return (
              <div className="relative">
                {baseIcon}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="theme-text text-xs">-</span>
                </div>
              </div>
            );
          case "error":
            return (
              <div className="relative">
                {baseIcon}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="theme-text text-xs">×</span>
                </div>
              </div>
            );
        }
      }

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

  const sortedContents = [...filteredContents].sort((a, b) => {
    if (a.type === "dir" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "dir") return 1;
    return a.name.localeCompare(b.name);
  });

  const allVulnerableFiles = useMemo(() => {
    const vulnFilePaths = new Set(vulnerabilities.map(v => v.file_path));
    return Array.from(vulnFilePaths).map(filePath => {
      const fileVulns = vulnerabilities.filter(v => v.file_path === filePath);
      const fileName = filePath.split('/').pop() || filePath;
      const highestSeverity = fileVulns.reduce((max, vuln) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[vuln.severity] > severityOrder[max.severity] ? vuln : max;
      });
      
      return {
        path: filePath,
        name: fileName,
        fullPath: filePath,
        vulnerabilityCount: fileVulns.length,
        highestSeverity: highestSeverity.severity,
        vulnerabilities: fileVulns
      };
    }).sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (severityOrder[a.highestSeverity] !== severityOrder[b.highestSeverity]) {
        return severityOrder[b.highestSeverity] - severityOrder[a.highestSeverity];
      }
      return b.vulnerabilityCount - a.vulnerabilityCount;
    });
  }, [vulnerabilities]);

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
            <div className="flex items-center space-x-2 text-sm mb-4">
              <span className="font-medium text-gray-900 dark:text-white">SecureThread</span>
              <ChevronRight size={16} className="text-gray-300" />
              <button
                onClick={onBack}
                className="font-medium text-gray-900 dark:text-white hover:text-[#003D6B] dark:hover:text-orange-400 transition-colors"
              >
                Projects
              </button>
              <ChevronRight size={16} className="text-gray-300" />
              <span className="font-medium text-gray-900 dark:text-white">{project.name}</span>
            </div>

            <div className="bg-white/80 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20 dark:border-white/10 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center space-x-2 border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-[#003D6B] hover:!text-white dark:hover:bg-orange-500 dark:hover:!text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Projects</span>
                  </Button>
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <IconBrandGithub className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {project.full_name}
                      </h1>
                      {project.is_private && (
                        <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">Private</Badge>
                      )}
                      {project.is_fork && <Badge variant="outline" className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600">Fork</Badge>}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
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
                      className="border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-[#003D6B] hover:!text-white dark:hover:bg-orange-500 dark:hover:!text-white transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Scan Report
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.html_url, "_blank")}
                    className="border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-[#003D6B] hover:!text-white dark:hover:bg-orange-500 dark:hover:!text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on {getVcsProviderName()}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {project.language || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Primary Language
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {project.default_branch}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Default Branch</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {project.updated_at &&
                    project.updated_at !== "1970-01-01T00:00:00.000Z"
                      ? new Date(project.updated_at).toLocaleDateString()
                      : "Unknown"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Last Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {latestScanData?.status ||
                      project.latest_scan?.status ||
                      project.status}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Scan Status</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 shadow-lg overflow-hidden">
              {allVulnerableFiles.length > 0 && (
                <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-red-200 dark:border-red-900/50 shadow-lg overflow-hidden mb-6">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                          <span className="text-red-600 dark:text-red-400 font-bold text-lg">! </span>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-red-900 dark:text-red-200">
                            Files with Vulnerabilities
                          </h2>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {allVulnerableFiles.length} file{allVulnerableFiles.length !== 1 ? 's' :  ''} contain{allVulnerableFiles.length === 1 ? 's' : ''} security issues
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-red-100 dark:divide-red-900/20">
                    {allVulnerableFiles.map((file, index) => (
                      <div
                        key={`vuln-${file.path}-${index}`}
                        onClick={() => fetchFileContent(file.path, file.name)}
                        className="p-4 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="relative">
                            <File className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                              file.highestSeverity === 'critical' ?  'bg-red-600' :
                              file.highestSeverity === 'high' ? 'bg-orange-600' :
                              file.highestSeverity === 'medium' ? 'bg-yellow-600' :  'bg-blue-600'
                            }`}></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </span>
                              <Badge 
                                variant="destructive" 
                                className="text-xs flex-shrink-0"
                              >
                                {file.vulnerabilityCount} issue{file.vulnerabilityCount !== 1 ? 's' :  ''}
                              </Badge>
                              <Badge 
                                className={`text-xs flex-shrink-0 ${
                                  file.highestSeverity === 'critical' ? 'bg-red-600' : 
                                  file.highestSeverity === 'high' ?  'bg-orange-600' :
                                  file.highestSeverity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                                } text-white`}
                              >
                                {file.highestSeverity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {file.fullPath}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-4 border-b border-gray-200/50 dark:border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Repository Files
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchContents(currentPath)}
                      disabled={loading}
                      className="border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-[#003D6B] hover:!text-white dark:hover:bg-orange-500 dark:hover:!text-white transition-colors"
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
                      className="pl-10 w-64 bg-white dark:bg-white/5 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  {getBreadcrumbPath().map((segment, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <button
                        onClick={() => navigateToPath(index)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {segment}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003D6B] dark:border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading files...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <File className="w-12 h-12 text-red-300 mx-auto mb-4" />
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Button
                      onClick={() => fetchContents(currentPath)}
                      variant="outline"
                      className="border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-[#003D6B] hover:!text-white dark:hover:bg-orange-500 dark:hover:!text-white transition-colors"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : sortedContents.length === 0 ? (
                  <div className="p-8 text-center">
                    <Folder className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm
                        ? "No files match your search."
                        : "This directory is empty."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {sortedContents.map((item, index) => {
                      const fileVulns = getVulnerabilityForFile(item.path);
                      const hasVulns = fileVulns.length > 0;
                      const fileStatus = fileStatuses[item.path];

                      let statusMessage = "";
                      let statusColor = "";
                      let statusBadge = null;

                      if (item.type === "file") {
                        const currentScanStatus =
                          latestScanData?.status || project.latest_scan?.status;

                        if (currentScanStatus === "completed") {
                          if (fileStatus) {
                            switch (fileStatus.status) {
                              case "vulnerable":
                                const vulnCount = hasVulns
                                  ? fileVulns.length
                                  : 1;
                                statusMessage = `Scanning OK, ${vulnCount} Vulnerabilities found`;
                                statusColor = "text-red-600 dark:text-red-400";
                                statusBadge = (
                                  <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 text-xs">
                                    Scanning OK, {vulnCount} Vulnerabilities
                                    found
                                  </Badge>
                                );
                                break;
                              case "scanned":
                                if (hasVulns) {
                                  statusMessage = `Scanning OK, ${fileVulns.length} Vulnerabilities found`;
                                  statusColor = "text-red-600 dark:text-red-400";
                                  statusBadge = (
                                    <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 text-xs">
                                      Scanning OK, {fileVulns.length}{" "}
                                      Vulnerabilities found
                                    </Badge>
                                  );
                                } else {
                                  statusMessage = "Scanning OK File Safe";
                                  statusColor = "text-green-600 dark:text-green-400";
                                  statusBadge = (
                                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
                                      Scanning OK File Safe
                                    </Badge>
                                  );
                                }
                                break;
                              case "skipped":
                                statusMessage =
                                  "Scanning did not occur (API Constraints)";
                                statusColor = "text-gray-600 dark:text-gray-400";
                                statusBadge = (
                                  <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-xs">
                                    Scanning did not occur (API Constraints)
                                  </Badge>
                                );
                                break;
                              case "error":
                                statusMessage = "Scan Failed";
                                statusColor = "text-red-600 dark:text-red-400";
                                statusBadge = (
                                  <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 text-xs">
                                    Scan Failed
                                  </Badge>
                                );
                                break;
                              default:
                                statusMessage =
                                  "Scanning did not occur (API Constraints)";
                                statusColor = "text-gray-600 dark:text-gray-400";
                                statusBadge = (
                                  <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-xs">
                                    Scanning did not occur (API Constraints)
                                  </Badge>
                                );
                            }
                          } else if (hasVulns) {
                            statusMessage = `Scanning OK, ${fileVulns.length} Vulnerabilities found`;
                            statusColor = "text-red-600 dark:text-red-400";
                            statusBadge = (
                              <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 text-xs">
                                Scanning OK, {fileVulns.length} Vulnerabilities
                                found
                              </Badge>
                            );
                          } else {
                            statusMessage =
                              "Scanning did not occur (API Constraints)";
                            statusColor = "text-gray-600 dark:text-gray-400";
                            statusBadge = (
                              <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-xs">
                                Scanning did not occur (API Constraints)
                              </Badge>
                            );
                          }
                        } else if (currentScanStatus === "failed") {
                          statusMessage = "Scan Failed";
                          statusColor = "text-red-600 dark:text-red-400";
                          statusBadge = (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 text-xs">
                              Scan Failed
                            </Badge>
                          );
                        } else if (
                          currentScanStatus === "running" ||
                          currentScanStatus === "pending"
                        ) {
                          statusMessage = "Scanning in progress...";
                          statusColor = "text-blue-600 dark:text-blue-400";
                          statusBadge = (
                            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs">
                              Scanning in progress...
                            </Badge>
                          );
                        } else {
                          statusMessage = "Not scanned";
                          statusColor = "text-gray-600 dark:text-gray-400";
                          statusBadge = (
                            <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-xs">
                              Not scanned
                            </Badge>
                          );
                        }
                      }

                      return (
                        <div
                          key={`${item.path}-${index}`}
                          onClick={() => {
                            if (item.type === "dir") {
                              handleFolderClick(item.path);
                            } else {
                              handleFileClick(item);
                            }
                          }}
                          className={`p-4 transition-colors ${
                            item.type === "dir" || isViewableFile(item.name)
                              ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                              : "cursor-default"
                          } ${
                            hasVulns || fileStatus?.status === "vulnerable"
                              ? "bg-red-50 dark:bg-red-900/10 border-l-4 border-red-400"
                              : fileStatus?.status === "scanned" && !hasVulns
                              ? "bg-green-50 dark:bg-green-900/10 border-l-4 border-green-400"
                              : fileStatus?.status === "skipped"
                              ? "bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-400"
                              : fileStatus?.status === "error"
                              ? "bg-red-50 dark:bg-red-900/10 border-l-4 border-red-400"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(item.name, item.type, item.path)}
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                  <span>{item.name}</span>

                                  {item.type === "file" && statusBadge}

                                  {hasVulns && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs ml-2"
                                    >
                                      {fileVulns.length}{" "}
                                      {fileVulns.length === 1
                                        ? "issue"
                                        : "issues"}
                                    </Badge>
                                  )}
                                </div>

                                {item.type === "file" && item.size && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatFileSize(item.size)}
                                  </div>
                                )}

                                {item.type === "file" && statusMessage && (
                                  <div
                                    className={`text-sm font-medium ${statusColor} mt-1`}
                                  >
                                    {statusMessage}
                                  </div>
                                )}

                                {fileStatus &&
                                  fileStatus.reason &&
                                  fileStatus.status !== "scanned" &&
                                  item.type === "file" && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Reason: {fileStatus.reason}
                                    </div>
                                  )}

                                {hasVulns && item.type === "file" && (
                                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {fileVulns.filter(
                                      (v) => v.severity === "critical"
                                    ).length > 0 && (
                                      <span className="font-semibold">
                                        Critical:{" "}
                                        {
                                          fileVulns.filter(
                                            (v) => v.severity === "critical"
                                          ).length
                                        }
                                      </span>
                                    )}
                                    {fileVulns.filter(
                                      (v) => v.severity === "high"
                                    ).length > 0 && (
                                      <span className="ml-2 font-semibold">
                                        High:{" "}
                                        {
                                          fileVulns.filter(
                                            (v) => v.severity === "high"
                                          ).length
                                        }
                                      </span>
                                    )}
                                    {fileVulns.filter(
                                      (v) => v.severity === "medium"
                                    ).length > 0 && (
                                      <span className="ml-2">
                                        Medium:{" "}
                                        {
                                          fileVulns.filter(
                                            (v) => v.severity === "medium"
                                          ).length
                                        }
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {item.type === "file" &&
                                isViewableFile(item.name) && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-[#D6E6FF] text-[#003D6B] dark:bg-blue-500/20 dark:text-blue-300"
                                  >
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
                                  className="text-gray-500 dark:text-gray-400 hover:text-[#003D6B] dark:hover:text-orange-400"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedFile && (
        <CodeViewer
          fileName={selectedFile.name}
          content={selectedFile.content}
          language={selectedFile.language}
          vulnerabilities={selectedFile.vulnerabilities}
          onClose={() => setSelectedFile(null)}
          onFixClick={handleFixVulnerability}
        />
      )}
      
      <ScanDetailsModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        scanId={selectedScanId}
        repositoryName={project.name}
      />
      
      <GitHubPATModal
        isOpen={showPATModal}
        onClose={() => setShowPATModal(false)}
        onSuccess={() => {
          setHasPATToken(true);
          setShowPATModal(false);
          if (selectedVulnerability) {
            setShowCodeEditor(true);
          }
        }}
      />

      {selectedVulnerability && (
        <CodeEditorModal
          isOpen={showCodeEditor}
          onClose={() => {
            setShowCodeEditor(false);
            setSelectedVulnerability(null);
          }}
          vulnerability={{
            id: selectedVulnerability.id,
            title: selectedVulnerability.title,
            severity: selectedVulnerability.severity,
            file_path: selectedVulnerability.file_path,
            line_number: selectedVulnerability.line_number,
            code_snippet: selectedVulnerability.code_snippet,
            fix_suggestion: selectedVulnerability.fix_suggestion,
            repository_id: project.id,
          }}
          onFixSaved={handleFixSaved}
        />
      )}

      <CreatePRModal
        isOpen={showPRModal}
        onClose={() => setShowPRModal(false)}
        repositoryId={project.id}
        repositoryName={project.full_name}
        preSelectedFixIds={savedFixId ? [savedFixId] : []}
        onSuccess={handlePRSuccess}
      />
    </div>
  );
};

export default RepositoryDetails;