// Create: frontend/src/components/FileScanStatus.tsx

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

  // Replace the entire fetchScanResults function in frontend/src/components/FileScanStatus.tsx

  const fetchScanResults = async () => {
    if (!scanId) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      // Try the detailed endpoint first
      let response = await fetch(
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
        console.log("Detailed scan data:", data); // Debug log

        // Handle the response format from the detailed endpoint
        if (data.file_results && Array.isArray(data.file_results)) {
          // Direct file_results array
          setFileResults(data.file_results);
          setVulnerabilities(data.vulnerabilities || []);
          console.log(`✅ Found ${data.file_results.length} file results`);
        } else if (
          data.scan &&
          data.scan.scan_metadata &&
          data.scan.scan_metadata.file_scan_results
        ) {
          // Nested in scan.scan_metadata format
          const metadataFileResults = data.scan.scan_metadata.file_scan_results;
          const transformedResults = metadataFileResults.map((file: any) => ({
            file_path: file.file_path,
            status: file.status,
            reason: file.reason,
            vulnerability_count: file.vulnerabilities
              ? file.vulnerabilities.length
              : 0,
            file_size: file.file_size,
          }));
          setFileResults(transformedResults);
          setVulnerabilities(data.vulnerabilities || []);
          console.log(
            `✅ Found ${transformedResults.length} file results from metadata`
          );
        } else {
          // Fallback: try to get file status from basic scan endpoint
          console.log("No file_results found, trying basic scan endpoint...");
          const basicResponse = await fetch(
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

          if (basicResponse.ok) {
            const basicData = await basicResponse.json();
            console.log("Basic scan data:", basicData);

            if (
              basicData.scan_metadata &&
              basicData.scan_metadata.file_scan_results
            ) {
              const metadataResults = basicData.scan_metadata.file_scan_results;
              const transformedResults = metadataResults.map((file: any) => ({
                file_path: file.file_path,
                status: file.status,
                reason: file.reason,
                vulnerability_count: file.vulnerabilities
                  ? file.vulnerabilities.length
                  : 0,
                file_size: file.file_size,
              }));
              setFileResults(transformedResults);
              console.log(
                `✅ Found ${transformedResults.length} file results from basic endpoint`
              );
            } else {
              console.log(
                "❌ No file scan results found in basic endpoint either"
              );
              setFileResults([]);
            }

            // Get vulnerabilities separately if not already loaded
            if (!data.vulnerabilities) {
              const vulnResponse = await fetch(
                `${
                  import.meta.env.VITE_API_URL || "http://localhost:8000"
                }/api/v1/scans/${scanId}/vulnerabilities`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (vulnResponse.ok) {
                const vulnData = await vulnResponse.json();
                setVulnerabilities(vulnData || []);
                console.log(
                  `✅ Found ${vulnData?.length || 0} vulnerabilities`
                );
              }
            }
          } else {
            setError(`Failed to fetch scan results (${response.status})`);
          }
        }
      } else {
        setError(`Failed to fetch scan results (${response.status})`);
        console.error("API Error:", response.status, response.statusText);
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
          return { text: "OK", color: "text-green-500 font-semibold" };
        } else {
          return {
            text: `${vulnerabilityCount} vulnerabilities found`,
            color: "text-orange-600 font-medium",
          };
        }
      case "vulnerable":
        return {
          text: "Vulnerabilities found in this file",
          color: "text-red-500 font-semibold",
        };
      case "skipped":
        return {
          text: "Not scanned due to constraint limits",
          color: "text-gray-500",
        };
      case "error":
        return {
          text: `Error: ${reason}`,
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
        <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>
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
                        {stats.scanned - stats.vulnerable}
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
                                  : "N/A"}
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
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Vulnerabilities in {selectedFile}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {fileVulnerabilities.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  No vulnerabilities found in this file
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fileVulnerabilities.map((vuln, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{vuln.title}</CardTitle>
                        <Badge className={getSeverityColor(vuln.severity)}>
                          {vuln.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription>
                        {vuln.line_number && `Line ${vuln.line_number} • `}
                        {vuln.category}
                        {vuln.risk_score &&
                          ` • Risk Score: ${vuln.risk_score}/10`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">
                            Description
                          </h4>
                          <p className="text-sm text-gray-600">
                            {vuln.description}
                          </p>
                        </div>

                        {vuln.code_snippet && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-1">
                              Code Snippet
                            </h4>
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                              <code>{vuln.code_snippet}</code>
                            </pre>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">
                            Recommendation
                          </h4>
                          <p className="text-sm text-gray-600">
                            {vuln.recommendation}
                          </p>
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
