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
  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getTechnicalDebtColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-6 border-b border-white/10">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <div className={`text-2xl font-bold mb-1 ${getSecurityScoreColor(data.securityScore)}`}>
            {data.securityScore}%
          </div>
          <div className="text-white/70 font-medium text-sm">Security Score</div>
          {data.advancedMetrics?.teamMetrics?.securityScoreImprovement !== undefined && (
            <div className={`text-xs mt-1 ${data.advancedMetrics.teamMetrics.securityScoreImprovement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.advancedMetrics.teamMetrics.securityScoreImprovement >= 0 ? '+' : ''}{data.advancedMetrics.teamMetrics.securityScoreImprovement.toFixed(1)}%
            </div>
          )}
        </div>
        
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
        
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl flex items-center justify-center">
            <FileCode className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {/* 🔧 FIX: Use the advanced metrics data */}
            {data.advancedMetrics?.codeQualityMetrics?.total_files || 0}
          </div>
          <div className="text-white/70 font-medium text-sm">Files Scanned</div>
          <div className="text-xs text-purple-300 mt-1">
            {(data.advancedMetrics?.codeQualityMetrics?.total_lines_of_code || 0).toLocaleString()} LoC
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 rounded-2xl flex items-center justify-center">
            <Wrench className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {data.advancedMetrics?.technicalDebtDetailed ? 
              Math.round(data.advancedMetrics.technicalDebtDetailed.totalDebtHours) : 0}h
          </div>
          <div className="text-white/70 font-medium text-sm">Tech Debt</div>
          <div className={`text-xs mt-1 ${getTechnicalDebtColor(data.advancedMetrics?.technicalDebtDetailed?.priorityRecommendation || 'low')}`}>
            {data.advancedMetrics?.technicalDebtDetailed?.priorityRecommendation || 'low'} priority
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center">
            <Target className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {data.codeCoverage}%
          </div>
          <div className="text-white/70 font-medium text-sm">Coverage</div>
          <div className="text-xs text-blue-300 mt-1">
            Target: {data.advancedMetrics?.codeQualityMetrics?.codeCoverage?.target || 80}%
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-500/20 to-indigo-600/30 rounded-2xl flex items-center justify-center">
            <Award className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mb-1">
            {data.advancedMetrics?.complianceScores ? 
              Math.round(Object.values(data.advancedMetrics.complianceScores).reduce((a, b) => a + b, 0) / Object.keys(data.advancedMetrics.complianceScores).length) : 
              100}%
          </div>
          <div className="text-white/70 font-medium text-sm">Compliance</div>
          <div className="text-xs text-indigo-300 mt-1">
            Multi-standard
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsRow;