// Updated: frontend/src/components/SimpleScanDetailsModal.tsx - Fix PDF export

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

  const exportReportAsPDF = async () => {
  if (!scanDetails) return;

  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/scans/${scanId}/report/pdf?report_type=executive`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security-report-${repositoryName}-${scanDetails.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Fallback to old method if API fails
      console.warn("PDF API not available, using fallback method");
      exportReportAsPDFLegacy();
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Fallback to old method
    exportReportAsPDFLegacy();
  }
};

  // Fixed PDF export function - this was the missing piece!
  const exportReportAsPDFLegacy = () => {
    if (!scanDetails) return;

    // Create a new window with the report content
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("Pop-up blocked. Please allow pop-ups to export PDF.");
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Security Scan Report - ${repositoryName}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        .header h1 {
            color: #1f2937;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 5px 0;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 20px;
            font-size: 22px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        .stat-card {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            line-height: 1;
        }
        .stat-label {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .critical { color: #dc2626; }
        .high { color: #ea580c; }
        .medium { color: #d97706; }
        .low { color: #64748b; }
        .green { color: #059669; }
        .blue { color: #0284c7; }
        .vulnerability {
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .vuln-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        .vuln-title {
            font-weight: bold;
            color: #1f2937;
            font-size: 18px;
            margin-bottom: 6px;
        }
        .vuln-meta {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 12px;
        }
        .vuln-description {
            margin-bottom: 15px;
            color: #374151;
        }
        .vuln-recommendation {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin-top: 15px;
            border-radius: 0 6px 6px 0;
        }
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-critical {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
        .badge-high {
            background: #fed7aa;
            color: #9a3412;
            border: 1px solid #fdba74;
        }
        .badge-medium {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fcd34d;
        }
        .badge-low {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #cbd5e1;
        }
        .alert {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .alert-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 8px;
            font-size: 16px;
        }
        .scan-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-label {
            color: #6b7280;
            font-weight: 500;
        }
        .info-value {
            font-weight: bold;
            color: #1f2937;
        }
        .recommendations {
            background: #eff6ff;
            border-radius: 8px;
            padding: 25px;
            border: 1px solid #3b82f6;
        }
        .recommendations h3 {
            color: #1e40af;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .recommendations ol {
            color: #374151;
            line-height: 1.6;
        }
        .recommendations li {
            margin-bottom: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; margin-bottom: 20px; }
            .vulnerability { page-break-inside: avoid; margin-bottom: 15px; }
            .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Security Scan Report</h1>
        <div class="subtitle"><strong>Repository:</strong> ${repositoryName}</div>
        <div class="subtitle"><strong>Scan ID:</strong> ${scanDetails.id}</div>
        <div class="subtitle"><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
    </div>

    <div class="section">
        <h2>📊 Scan Overview</h2>
        <div class="scan-info">
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span class="info-value">${scanDetails.status.toUpperCase()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${
                      scanDetails.scan_duration || "N/A"
                    }</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Files Scanned:</span>
                    <span class="info-value">${
                      scanDetails.total_files_scanned
                    }</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Security Score:</span>
                    <span class="info-value">${
                      scanDetails.security_score?.toFixed(1) || "N/A"
                    }/100</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Started:</span>
                    <span class="info-value">${new Date(
                      scanDetails.started_at
                    ).toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Completed:</span>
                    <span class="info-value">${
                      scanDetails.completed_at
                        ? new Date(scanDetails.completed_at).toLocaleString()
                        : "N/A"
                    }</span>
                </div>
            </div>
        </div>
        ${
          scanDetails.scan_metadata?.scan_stopped_reason ===
          "vulnerability_limit_reached"
            ? `
        <div class="alert">
            <div class="alert-title">⚠️ Scan Limited</div>
            <p>Scan stopped due to token constraints. ${scanDetails.scan_metadata.files_skipped} files were not scanned for complete coverage.</p>
        </div>
        `
            : ""
        }
    </div>

    <div class="section">
        <h2>🎯 Vulnerability Summary</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number critical">${
                  scanDetails.critical_count
                }</div>
                <div class="stat-label">Critical</div>
            </div>
            <div class="stat-card">
                <div class="stat-number high">${scanDetails.high_count}</div>
                <div class="stat-label">High</div>
            </div>
            <div class="stat-card">
                <div class="stat-number medium">${
                  scanDetails.medium_count
                }</div>
                <div class="stat-label">Medium</div>
            </div>
            <div class="stat-card">
                <div class="stat-number low">${scanDetails.low_count}</div>
                <div class="stat-label">Low</div>
            </div>
        </div>
    </div>

    ${
      scanDetails.vulnerabilities.length > 0
        ? `
    <div class="section">
        <h2>🚨 Vulnerabilities Found (${scanDetails.total_vulnerabilities})</h2>
        ${scanDetails.vulnerabilities
          .map(
            (vuln) => `
        <div class="vulnerability">
            <div class="vuln-header">
                <div>
                    <div class="vuln-title">${vuln.title}</div>
                    <div class="vuln-meta">
                        📁 ${vuln.file_path}${
              vuln.line_number ? ` (Line ${vuln.line_number})` : ""
            }
                        • Category: ${vuln.category}
                        ${
                          vuln.risk_score
                            ? ` • Risk Score: ${vuln.risk_score.toFixed(1)}/10`
                            : ""
                        }
                    </div>
                </div>
                <span class="badge badge-${vuln.severity}">${
              vuln.severity
            }</span>
            </div>
            <div class="vuln-description">${vuln.description}</div>
            <div class="vuln-recommendation">
                <strong>💡 Recommendation:</strong> ${vuln.recommendation}
            </div>
        </div>
        `
          )
          .join("")}
    </div>
    `
        : `
    <div class="section">
        <h2>✅ No Vulnerabilities Found</h2>
        <div style="text-align: center; color: #059669; font-size: 18px; padding: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
            <p><strong>Excellent!</strong> This scan didn't find any security vulnerabilities in the scanned files.</p>
        </div>
    </div>
    `
    }

    <div class="section">
        <div class="recommendations">
            <h3>📋 Recommendations & Next Steps</h3>
            ${
              scanDetails.critical_count > 0
                ? `
            <p><strong>🔴 Critical Priority:</strong> ${scanDetails.critical_count} critical vulnerabilities require immediate attention.</p>
            `
                : ""
            }
            ${
              scanDetails.high_count > 0
                ? `
            <p><strong>🟠 High Priority:</strong> ${scanDetails.high_count} high-severity vulnerabilities should be addressed soon.</p>
            `
                : ""
            }
            ${
              scanDetails.scan_metadata?.scan_stopped_reason ===
              "vulnerability_limit_reached"
                ? `
            <p><strong>⚠️ Complete Coverage:</strong> Consider running additional targeted scans on the remaining ${scanDetails.scan_metadata.files_skipped} files for complete coverage.</p>
            `
                : ""
            }
            <p><strong>📈 Security Improvement:</strong> Current score: ${
              scanDetails.security_score?.toFixed(1) || "N/A"
            }/100. Focus on fixing high-impact vulnerabilities to improve this score.</p>
            
            <h4>Action Items:</h4>
            <ol>
                <li>Review and prioritize vulnerabilities by severity level</li>
                <li>Implement fixes for critical and high-severity issues first</li>
                <li>Update dependencies and libraries to latest secure versions</li>
                ${
                  scanDetails.scan_metadata?.scan_stopped_reason ===
                  "vulnerability_limit_reached"
                    ? "<li>Run additional scans on remaining files for complete coverage</li>"
                    : ""
                }
                <li>Run another scan after implementing fixes to verify improvements</li>
                <li>Consider implementing automated security scanning in your CI/CD pipeline</li>
            </ol>
        </div>
    </div>

    <div class="footer">
        <p><strong>SecureThread Security Scanner</strong></p>
        <p>Report generated on ${new Date().toLocaleString()}</p>
        <p>This report contains sensitive security information. Handle with care.</p>
    </div>
</body>
</html>`;

    reportWindow.document.write(htmlContent);
    reportWindow.document.close();

    // Wait for content to load, then trigger print dialog
    setTimeout(() => {
      reportWindow.print();
      // Don't close the window automatically - let user decide
    }, 1000);
  };

  // This was the main issue - the exportReport function was calling the old JSON export
  const exportReport = () => {
    exportReportAsPDF(); // Call the PDF function, not JSON!
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
