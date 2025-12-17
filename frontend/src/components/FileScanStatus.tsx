// Updated: frontend/src/components/FileScanStatus.tsx - Fix API endpoint and data structure

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  Search,
  Download,
  Eye,
  AlertCircle,
  Code,
  Shield,
} from "lucide-react";

interface FileStatus {
  file_path: string;
  status: "scanned" | "vulnerable" | "skipped" | "error";
  reason: string;
  vulnerability_count: number;
  file_size?: number;
}

interface Vulnerability {
  id: number;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  file_path: string;
  line_number?: number;
  code_snippet?: string;
  recommendation: string;
  risk_score?: number;
}

interface FileScanStatusProps {
  scanId: number | null;
  repositoryName: string;
  isOpen: boolean;
  onClose: () => void;
}

const FileScanStatus: React.FC<FileScanStatusProps> = ({
  scanId,
  repositoryName,
  isOpen,
  onClose,
}) => {
  const [fileResults, setFileResults] = useState<FileStatus[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileVulnerabilities, setFileVulnerabilities] = useState<
    Vulnerability[]
  >([]);

  useEffect(() => {
    if (isOpen && scanId) {
      fetchScanResults();
    }
  }, [isOpen, scanId]);

  const fetchScanResults = async () => {
    if (!scanId) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      // Use the detailed endpoint to get both file results and vulnerabilities
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
        console.log("Detailed scan data:", data);

        // Set vulnerabilities
        setVulnerabilities(data.vulnerabilities || []);

        // Extract file results from the response
        let extractedFileResults: FileStatus[] = [];

        if (data.file_results && Array.isArray(data.file_results)) {
          // Direct file_results array
          extractedFileResults = data.file_results;
        } else if (data.scan?.scan_metadata?.file_scan_results) {
          // From scan metadata
          const metadataResults = data.scan.scan_metadata.file_scan_results;
          extractedFileResults = metadataResults.map((file: any) => ({
            file_path: file.file_path,
            status: file.status,
            reason: file.reason,
            vulnerability_count: file.vulnerabilities
              ? file.vulnerabilities.length
              : 0,
            file_size: file.file_size,
          }));
        }

        // If we still don't have file results, try to construct them from vulnerabilities
        if (
          extractedFileResults.length === 0 &&
          data.vulnerabilities?.length > 0
        ) {
          const filePathsWithVulns = new Set(
            data.vulnerabilities.map((v: Vulnerability) => v.file_path)
          );

          extractedFileResults = Array.from(filePathsWithVulns).map(
            (filePath) => ({
              file_path: filePath,
              status: "vulnerable" as const,
              reason: "Vulnerabilities detected in this file",
              vulnerability_count: data.vulnerabilities.filter(
                (v: Vulnerability) => v.file_path === filePath
              ).length,
              file_size: undefined,
            })
          );
        }

        console.log(`Found ${extractedFileResults.length} file results`);
        setFileResults(extractedFileResults);
      } else {
        const errorText = await response.text();
        setError(
          `Failed to fetch scan results: ${response.status} ${response.statusText}`
        );
        console.error("API Error:", errorText);
      }
    } catch (error) {
      console.error("Error fetching scan results:", error);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, vulnerabilityCount: number) => {
    switch (status) {
      case "scanned":
        return vulnerabilityCount === 0 ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-orange-500" />
        );
      case "vulnerable":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "skipped":
        return <Clock className="w-4 h-4 text-gray-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (
    status: string,
    vulnerabilityCount: number,
    reason: string
  ) => {
    switch (status) {
      case "scanned":
        if (vulnerabilityCount === 0) {
          return { text: "Scan OK", color: "text-green-500 font-semibold" };
        } else {
          return {
            text: "Vulnerabilities Found",
            color: "text-red-600 font-medium",
          };
        }
      case "vulnerable":
        return {
          text: "Vulnerabilities Found",
          color: "text-red-500 font-semibold",
        };
      case "skipped":
        return {
          text: "Did not scan due to API constraints",
          color: "text-gray-500",
        };
      case "error":
        return {
          text: "Scan Failed",
          color: "text-red-500",
        };
      default:
        return {
          text: reason || "Unknown status",
          color: "text-gray-500",
        };
    }
  };

  const getStatusBadge = (status: string, vulnerabilityCount: number) => {
    if (status === "scanned" && vulnerabilityCount === 0) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Clean
        </Badge>
      );
    } else if (
      status === "vulnerable" ||
      (status === "scanned" && vulnerabilityCount > 0)
    ) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Vulnerable
        </Badge>
      );
    } else if (status === "skipped") {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          Skipped
        </Badge>
      );
    } else if (status === "error") {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
        Unknown
      </Badge>
    );
  };

  const handleViewFileDetails = (filePath: string) => {
    const fileVulns = vulnerabilities.filter((v) => v.file_path === filePath);
    setFileVulnerabilities(fileVulns);
    setSelectedFile(filePath);
  };

  const filteredFiles = fileResults.filter((file) => {
    const matchesSearch = file.file_path
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const exportResults = () => {
    const csvContent = [
      ["File Path", "Status", "Vulnerabilities", "Reason", "File Size"].join(
        ","
      ),
      ...filteredFiles.map((file) =>
        [
          file.file_path,
          file.status,
          file.vulnerability_count,
          `"${file.reason}"`,
          file.file_size || 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repositoryName}_scan_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: fileResults.length,
    scanned: fileResults.filter((f) => f.status === "scanned").length,
    vulnerable: fileResults.filter(
      (f) =>
        f.status === "vulnerable" ||
        (f.status === "scanned" && f.vulnerability_count > 0)
    ).length,
    skipped: fileResults.filter((f) => f.status === "skipped").length,
    errors: fileResults.filter((f) => f.status === "error").length,
  };

  // Calculate clean files correctly (scanned files without vulnerabilities)
  const cleanFiles = fileResults.filter(
    (f) => f.status === "scanned" && f.vulnerability_count === 0
  ).length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText size={20} />
              <span>File Scan Results - {repositoryName}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading scan results...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={fetchScanResults} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.total}
                      </div>
                      <div className="text-sm text-gray-600">Total Files</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-green-600">
                        {cleanFiles}
                      </div>
                      <div className="text-sm text-gray-600">Clean</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-red-600">
                        {stats.vulnerable}
                      </div>
                      <div className="text-sm text-gray-600">Vulnerable</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-gray-600">
                        {stats.skipped}
                      </div>
                      <div className="text-sm text-gray-600">Skipped</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.errors}
                      </div>
                      <div className="text-sm text-gray-600">Errors</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scanned">Scanned</SelectItem>
                      <SelectItem value="vulnerable">Vulnerable</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={exportResults} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Results Table */}
                <div className="flex-1 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Path</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Vulnerabilities</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="text-gray-500">
                              {fileResults.length === 0
                                ? "No scan results found"
                                : "No files match your filters"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFiles.map((file, index) => {
                          const statusInfo = getStatusText(
                            file.status,
                            file.vulnerability_count,
                            file.reason
                          );
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm max-w-xs">
                                <div
                                  className="truncate"
                                  title={file.file_path}
                                >
                                  {file.file_path}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(
                                    file.status,
                                    file.vulnerability_count
                                  )}
                                  {getStatusBadge(
                                    file.status,
                                    file.vulnerability_count
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={statusInfo.color}>
                                  {statusInfo.text}
                                </span>
                              </TableCell>
                              <TableCell>
                                {file.vulnerability_count > 0 ? (
                                  <Badge variant="destructive">
                                    {file.vulnerability_count}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {file.file_size
                                  ? `${(file.file_size / 1024).toFixed(1)} KB`
                                  : "Unknown"}
                              </TableCell>
                              <TableCell>
                                {file.vulnerability_count > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleViewFileDetails(file.file_path)
                                    }
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* File Details Modal */}
<Dialog open={!! selectedFile} onOpenChange={() => setSelectedFile(null)}>
  <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col theme-card">
    <DialogHeader>
      <DialogTitle className="flex items-center space-x-2 theme-text">
        <FileText className="w-5 h-5 text-blue-400" />
        <span>Vulnerabilities in {selectedFile}</span>
      </DialogTitle>
    </DialogHeader>
    <div className="flex-1 overflow-y-auto">
      {fileVulnerabilities.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="theme-text-muted">
            No vulnerabilities found in this file
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fileVulnerabilities.map((vuln, index) => (
            <Card key={index} className="overflow-hidden theme-card border theme-border">
              <CardHeader className="theme-bg-subtle border-b theme-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2 theme-text">
                      <span>{vuln.title}</span>
                    </CardTitle>
                    <CardDescription className="mt-2 theme-text-muted">
                      {vuln.line_number && (
                        <span className="inline-flex items-center text-sm">
                          <Code className="w-4 h-4 mr-1" />
                          Line {vuln.line_number}
                        </span>
                      )}
                      {vuln.line_number && vuln.category && <span className="mx-2">•</span>}
                      {vuln.category && <span className="text-sm">{vuln.category}</span>}
                      {vuln.risk_score && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-sm font-medium">
                            Risk Score: {vuln.risk_score}/10
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={getSeverityColor(vuln.severity)}>
                    {vuln.severity. toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Description - Theme Aware */}
                  <div>
                    <h4 className="font-semibold text-sm theme-text mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-400" />
                      Description
                    </h4>
                    <p className="text-sm theme-text bg-orange-500/10 p-3 rounded border border-orange-500/20">
                      {vuln.description}
                    </p>
                  </div>

                  {/* Code Snippet - Theme Aware Dark Code Block */}
                  {vuln.code_snippet && (
                    <div>
                      <h4 className="font-semibold text-sm theme-text mb-2 flex items-center">
                        <Code className="w-4 h-4 mr-2 text-blue-400" />
                        Code Snippet
                      </h4>
                      <div className="relative">
                        <pre className="bg-gray-900 dark:bg-black/40 text-gray-100 dark:text-gray-300 p-4 rounded-lg text-xs overflow-x-auto border border-gray-700 dark:border-white/10 font-mono leading-relaxed">
                          <code className="text-gray-100 dark:text-gray-300">{vuln.code_snippet}</code>
                        </pre>
                        {vuln.line_number && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Line {vuln.line_number}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommendation - Theme Aware */}
                  <div>
                    <h4 className="font-semibold text-sm theme-text mb-2 flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-green-400" />
                      Recommendation
                    </h4>
                    <p className="text-sm theme-text bg-green-500/10 p-3 rounded border border-green-500/20">
                      {vuln.recommendation}
                    </p>
                  </div>

                  {/* Additional Info - Theme Aware */}
                  <div className="pt-3 border-t theme-border">
                    <div className="grid grid-cols-2 gap-4 text-xs theme-text-muted">
                      <div>
                        <span className="font-medium">Category:</span>{" "}
                        <span className="theme-text">{vuln.category}</span>
                      </div>
                      {vuln.risk_score && (
                        <div>
                          <span className="font-medium">Risk Score:</span>{" "}
                          <span className={`font-bold ${
                            vuln.risk_score >= 7 ? 'text-red-400' :
                            vuln.risk_score >= 4 ? 'text-orange-400' :
                            'text-yellow-400'
                          }`}>
                            {vuln.risk_score}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
    </>
  );
};

export default FileScanStatus;
