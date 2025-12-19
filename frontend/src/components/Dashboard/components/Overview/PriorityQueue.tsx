import React from 'react';
import { TrendingUp, Shield } from "lucide-react";
import { EnhancedDashboardData, Repository } from '../../types/dashboard. types';

interface PriorityQueueProps {
  data:  EnhancedDashboardData;
  selectedRepository: number | 'all';
  repositories: Repository[];
}

const PriorityQueue:  React.FC<PriorityQueueProps> = ({ data, selectedRepository, repositories }) => {
  return (
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-[#2D5FFF] dark:text-accent" />
        Priority Actions
      </h3>
      
      <div className="bg-white border border-gray-200 dark: bg-black/10 dark: border-white/10 rounded-lg p-4 space-y-4">
        {/* Critical Issues - Keep red (semantic) */}
        {data.criticalIssues > 0 && (
          <div className="border-l-4 border-red-500 pl-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-600 dark:text-red-300 font-medium text-sm">Critical Security Issues</span>
              <span className="text-gray-500 dark:text-white/50 text-xs">Immediate</span>
            </div>
            <p className="text-gray-600 dark:text-white/60 text-xs">
              {data.criticalIssues} critical vulnerabilities require immediate attention
              {data.customScanStats.customScanCritical > 0 && (
                <span className="text-[#2D5FFF] dark:text-purple-300 ml-1">
                  ({data.customScanStats.customScanCritical} from custom rules)
                </span>
              )}
            </p>
          </div>
        )}
        
        {/* Technical Debt - Keep yellow (semantic) */}
        {data.advancedMetrics?.technicalDebtDetailed && data.advancedMetrics.technicalDebtDetailed.priorityRecommendation === 'high' && (
          <div className="border-l-4 border-yellow-500 pl-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-600 dark: text-yellow-300 font-medium text-sm">High Technical Debt</span>
              <span className="text-gray-500 dark:text-white/50 text-xs">This Week</span>
            </div>
            <p className="text-gray-600 dark:text-white/60 text-xs">
              ${Math.round(data.advancedMetrics.technicalDebtDetailed.totalDebtCost / 1000)}k in technical debt detected
              • {Math.round(data.advancedMetrics.technicalDebtDetailed.estimatedSprintImpact)} sprint impact
            </p>
          </div>
        )}

        {/* Compliance - LIGHT: Accent blue, DARK: Orange */}
        {data.advancedMetrics?.complianceScores && Object.values(data.advancedMetrics.complianceScores).some(score => score < 80) && (
          <div className="border-l-4 border-[#2D5FFF] dark:border-orange-400 pl-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#2D5FFF] dark: text-orange-300 font-medium text-sm">Compliance Gaps</span>
              <span className="text-gray-500 dark:text-white/50 text-xs">Review</span>
            </div>
            <p className="text-gray-600 dark:text-white/60 text-xs">
              Multiple compliance standards need attention
            </p>
          </div>
        )}
        
        {/* Active Scans - LIGHT: Primary blue, DARK:  Blue */}
        {data. activeScanningProjects > 0 && (
          <div className="border-l-4 border-[#004E89] dark:border-blue-400 pl-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#004E89] dark:text-blue-300 font-medium text-sm">Active Scans</span>
              <span className="text-gray-500 dark:text-white/50 text-xs">Running</span>
            </div>
            <p className="text-gray-600 dark:text-white/60 text-xs">
              {data.activeScanningProjects} scan{data.activeScanningProjects !== 1 ? 's' :  ''} in progress
              {data.customScanStats. activeCustomScans > 0 && (
                <span className="text-[#2D5FFF] dark:text-purple-300 ml-1">
                  ({data.customScanStats. activeCustomScans} custom)
                </span>
              )}
            </p>
          </div>
        )}
        
        {/* Security Monitoring - Keep green (semantic) */}
        <div className="border-l-4 border-green-500 pl-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-600 dark:text-green-300 font-medium text-sm">Security Monitoring</span>
            <span className="text-gray-500 dark:text-white/50 text-xs">Active</span>
          </div>
          <p className="text-gray-600 dark:text-white/60 text-xs">
            {data.totalProjects === 0 
              ? 'Ready to monitor your repositories'
              : `Monitoring ${data.totalProjects} repositories continuously`
            }
          </p>
        </div>

        {/* Getting Started - LIGHT: Primary blue, DARK: Blue */}
        {data.totalProjects === 0 && (
          <div className="mt-4 p-3 bg-[#D6E6FF] border border-[#004E89]/20 dark:bg-blue-500/10 dark:border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-[#004E89] dark:text-blue-400" />
              <span className="text-[#004E89] dark:text-blue-300 text-sm font-medium">Getting Started</span>
            </div>
            <p className="text-gray-700 dark:text-white/70 text-xs">
              Connect repositories to unlock advanced security insights, compliance tracking, and technical debt analysis. 
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriorityQueue;