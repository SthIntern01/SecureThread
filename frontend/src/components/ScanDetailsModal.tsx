import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ShieldCheck,
  FileText,
  Clock,
  TrendingUp,
  X,
  ExternalLink,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Code2,
  AlertCircle,
  CheckCircle,
  XCircle,
  File,
  SkipForward,
  AlertOctagon,
} from "lucide-react";

interface Vulnerability {
  id: number;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  cwe_id?: string;
  owasp_category?: string;
  file_path: string;
  line_number?: number;
  line_end_number?: number;
  code_snippet?: string;
  recommendation: string;
  fix_suggestion?: string;
  risk_score?: number;
  exploitability?: string;
  impact?: string;
  status: string;
  detected_at: string;
}

interface FileStatus {
  file_path: string;
  status: "scanned" | "vulnerable" | "skipped" | "error";
  reason: string;
  vulnerabilities:  Vulnerability[];
  file_size?: number;
}

interface ScanDetails {
  id: number;
  repository_id: number;
  status: string;
  started_at: string;
  completed_at?:  string;
  total_files_scanned: number;
  scan_duration?:  string;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  security_score?: number;
  code_coverage?: number;
  error_message?: string;
  vulnerabilities: Vulnerability[];
  scan_metadata?: {
    files_scanned: number;
    files_skipped: number;
    vulnerable_files_found: number;
    scan_stopped_reason:  string;
    total_scannable_files: number;
    file_scan_results?: FileStatus[];
  };
}

interface ScanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanId: number | null;
  repositoryName: string;
}

const ScanDetailsModal: React.FC<ScanDetailsModalProps> = ({
  isOpen,
  onClose,
  scanId,
  repositoryName,
}) => {
  const [scanDetails, setScanDetails] = useState<ScanDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedVulns, setExpandedVulns] = useState<Set<number>>(new Set());
  const [fileStatusFilter, setFileStatusFilter] = useState("all");
  const { toast } = useToast();
  

  useEffect(() => {
    if (isOpen && scanId) {
      fetchScanDetails();
    }
  }, [isOpen, scanId]);

  const fetchScanDetails = async () => {
  if (!scanId) return;

  setLoading(true);
  setError("");
  try {
    const token = localStorage. getItem("access_token");
    
    // Try the detailed endpoint first
    let response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/custom-scans/${scanId}/detailed`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // If detailed endpoint fails, try the basic endpoint
    if (!response.ok) {
      response = await fetch(
        `${import.meta.env. VITE_API_URL || "http://localhost:8000"}/api/v1/custom-scans/${scanId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (response.ok) {
      const data = await response.json();
      
      // Handle different response structures
      if (data.scan) {
        // If API returns {scan: {... }, vulnerabilities: [...]}
        setScanDetails({
          ...data. scan,
          vulnerabilities: data.vulnerabilities || [],
        });
      } else {
        // If API returns scan data directly
        setScanDetails(data);
      }
    } else {
      setError("Failed to fetch scan details");
    }
  } catch (error) {
    console.error("Error fetching scan details:", error);
    setError("Network error occurred while fetching scan details");
  } finally {
    setLoading(false);
  }
};

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": 
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30";
      case "high": 
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30";
      case "medium": 
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30";
      case "low": 
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30";
      default: 
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": 
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-500" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-500" />;
      case "medium": 
        return <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />;
      case "low":
        return <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-500" />;
    }
  };

  const getFileStatusIcon = (status: string) => {
    switch (status) {
      case "vulnerable":
        return <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-500" />;
      case "scanned":
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500" />;
      case "skipped":
        return <SkipForward className="w-4 h-4 text-gray-600 dark:text-gray-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-500" />;
      default:
        return <File className="w-4 h-4 text-gray-600 dark:text-gray-500" />;
    }
  };

  const getFileStatusColor = (status: string) => {
    switch (status) {
      case "vulnerable":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30";
      case "scanned":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30";
      case "skipped":
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark: text-gray-300 dark: border-gray-500/30";
      case "error":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark: text-red-300 dark: border-red-500/30";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300";
      case "running":
        return "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
      case "failed":
        return "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300";
      case "pending":
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300";
      default: 
        return "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300";
    }
  };

  const toggleVulnerability = (vulnId: number) => {
    setExpandedVulns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vulnId)) {
        newSet.delete(vulnId);
      } else {
        newSet.add(vulnId);
      }
      return newSet;
    });
  };

  const filteredVulnerabilities =
    scanDetails?.vulnerabilities. filter((vuln) => {
      const matchesSearch =
        vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.description. toLowerCase().includes(searchTerm. toLowerCase());

      const matchesSeverity =
        selectedSeverity === "all" || vuln.severity === selectedSeverity;

      return matchesSearch && matchesSeverity;
    }) || [];

  const filteredFileResults =
    scanDetails?.scan_metadata?.file_scan_results?. filter((file) => {
      const matchesSearch = file.file_path
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        fileStatusFilter === "all" || file.status === fileStatusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  const exportReportAsJSON = () => {
    if (!scanDetails) return;

    const report = {
      repository:  repositoryName,
      scan:  {
        id: scanDetails.id,
        started_at: scanDetails.started_at,
        completed_at:  scanDetails.completed_at,
        status: scanDetails.status,
        duration: scanDetails.scan_duration,
        metadata: scanDetails.scan_metadata,
      },
      summary: {
        total_vulnerabilities: scanDetails.total_vulnerabilities,
        critical:  scanDetails.critical_count,
        high: scanDetails.high_count,
        medium: scanDetails.medium_count,
        low: scanDetails.low_count,
        security_score: scanDetails.security_score,
        code_coverage: scanDetails.code_coverage,
      },
      vulnerabilities: scanDetails.vulnerabilities,
      file_status: scanDetails.scan_metadata?. file_scan_results || [],
    };

    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-scan-${repositoryName}-${scanDetails.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportReportAsCSV = () => {
    if (!scanDetails) return;

    const csvRows = [
      [
        "File Path",
        "Status",
        "Vulnerabilities",
        "Severity",
        "Title",
        "Description",
        "Recommendation",
      ].join(","),

      ...scanDetails.vulnerabilities. map((vuln) =>
        [
          `"${vuln.file_path}"`,
          "vulnerable",
          "1",
          vuln.severity,
          `"${vuln.title. replace(/"/g, '""')}"`,
          `"${vuln.description.replace(/"/g, '""')}"`,
          `"${vuln.recommendation.replace(/"/g, '""')}"`,
        ].join(",")
      ),

      ...(scanDetails.scan_metadata?. file_scan_results
        ?.filter(
          (file) =>
            !scanDetails.vulnerabilities.some(
              (v) => v.file_path === file.file_path
            )
        )
        .map((file) =>
          [
            `"${file.file_path}"`,
            file.status,
            "0",
            "none",
            "No vulnerabilities",
            file.reason,
            "No action needed",
          ].join(",")
        ) || []),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-scan-${repositoryName}-${scanDetails. id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportReportAsPDF = async () => {
  if (!scanDetails) return;

  // Show loading toast
  let progressToast = toast({
    title:  "🔄 Generating PDF Report",
    description: "Compiling your security report with LaTeX...",
    duration: Infinity,
  });

  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/custom-scans/${scanId}/report/pdf?report_type=comprehensive`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response. ok) {
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      if (total === 0) {
        // If we can't track progress, just show simple message
        progressToast.update({
          id: progressToast.id,
          title: "📥 Downloading PDF",
          description: "Preparing your file.. .",
        });
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const chunks: Uint8Array[] = [];  // ✅ Add type annotation
        a.href = url;
        a.download = `security-report-${repositoryName}-${scanDetails.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setTimeout(() => {
          progressToast.dismiss();
          toast({
            title: "✅ PDF Downloaded! ",
            description: `Security report saved successfully.`,
            duration: 5000,
          });
        }, 1000);
        
      } else {
        // Track download progress
        const reader = response.body?. getReader();
        const chunks:  Uint8Array[] = [];
        let receivedLength = 0;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            chunks.push(value);
            receivedLength += value.length;
            
            const percentComplete = Math.round((receivedLength / total) * 100);
            
            progressToast.update({
              id: progressToast.id,
              title: "📥 Downloading PDF",
              description: `Progress: ${percentComplete}% (${(receivedLength / 1024 / 1024).toFixed(2)} MB)`,
            });
          }
          
          // Combine chunks into blob
          const blob = new Blob(chunks);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `security-report-${repositoryName}-${scanDetails.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          progressToast.dismiss();
          toast({
            title: "✅ PDF Downloaded! ",
            description: `Security report (${(total / 1024 / 1024).toFixed(2)} MB) saved successfully.`,
            duration: 5000,
          });
        }
      }

    } else {
      progressToast.dismiss();
      const errorText = await response.text();
      
      toast({
        title: "❌ PDF Generation Failed",
        description: errorText || "Please ensure MiKTeX is installed on the server.",
        variant: "destructive",
        duration: 7000,
      });
    }
  } catch (error) {
    progressToast.dismiss();
    console.error("Error generating PDF:", error);
    
    toast({
      title: "❌ Error Generating PDF",
      description: error instanceof Error ? error.message : "Unknown error occurred.",
      variant: "destructive",
      duration: 7000,
    });
  }
};

  
  

  if (! isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-white/20">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-[#003D6B] dark:text-orange-500" />
              <span>Security Scan Report - {repositoryName}</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportReportAsPDF} className="border-gray-300 dark:border-white/20">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={exportReportAsJSON} className="border-gray-300 dark:border-white/20">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={exportReportAsCSV} className="border-gray-300 dark:border-white/20">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ?  (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003D6B] dark:border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-white/70">Loading scan details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={fetchScanDetails} variant="outline" className="border-gray-300 dark:border-white/20">
                Try Again
              </Button>
            </div>
          </div>
        ) : scanDetails ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
              <TabsList className="flex-shrink-0 bg-gray-100 dark:bg-white/10">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="vulnerabilities">
                  Vulnerabilities ({scanDetails.total_vulnerabilities})
                </TabsTrigger>
                <TabsTrigger value="file-status">
                  File Status ({scanDetails. scan_metadata?.file_scan_results?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* Scan Status */}
                  <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-6 border border-gray-200 dark:border-white/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          <Badge className={getStatusColor(scanDetails.status)}>
                            {scanDetails. status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-white/70 mt-1">Status</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {scanDetails.scan_duration || "N/A"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-white/70 mt-1">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {scanDetails.total_files_scanned}
                        </div>
                        <div className="text-sm text-gray-600 dark: text-white/70 mt-1">Files Scanned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark: text-white">
                          {scanDetails.security_score?.toFixed(1) || "N/A"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-white/70 mt-1">Security Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Scan Limits Alert */}
                  {scanDetails.scan_metadata?.scan_stopped_reason === "vulnerability_limit_reached" && (
                    <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Scan Limited</h4>
                          <p className="text-sm text-yellow-700 dark: text-yellow-200 mt-1">
                            Scan stopped after finding {scanDetails. scan_metadata.vulnerable_files_found} vulnerable files (limit:  15). {scanDetails.scan_metadata.files_skipped} files were not scanned due to token constraints.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vulnerability Summary */}
                  <div className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark: border-white/20 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Vulnerability Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{scanDetails.critical_count}</div>
                        <div className="text-sm text-red-700 dark:text-red-300">Critical</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{scanDetails.high_count}</div>
                        <div className="text-sm text-orange-700 dark:text-orange-300">High</div>
                      </div>
                      <div className="bg-yellow-50 dark: bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{scanDetails.medium_count}</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">Medium</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-[#003D6B] dark: text-blue-400">{scanDetails.low_count}</div>
                        <div className="text-sm text-[#003D6B] dark: text-blue-300">Low</div>
                      </div>
                    </div>
                  </div>

                  {/* Scan Timeline */}
                  <div className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark: border-white/20 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Scan Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          Started: {new Date(scanDetails.started_at).toLocaleString()}
                        </span>
                      </div>
                      {scanDetails.completed_at && (
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            Completed: {new Date(scanDetails.completed_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vulnerabilities" className="flex-1 flex flex-col overflow-hidden">
                {/* Filters */}
                <div className="flex-shrink-0 bg-gray-50 dark:bg-white/5 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search vulnerabilities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-white/20 rounded-md bg-white dark:bg-white/10 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <select
                      value={selectedSeverity}
                      onChange={(e) => setSelectedSeverity(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-white/20 rounded-md bg-white dark:bg-white/10 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <div className="text-sm text-gray-600 dark:text-white/70">
                      {filteredVulnerabilities.length} of {scanDetails.total_vulnerabilities} vulnerabilities
                    </div>
                  </div>
                </div>

                {/* Vulnerabilities List */}
                <div className="flex-1 overflow-auto space-y-3">
                  {filteredVulnerabilities.map((vuln) => (
                    <div
                      key={vuln.id}
                      className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 p-4 hover:shadow-md transition-shadow"
                    >
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => toggleVulnerability(vuln.id)}
                      >
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex items-center space-x-2 mt-1">
                            {getSeverityIcon(vuln.severity)}
                            {expandedVulns. has(vuln.id) ? (
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{vuln.title}</h4>
                              <Badge className={`text-xs ${getSeverityColor(vuln.severity)}`}>
                                {vuln.severity}
                              </Badge>
                              {vuln.cwe_id && (
                                <Badge variant="outline" className="text-xs text-gray-700 dark:text-white border-gray-300 dark:border-white/20">
                                  {vuln.cwe_id}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-white/70 mb-2">
                              <Code2 className="w-3 h-3 inline mr-1" />
                              {vuln.file_path}
                              {vuln.line_number && ` (Line ${vuln.line_number})`}
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white">{vuln.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {vuln.risk_score && (
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              Risk:  {vuln.risk_score. toFixed(1)}/10
                            </div>
                          )}
                        </div>
                      </div>

                      {expandedVulns.has(vuln.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/20">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-semibold text-sm text-gray-900 dark: text-white mb-2">Recommendation</h5>
                              <p className="text-sm text-gray-900 dark:text-white bg-green-50 dark:bg-green-500/10 p-3 rounded border border-green-200 dark: border-green-500/20">
                                {vuln.recommendation}
                              </p>
                              {vuln.fix_suggestion && (
                                <>
                                  <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 mt-3">Fix Suggestion</h5>
                                  <p className="text-sm text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-500/10 p-3 rounded border border-blue-200 dark:border-blue-500/20">
                                    {vuln.fix_suggestion}
                                  </p>
                                </>
                              )}
                            </div>
                            {vuln.code_snippet && (
                              <div>
                                <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Code Snippet</h5>
                                <pre className="bg-gray-900 dark:bg-black/40 text-gray-100 dark:text-gray-300 rounded p-3 text-xs overflow-x-auto border border-gray-700 dark:border-white/10 font-mono">
                                  <code>{vuln.code_snippet}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex items-center space-x-4 text-xs text-gray-600 dark: text-white/70">
                            <span>Category: {vuln.category}</span>
                            {vuln.exploitability && <span>Exploitability: {vuln.exploitability}</span>}
                            {vuln.impact && <span>Impact: {vuln.impact}</span>}
                            <span>Detected: {new Date(vuln.detected_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredVulnerabilities.length === 0 && (
                    <div className="text-center py-8">
                      <ShieldCheck className="w-12 h-12 text-green-600 dark:text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {scanDetails.total_vulnerabilities === 0 ? "No Vulnerabilities Found" : "No Matching Vulnerabilities"}
                      </h3>
                      <p className="text-gray-600 dark:text-white/70">
                        {scanDetails.total_vulnerabilities === 0
                          ? "Great! This scan didn't find any security vulnerabilities."
                          : "Try adjusting your search or filter criteria. "}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="file-status" className="flex-1 flex flex-col overflow-hidden">
                {/* File Status Filters */}
                <div className="flex-shrink-0 bg-gray-50 dark: bg-white/5 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-white/20 rounded-md bg-white dark:bg-white/10 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <select
                      value={fileStatusFilter}
                      onChange={(e) => setFileStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-white/20 rounded-md bg-white dark:bg-white/10 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="all">All Files</option>
                      <option value="vulnerable">Vulnerable</option>
                      <option value="scanned">Clean</option>
                      <option value="skipped">Skipped</option>
                      <option value="error">Error</option>
                    </select>
                    <div className="text-sm text-gray-600 dark:text-white/70">
                      {filteredFileResults.length} of {scanDetails. scan_metadata?. file_scan_results?.length || 0} files
                    </div>
                  </div>
                </div>

                {/* File Status List */}
                <div className="flex-1 overflow-auto">
                  <div className="space-y-2">
                    {filteredFileResults.map((file, index) => (
                      <div
                        key={`${file.file_path}-${index}`}
                        className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {getFileStatusIcon(file.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-white truncate">{file.file_path}</span>
                                <Badge className={`text-xs ${getFileStatusColor(file.status)}`}>
                                  {file. status}
                                </Badge>
                                {file.vulnerabilities. length > 0 && (
                                  <Badge variant="destructive" className="text-xs bg-red-500 dark:bg-red-600">
                                    {file. vulnerabilities.length} issues
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-white/70">{file.reason}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredFileResults. length === 0 && (
                      <div className="text-center py-8">
                        <File className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Files Found</h3>
                        <p className="text-gray-600 dark:text-white/70">Try adjusting your search or filter criteria. </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div className="bg-[#E8F0FF] dark:bg-blue-500/10 rounded-lg p-6 border border-[#003D6B]/20 dark:border-blue-500/20">
                    <h3 className="text-lg font-semibold text-[#003D6B] dark:text-blue-300 mb-4">Priority Recommendations</h3>
                    <div className="space-y-3">
                      {scanDetails.critical_count > 0 && (
                        <div className="flex items-start space-x-3">
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
                          <div>
                            <div className="font-semibold text-red-800 dark:text-red-300">Address Critical Vulnerabilities Immediately</div>
                            <div className="text-sm text-red-700 dark:text-red-200">
                              {scanDetails.critical_count} critical vulnerabilities require immediate attention. 
                            </div>
                          </div>
                        </div>
                      )}

                      {scanDetails.high_count > 0 && (
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-500 mt-0.5" />
                          <div>
                            <div className="font-semibold text-orange-800 dark:text-orange-300">Prioritize High-Risk Issues</div>
                            <div className="text-sm text-orange-700 dark:text-orange-200">
                              {scanDetails.high_count} high-severity vulnerabilities should be addressed soon.
                            </div>
                          </div>
                        </div>
                      )}

                      {scanDetails.scan_metadata?.scan_stopped_reason === "vulnerability_limit_reached" && (
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                          <div>
                            <div className="font-semibold text-yellow-800 dark:text-yellow-300">Complete Full Scan</div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-200">
                              This scan was limited due to token constraints. Consider running additional targeted scans on the remaining{" "}
                              {scanDetails.scan_metadata. files_skipped} files for complete coverage.
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start space-x-3">
                        <TrendingUp className="w-5 h-5 text-[#003D6B] dark: text-blue-400 mt-0.5" />
                        <div>
                          <div className="font-semibold text-[#003D6B] dark:text-blue-300">Improve Security Score</div>
                          <div className="text-sm text-gray-700 dark:text-gray-200">
                            Current score: {scanDetails.security_score?. toFixed(1) || "N/A"}/100.  Focus on fixing high-impact vulnerabilities to
                            improve this score.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark: border-white/20 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Next Steps</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-200">
                      <li>Review and prioritize vulnerabilities by severity level</li>
                      <li>Implement fixes for critical and high-severity issues first</li>
                      <li>Update dependencies and libraries to latest secure versions</li>
                      {scanDetails.scan_metadata?.scan_stopped_reason === "vulnerability_limit_reached" && (
                        <li>Run additional scans on remaining files for complete coverage</li>
                      )}
                      <li>Run another scan after implementing fixes to verify improvements</li>
                      <li>Consider implementing automated security scanning in your CI/CD pipeline</li>
                    </ol>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ScanDetailsModal;
