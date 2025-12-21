import React from 'react';
import ComplianceScores from './ComplianceScores';
import OwaspAnalysis from './OwaspAnalysis';
import TeamMetrics from './TeamMetrics';
import { EnhancedDashboardData } from '../../types/dashboard.types';
import { Shield, AlertTriangle, CheckCircle, Users } from "lucide-react";

interface ComplianceViewProps {
  data: EnhancedDashboardData;
}

const ComplianceView: React.FC<ComplianceViewProps> = ({ data }) => {
  // Extract key metrics for summary cards
  const complianceScores = data.advancedMetrics?.complianceScores;
  const owaspAnalysis = data.advancedMetrics?.owaspAnalysis;
  const teamMetrics = data.advancedMetrics?. teamMetrics;
  
  // Calculate compliance stats
  const standards = [
    { key: 'owasp_top10', score: complianceScores?.owasp_top10 || 0, target: 85 },
    { key: 'pci_dss', score: complianceScores?. pci_dss || 0, target: 95 },
    { key: 'soc2', score: complianceScores?.soc2 || 0, target: 90 },
    { key: 'iso27001', score: complianceScores?.iso27001 || 0, target: 85 },
    { key: 'gdpr', score: complianceScores?.gdpr || 0, target: 95 }
  ];
  
  const compliantCount = standards.filter(s => s.score >= s.target).length;
  const avgCompliance = Math.round(standards.reduce((sum, s) => sum + s.score, 0) / standards.length);
  
  const owaspIssuesCount = owaspAnalysis ?  
    Object.values(owaspAnalysis).reduce((sum:  number, item: any) => sum + (item?. vulnerabilities_found || 0), 0) : 0;
  const highRiskCount = owaspAnalysis ?  
    Object.values(owaspAnalysis).filter((item: any) => item?.risk_level === 'high').length : 0;
  
  const teamPerformance = teamMetrics ?  
    Math.round(((teamMetrics.automation_level || 0) + (teamMetrics.policy_compliance || 0)) / 2) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Compliance Rate Card - Keep semantic colors */}
        <div className={`bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-4 border-l-4 ${
          compliantCount >= 4 ? 'border-l-green-500' : 
          compliantCount >= 2 ? 'border-l-yellow-500' :  'border-l-red-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Shield className={`w-5 h-5 ${
              compliantCount >= 4 ? 'text-green-600 dark:text-green-400' :
              compliantCount >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            }`} />
            <span className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wide">Compliant</span>
          </div>
          <div className={`text-3xl font-bold ${
            compliantCount >= 4 ? 'text-green-600 dark:text-green-400' : 
            compliantCount >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {compliantCount}/{standards.length}
          </div>
          <div className="text-gray-600 dark:text-white/60 text-sm mt-1">Standards met</div>
        </div>

        {/* Average Compliance Score Card - LIGHT:  Navy/semantic, DARK: Original */}
        <div className={`bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-4 border-l-4 ${
          avgCompliance >= 80 ? 'border-l-[#003D6B] dark:border-l-blue-500' :
          avgCompliance >= 60 ? 'border-l-yellow-500' : 'border-l-orange-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className={`w-5 h-5 ${
              avgCompliance >= 80 ?  'text-[#003D6B] dark:text-blue-400' :
              avgCompliance >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'
            }`} />
            <span className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wide">Avg Score</span>
          </div>
          <div className={`text-3xl font-bold ${
            avgCompliance >= 80 ? 'text-[#003D6B] dark:text-blue-400' :
            avgCompliance >= 60 ? 'text-yellow-600 dark:text-yellow-400' :  'text-orange-600 dark:text-orange-400'
          }`}>
            {avgCompliance}%
          </div>
          <div className="text-gray-600 dark: text-white/60 text-sm mt-1">Compliance rate</div>
        </div>

        {/* OWASP Issues Card - Keep semantic colors */}
        <div className={`bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-4 border-l-4 ${
          highRiskCount === 0 ? 'border-l-green-500' : 
          highRiskCount <= 2 ? 'border-l-yellow-500' : 'border-l-red-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className={`w-5 h-5 ${
              highRiskCount === 0 ? 'text-green-600 dark:text-green-400' :
              highRiskCount <= 2 ? 'text-yellow-600 dark: text-yellow-400' : 'text-red-600 dark:text-red-400'
            }`} />
            <span className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wide">OWASP</span>
          </div>
          <div className={`text-3xl font-bold ${
            owaspIssuesCount === 0 ? 'text-green-600 dark:text-green-400' :
            owaspIssuesCount < 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {owaspIssuesCount}
          </div>
          <div className="text-gray-600 dark:text-white/60 text-sm mt-1">
            {highRiskCount} high risk
          </div>
        </div>

        {/* Team Performance Card - LIGHT: Navy/semantic, DARK: Original */}
        <div className={`bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-4 border-l-4 ${
          teamPerformance >= 80 ? 'border-l-[#003D6B] dark:border-l-purple-500' :
          teamPerformance >= 60 ? 'border-l-blue-500' : 'border-l-orange-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Users className={`w-5 h-5 ${
              teamPerformance >= 80 ? 'text-[#003D6B] dark:text-purple-400' : 
              teamPerformance >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
            }`} />
            <span className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wide">Team</span>
          </div>
          <div className={`text-3xl font-bold ${
            teamPerformance >= 80 ? 'text-[#003D6B] dark:text-purple-400' :
            teamPerformance >= 60 ?  'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {teamPerformance}%
          </div>
          <div className="text-gray-600 dark:text-white/60 text-sm mt-1">Performance score</div>
        </div>
      </div>

      {/* Main Content Grid - Compliance Scores & OWASP side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ComplianceScores data={data} />
        <OwaspAnalysis data={data} />
      </div>

      {/* Team Metrics - Full Width */}
      <div className="w-full">
        <TeamMetrics data={data} />
      </div>
    </div>
  );
};

export default ComplianceView;
