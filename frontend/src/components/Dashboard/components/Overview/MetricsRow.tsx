import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  FileCode, 
  Wrench, 
  Target, 
  Award 
} from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface MetricsRowProps {
  data: EnhancedDashboardData;
}

const MetricsRow: React.FC<MetricsRowProps> = ({ data }) => {
  const getSecurityScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getTechnicalDebtColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      case 'no_data': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getComplianceScore = () => {
    if (!data.advancedMetrics?.complianceScores) return null;
    const scores = Object.values(data.advancedMetrics.complianceScores);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const hasRepositories = data.totalProjects > 0;
  const hasScans = hasRepositories && (data.totalVulnerabilities > 0 || data.securityScore !== null);

  return (
    <div className="p-6 border-b theme-border">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Security Score */}
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
            data.securityScore === null 
              ? 'bg-gradient-to-br from-gray-500/20 to-gray-600/30' 
              : 'bg-gradient-to-br from-green-500/20 to-green-600/30'
          }`}>
            <Shield className={`w-8 h-8 ${data.securityScore === null ? 'text-gray-400' : 'text-green-400'}`} />
          </div>
          <div className={`text-2xl font-bold mb-1 ${getSecurityScoreColor(data.securityScore)}`}>
            {data.securityScore === null ? "N/A" : `${data.securityScore}%`}
          </div>
          <div className="text-white/70 font-medium text-sm">Security Score</div>
          {data.advancedMetrics?.teamMetrics?.securityScoreImprovement !== undefined && data.securityScore !== null && (
            <div className={`text-xs mt-1 ${data.advancedMetrics.teamMetrics.securityScoreImprovement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.advancedMetrics.teamMetrics.securityScoreImprovement >= 0 ? '+' : ''}{data.advancedMetrics.teamMetrics.securityScoreImprovement.toFixed(1)}%
            </div>
          )}
          {!hasRepositories && (
            <div className="text-xs mt-1 text-gray-400">
              No repositories
            </div>
          )}
          {hasRepositories && !hasScans && (
            <div className="text-xs mt-1 text-gray-400">
              No scans yet
            </div>
          )}
        </div>
        
        {/* Vulnerabilities */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-500/20 to-red-600/30 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mb-1">
            {data.totalVulnerabilities}
          </div>
          <div className="text-white/70 font-medium text-sm">Vulnerabilities</div>
          <div className="text-xs text-red-300 mt-1">
            {data.criticalIssues} critical
          </div>
        </div>
        
        {/* Files Scanned */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl flex items-center justify-center">
            <FileCode className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {data.advancedMetrics?.codeQualityMetrics?.total_files || 0}
          </div>
          <div className="text-white/70 font-medium text-sm">Files Scanned</div>
          <div className="text-xs text-purple-300 mt-1">
            {(data.advancedMetrics?.codeQualityMetrics?.total_lines_of_code || 0).toLocaleString()} LoC
          </div>
        </div>
        
        {/* Technical Debt */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 rounded-2xl flex items-center justify-center">
            <Wrench className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {data.advancedMetrics?.technicalDebtDetailed ? 
              Math.round(data.advancedMetrics.technicalDebtDetailed.totalDebtHours) : 0}h
          </div>
          <div className="text-white/70 font-medium text-sm">Tech Debt</div>
          <div className={`text-xs mt-1 ${getTechnicalDebtColor(data.advancedMetrics?.technicalDebtDetailed?.priorityRecommendation || 'no_data')}`}>
            {data.advancedMetrics?.technicalDebtDetailed?.priorityRecommendation === 'no_data' ? 'no data' : 
             data.advancedMetrics?.technicalDebtDetailed?.priorityRecommendation || 'low'} priority
          </div>
        </div>
        
        {/* Coverage */}
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
            data.codeCoverage === null 
              ? 'bg-gradient-to-br from-gray-500/20 to-gray-600/30' 
              : 'bg-gradient-to-br from-blue-500/20 to-blue-600/30'
          }`}>
            <Target className={`w-8 h-8 ${data.codeCoverage === null ? 'text-gray-400' : 'text-blue-400'}`} />
          </div>
          <div className={`text-2xl font-bold mb-1 ${data.codeCoverage === null ? 'text-gray-400' : 'text-blue-400'}`}>
            {data.codeCoverage === null ? "N/A" : `${data.codeCoverage}%`}
          </div>
          <div className="text-white/70 font-medium text-sm">Coverage</div>
          <div className={`text-xs mt-1 ${data.codeCoverage === null ? 'text-gray-400' : 'text-blue-300'}`}>
            Target: {data.advancedMetrics?.codeQualityMetrics?.code_coverage?.target || 80}%
          </div>
        </div>
        
        {/* Compliance */}
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
            getComplianceScore() === null 
              ? 'bg-gradient-to-br from-gray-500/20 to-gray-600/30' 
              : 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/30'
          }`}>
            <Award className={`w-8 h-8 ${getComplianceScore() === null ? 'text-gray-400' : 'text-indigo-400'}`} />
          </div>
          <div className={`text-2xl font-bold mb-1 ${getComplianceScore() === null ? 'text-gray-400' : 'text-indigo-400'}`}>
            {getComplianceScore() === null ? "N/A" : `${getComplianceScore()}%`}
          </div>
          <div className="text-white/70 font-medium text-sm">Compliance</div>
          <div className={`text-xs mt-1 ${getComplianceScore() === null ? 'text-gray-400' : 'text-indigo-300'}`}>
            {getComplianceScore() === null ? 'No data' : 'Multi-standard'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsRow;