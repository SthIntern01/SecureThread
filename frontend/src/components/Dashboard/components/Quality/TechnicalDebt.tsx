import React from 'react';
import { Wrench, Clock, TrendingUp, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface TechnicalDebtProps {
  data: EnhancedDashboardData;
}

const TechnicalDebt:  React.FC<TechnicalDebtProps> = ({ data }) => {
  const advancedDebt = data.advancedMetrics?. technicalDebtDetailed;
  
  if (!advancedDebt) {
    return (
      <div className="bg-white border border-gray-200 dark: bg-black/10 dark: border-white/10 rounded-lg p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4 flex items-center">
          <Wrench className="w-5 h-5 mr-2 text-[#003D6B] dark:text-white" />
          Technical Debt Analysis
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-white/60">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-white/40" />
          <p>No technical debt data available</p>
          <p className="text-xs mt-2">Debt metrics will appear after scans</p>
        </div>
      </div>
    );
  }

  const priorityColors = {
    critical: { 
      bg: 'bg-red-50 dark:bg-red-500/20', 
      text:  'text-red-700 dark:text-red-300', 
      border: 'border-red-500' 
    },
    high:  { 
      bg: 'bg-orange-50 dark:bg-orange-500/20', 
      text: 'text-orange-700 dark:text-orange-300', 
      border: 'border-orange-500' 
    },
    medium: { 
      bg: 'bg-yellow-50 dark:bg-yellow-500/20', 
      text: 'text-yellow-700 dark:text-yellow-300', 
      border: 'border-yellow-500' 
    },
    low: { 
      bg: 'bg-green-50 dark:bg-green-500/20', 
      text: 'text-green-700 dark: text-green-300', 
      border: 'border-green-500' 
    }
  };

  const priority = advancedDebt.priorityRecommendation || 'low';
  const colors = priorityColors[priority as keyof typeof priorityColors] || priorityColors.low;

  return (
    <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6 h-full flex flex-col">
      {/* Header with Priority Badge */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Wrench className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
          Technical Debt Analysis
        </h3>
        <Badge className={`${colors.bg} ${colors.text} border-0 font-medium`}>
          {priority.toUpperCase()} PRIORITY
        </Badge>
      </div>
      
      <div className="space-y-6 flex-1">
        {/* Top Metrics - Effort & Cost */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 dark: bg-yellow-500/10 dark:border-yellow-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-gray-600 dark:text-white/60">Total Effort</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
              {Math.round(advancedDebt.totalDebtHours)}h
            </div>
            <div className="text-xs text-gray-600 dark: text-white/60">
              ~{Math.round(advancedDebt.totalDebtHours / 8)} days
            </div>
          </div>
          
          <div className="p-4 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs text-gray-600 dark:text-white/60">Cost</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
              ${Math.round(advancedDebt.totalDebtCost / 1000)}k
            </div>
            <div className="text-xs text-gray-600 dark:text-white/60">
              Remediation cost
            </div>
          </div>
        </div>

        {/* Sprint Impact */}
        <div className="p-4 bg-[#E8F0FF] border border-[#003D6B]/20 dark:bg-purple-500/10 dark:border-purple-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#003D6B] dark: text-purple-400" />
              <span className="text-gray-900 dark:text-white font-medium text-sm">Sprint Impact</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-[#003D6B] dark:text-purple-400">
                {advancedDebt.estimatedSprintImpact}
              </div>
              <div className="text-gray-500 dark:text-white/60 text-xs">sprints needed</div>
            </div>
          </div>
        </div>

        {/* SLA Breach Analysis */}
        {advancedDebt.slaBreachAnalysis && (
          <div>
            <div className="flex items-center mb-3">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium text-sm">SLA Performance</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                <div className="text-gray-500 dark:text-white/60 text-xs mb-1">Breach Rate</div>
                <div className={`text-xl font-bold ${
                  advancedDebt.slaBreachAnalysis.breachPercentage > 50 ? 'text-red-600 dark:text-red-400' : 
                  advancedDebt.slaBreachAnalysis. breachPercentage > 20 ? 'text-orange-600 dark:text-orange-400' : 
                  'text-green-600 dark:text-green-400'
                }`}>
                  {Math.round(advancedDebt.slaBreachAnalysis.breachPercentage)}%
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                <div className="text-gray-500 dark:text-white/60 text-xs mb-1">Avg Age</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {Math.round(advancedDebt.slaBreachAnalysis.avgDaysOpen)}d
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROI Analysis */}
        {advancedDebt.roiOfFixing && (
          <div>
            <div className="flex items-center mb-3">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium text-sm">Return on Investment</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-white/5 rounded">
                <span className="text-gray-600 dark:text-white/60 text-sm">Risk Reduction</span>
                <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                  ${Math.round(advancedDebt.roiOfFixing. riskReduction / 1000)}k
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark: bg-white/5 rounded">
                <span className="text-gray-600 dark:text-white/60 text-sm">Maintenance Savings</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                  ${Math. round(advancedDebt. roiOfFixing.maintenanceSavings / 1000)}k
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 border border-green-200 dark: bg-green-500/10 dark:border-green-500/20 rounded">
                <span className="text-green-700 dark:text-green-300 font-medium text-sm">Net ROI</span>
                <span className={`font-bold text-sm ${
                  (advancedDebt.roiOfFixing.netRoi || 0) > 100 ? 'text-green-600 dark:text-green-400' :  'text-orange-600 dark:text-orange-400'
                }`}>
                  {Math.round(advancedDebt.roiOfFixing.netRoi || 0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Age Distribution */}
        {advancedDebt.debtByAgeBucket && Object.keys(advancedDebt.debtByAgeBucket).length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-white/20">
            <div className="flex items-center mb-3">
              <Clock className="w-4 h-4 text-[#003D6B] dark: text-purple-400 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium text-sm">Age Distribution</span>
            </div>
            <div className="space-y-2">
              {Object.entries(advancedDebt.debtByAgeBucket).map(([age, data]:  [string, any]) => (
                <div key={age} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-white/5 rounded">
                  <span className="text-gray-900 dark:text-white text-sm">{age}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500 dark:text-white/60 text-xs">{data.count} issues</span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium text-sm">
                      ${Math.round(data.cost / 1000)}k
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalDebt;