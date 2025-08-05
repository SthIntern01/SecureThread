// Create: frontend/src/components/SimpleScanDetailsModal.tsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  X,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Vulnerability {
  id: number;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  file_path: string;
  line_number?: number;
  recommendation: string;
  risk_score?: number;
}

interface ScanDetails {
  id: number;
  status: string;
  started_at: string;
  completed_at?: string;
  total_files_scanned: number;
  scan_duration?: string;
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
    scan_stopped_reason: string;
  };
}

interface SimpleScanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanId: number | null;
  repositoryName: string;
}

const SimpleScanDetailsModal: React.FC<SimpleScanDetailsModalProps> = ({
  isOpen,
  onClose,
  scanId,
  repositoryName,
}) => {
  const [scanDetails, setScanDetails] = useState<ScanDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      // If detailed endpoint fails, try the basic scan endpoint
      if (!response.ok) {
        response = await fetch(
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
      }

      if (response.ok) {
        const data = await response.json();

        // Handle both detailed and basic response formats
        if (data.scan) {
          // Detailed response format
          setScanDetails({
            ...data.scan,
            vulnerabilities: data.vulnerabilities || [],
          });
        } else {
          // Basic response format - fetch vulnerabilities separately
          setScanDetails(data);

          // Fetch vulnerabilities separately
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
            setScanDetails((prev) =>
              prev ? { ...prev, vulnerabilities: vulnData } : null
            );
          }
        }
      } else {
        setError(`Failed to fetch scan details (${response.status})`);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportReport = () => {
    if (!scanDetails) return;

    const report = {
      repository: repositoryName,
      scan: {
        id: scanDetails.id,
        status: scanDetails.status,
        started_at: scanDetails.started_at,
        completed_at: scanDetails.completed_at,
        duration: scanDetails.scan_duration,
      },
      summary: {
        total_vulnerabilities: scanDetails.total_vulnerabilities,
        critical: scanDetails.critical_count,
        high: scanDetails.high_count,
        medium: scanDetails.medium_count,
        low: scanDetails.low_count,
        security_score: scanDetails.security_score,
        code_coverage: scanDetails.code_coverage,
      },
      vulnerabilities: scanDetails.vulnerabilities,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-scan-${repositoryName}-${scanDetails.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <span>Security Scan Report - {repositoryName}</span>
          </DialogTitle>
          <DialogDescription>
            Detailed security analysis results for this repository
          </DialogDescription>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportReport}
              disabled={!scanDetails}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading scan details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchScanDetails} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : scanDetails ? (
          <div className="flex-1 overflow-auto space-y-6">
            {/* Scan Status */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge className={getStatusColor(scanDetails.status)}>
                    {scanDetails.status.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {scanDetails.scan_duration || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {scanDetails.total_files_scanned}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Files Scanned
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {scanDetails.security_score?.toFixed(1) || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Security Score
                  </div>
                </div>
              </div>
            </div>

            {/* Scan Limits Alert */}
            {scanDetails.scan_metadata?.scan_stopped_reason ===
              "vulnerability_limit_reached" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">
                      Scan Limited
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Scan stopped due to token constraints.{" "}
                      {scanDetails.scan_metadata.files_skipped} files were not
                      scanned.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vulnerability Summary */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">
                Vulnerability Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {scanDetails.critical_count}
                  </div>
                  <div className="text-sm text-red-700">Critical</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {scanDetails.high_count}
                  </div>
                  <div className="text-sm text-orange-700">High</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {scanDetails.medium_count}
                  </div>
                  <div className="text-sm text-yellow-700">Medium</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {scanDetails.low_count}
                  </div>
                  <div className="text-sm text-gray-700">Low</div>
                </div>
              </div>
            </div>

            {/* Vulnerabilities List */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">
                Vulnerabilities ({scanDetails.total_vulnerabilities})
              </h3>
              {scanDetails.vulnerabilities.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    No Vulnerabilities Found
                  </h4>
                  <p className="text-gray-600">
                    Great! This scan didn't find any security vulnerabilities.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanDetails.vulnerabilities.map((vuln) => (
                    <div
                      key={vuln.id}
                      className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {vuln.title}
                            </h4>
                            <Badge
                              className={`text-xs ${getSeverityColor(
                                vuln.severity
                              )}`}
                            >
                              {vuln.severity}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            📁 {vuln.file_path}
                            {vuln.line_number && ` (Line ${vuln.line_number})`}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {vuln.description}
                          </p>
                          <p className="text-sm text-blue-700">
                            <strong>Fix:</strong> {vuln.recommendation}
                          </p>
                        </div>
                        {vuln.risk_score && (
                          <div className="text-right ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              Risk: {vuln.risk_score.toFixed(1)}/10
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scan Timeline */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Scan Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    Started: {new Date(scanDetails.started_at).toLocaleString()}
                  </span>
                </div>
                {scanDetails.completed_at && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      Completed:{" "}
                      {new Date(scanDetails.completed_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default SimpleScanDetailsModal;
