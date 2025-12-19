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
  file_size?:  number;
}

interface Vulnerability {
  id: number;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  file_path: string;
  line_number?:  number;
  code_snippet?: string;
  recommendation:  string;
  risk_score?:  number;
}

interface FileScanStatusProps {
  scanId: number | null;
  repositoryName: string;
  isOpen: boolean;
  onClose: () => void;
}

const FileScanStatus:  React.FC<FileScanStatusProps> = ({
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
  const [fileVulnerabilities, setFileVulnerabilities] = useState<Vulnerability[]>([]);

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

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/scans/${scanId}/detailed`,
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

        setVulnerabilities(data.vulnerabilities || []);

        let extractedFileResults: FileStatus[] = [];

        if (data.file_results && Array.isArray(data.file_results)) {
          extractedFileResults = data.file_results;
        } else if (data. scan?. scan_metadata?.file_scan_results) {
          const metadataResults = data.scan. scan_metadata.file_scan_results;
          extractedFileResults = metadataResults.map((file: any) => ({
            file_path: file.file_path,
            status: file.status,
            reason: file.reason,
            vulnerability_count: file.vulnerabilities ?  file.vulnerabilities.length : 0,
            file_size:  file.file_size,
          }));
        }

        if (extractedFileResults.length === 0 && data.vulnerabilities?. length > 0) {
          const filePathsWithVulns = new Set(
            data.vulnerabilities.map((v:  Vulnerability) => v.file_path)
          );

          extractedFileResults = Array.from(filePathsWithVulns).map((filePath) => ({
            file_path: filePath,
            status: "vulnerable" as const,
            reason: "Vulnerabilities detected in this file",
            vulnerability_count: data.vulnerabilities.filter(
              (v: Vulnerability) => v.file_path === filePath
            ).length,
            file_size: undefined,
          }));
        }

        console.log(`Found ${extractedFileResults.length} file results`);
        setFileResults(extractedFileResults);
      } else {
        const errorText = await response.text();
        setError(`Failed to fetch scan results: ${response.status} ${response.statusText}`);
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
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-500" />
        );
      case "vulnerable":
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-500" />;
      case "skipped":
        return <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusText = (status: string, vulnerabilityCount: number, reason: string) => {
    switch (status) {
      case "scanned":
        if (vulnerabilityCount === 0) {
          return { 
            text: "Scan OK", 
            color: "text-green-600 dark:text-green-500 font-semibold" 
          };
        } else {
          return {
            text: "Vulnerabilities Found",
            color: "text-red-600 dark:text-red-400 font-medium",
          };
        }
      case "vulnerable":
        return {
          text: "Vulnerabilities Found",
          color: "text-red-600 dark:text-red-500 font-semibold",
        };
      case "skipped":
        return {
          text: "Did not scan due to API constraints",
          color: "text-gray-600 dark:text-gray-500",
        };
      case "error":
        return {
          text: "Scan Failed",
          color: "text-red-600 dark:text-red-500",
        };
      default: 
        return {
          text: reason || "Unknown status",
          color: "text-gray-600 dark:text-gray-500",
        };
    }
  };

  const getStatusBadge = (status: string, vulnerabilityCount:  number) => {
    if (status === "scanned" && vulnerabilityCount === 0) {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30">
          Clean
        </Badge>
      );
    } else if (status === "vulnerable" || (status === "scanned" && vulnerabilityCount > 0)) {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30">
          Vulnerable
        </Badge>
      );
    } else if (status === "skipped") {
      return (
        <Badge className="bg-gray-50 text-gray-700 border-gray-200 dark: bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30">
          Skipped
        </Badge>
      );
    } else if (status === "error") {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30">
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30">
        Unknown
      </Badge>
    );
  };

  const handleViewFileDetails = (filePath: string) => {
    const fileVulns = vulnerabilities.filter((v) => v.file_path === filePath);
    setFileVulnerabilities(fileVulns);
    setSelectedFile(filePath);
  };

  const filteredFiles = fileResults. filter((file) => {
    const matchesSearch = file.file_path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": 
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30";
      case "high": 
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30";
      case "medium": 
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30";
      case "low": 
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30";
      default: 
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30";
    }
  };

  const exportResults = () => {
    const csvContent = [
      ["File Path", "Status", "Vulnerabilities", "Reason", "File Size"]. join(","),
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
    const a = document. createElement("a");
    a.href = url;
    a. download = `${repositoryName}_scan_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: fileResults.length,
    scanned: fileResults.filter((f) => f.status === "scanned").length,
    vulnerable: fileResults.filter(
      (f) => f.status === "vulnerable" || (f.status === "scanned" && f.vulnerability_count > 0)
    ).length,
    skipped: fileResults.filter((f) => f.status === "skipped").length,
    errors: fileResults.filter((f) => f.status === "error").length,
  };

  const cleanFiles = fileResults.filter(
    (f) => f.status === "scanned" && f.vulnerability_count === 0
  ).length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <FileText size={20} className="text-[#003D6B] dark:text-orange-500" />
              <span>File Scan Results - {repositoryName}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4 p-6">
            {loading ?  (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003D6B] dark:border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-white/70">Loading scan results...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <Button 
                    onClick={fetchScanResults} 
                    variant="outline" 
                    className="border-gray-300 dark:border-white/20 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md: grid-cols-5 gap-4 mb-4">
                  <Card className="bg-white dark:bg-white/10 border-gray-200 dark:border-white/20">
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-white/70">Total Files</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-white/10 border-gray-200 dark:border-white/20">
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {cleanFiles}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-white/70">Clean</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-white/10 border-gray-200 dark:border-white/20">
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats.vulnerable}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-white/70">Vulnerable</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-white/10 border-gray-200 dark:border-white/20">
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {stats.skipped}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-white/70">Skipped</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-white/10 border-gray-200 dark:border-white/20">
                    <CardContent className="p-3">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.errors}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-white/70">Errors</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white placeholder: text-gray-500 dark:placeholder:text-white/50"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48 bg-white dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-white/20">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scanned">Scanned</SelectItem>
                      <SelectItem value="vulnerable">Vulnerable</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={exportResults} 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-300 dark:border-white/20 text-gray-700 dark:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Results Table */}
                <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-white/20 rounded-lg bg-white dark:bg-transparent">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                        <TableHead className="text-gray-900 dark:text-white font-semibold">File Path</TableHead>
                        <TableHead className="text-gray-900 dark:text-white font-semibold">Status</TableHead>
                        <TableHead className="text-gray-900 dark:text-white font-semibold">Result</TableHead>
                        <TableHead className="text-gray-900 dark:text-white font-semibold">Vulnerabilities</TableHead>
                        <TableHead className="text-gray-900 dark:text-white font-semibold">Size</TableHead>
                        <TableHead className="text-gray-900 dark:text-white font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="text-gray-500 dark:text-gray-400">
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
                            <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-white/5">
                              <TableCell className="font-mono text-sm max-w-xs text-gray-900 dark:text-white">
                                <div className="truncate" title={file.file_path}>
                                  {file.file_path}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(file.status, file.vulnerability_count)}
                                  {getStatusBadge(file.status, file.vulnerability_count)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={statusInfo.color}>{statusInfo. text}</span>
                              </TableCell>
                              <TableCell>
                                {file.vulnerability_count > 0 ?  (
                                  <Badge variant="destructive" className="bg-red-500 text-white dark:bg-red-600">
                                    {file. vulnerability_count}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600 dark:text-white/70">
                                {file.file_size ?  `${(file.file_size / 1024).toFixed(1)} KB` : "Unknown"}
                              </TableCell>
                              <TableCell>
                                {file.vulnerability_count > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewFileDetails(file.file_path)}
                                    className="border-gray-300 dark:border-white/20 text-gray-700 dark:text-white hover:bg-[#003D6B] hover: text-white hover:border-[#003D6B] dark:hover:bg-orange-500 dark:hover:text-white dark:hover:border-orange-500 transition-colors"
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
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <FileText className="w-5 h-5 text-[#003D6B] dark:text-blue-400" />
              <span>Vulnerabilities in {selectedFile}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {fileVulnerabilities.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-white/70">
                  No vulnerabilities found in this file
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fileVulnerabilities.map((vuln, index) => (
                  <Card key={index} className="overflow-hidden bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20">
                    <CardHeader className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center space-x-2 text-gray-900 dark: text-white">
                            <span>{vuln.title}</span>
                          </CardTitle>
                          <CardDescription className="mt-2 text-gray-600 dark:text-white/70">
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
                        {/* Description */}
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                            Description
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-500/10 p-3 rounded border border-orange-200 dark:border-orange-500/20">
                            {vuln.description}
                          </p>
                        </div>

                        {/* Code Snippet */}
                        {vuln.code_snippet && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center">
                              <Code className="w-4 h-4 mr-2 text-[#003D6B] dark: text-blue-400" />
                              Code Snippet
                            </h4>
                            <div className="relative">
                              <pre className="bg-gray-900 dark:bg-black/40 text-gray-100 dark:text-gray-300 p-4 rounded-lg text-xs overflow-x-auto border border-gray-700 dark:border-white/10 font-mono leading-relaxed">
                                <code className="text-gray-100 dark:text-gray-300">{vuln.code_snippet}</code>
                              </pre>
                              {vuln.line_number && (
                                <div className="absolute top-2 right-2 bg-[#003D6B] dark:bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                  Line {vuln.line_number}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Recommendation */}
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                            Recommendation
                          </h4>
                          <p className="text-sm text-gray-900 dark:text-white bg-green-50 dark:bg-green-500/10 p-3 rounded border border-green-200 dark:border-green-500/20">
                            {vuln.recommendation}
                          </p>
                        </div>

                        {/* Additional Info */}
                        <div className="pt-3 border-t border-gray-200 dark:border-white/20">
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark: text-white/70">
                            <div>
                              <span className="font-medium">Category:</span>{" "}
                              <span className="text-gray-900 dark:text-white">{vuln.category}</span>
                            </div>
                            {vuln.risk_score && (
                              <div>
                                <span className="font-medium">Risk Score:</span>{" "}
                                <span
                                  className={`font-bold ${
                                    vuln.risk_score >= 7
                                      ? "text-red-600 dark:text-red-400"
                                      :  vuln.risk_score >= 4
                                      ? "text-orange-600 dark:text-orange-400"
                                      : "text-yellow-600 dark:text-yellow-400"
                                  }`}
                                >
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