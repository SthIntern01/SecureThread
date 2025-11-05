import React from 'react';
import { Wrench, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface TechnicalDebtProps {
  data: EnhancedDashboardData;
}

const TechnicalDebt: React.FC<TechnicalDebtProps> = ({ data }) => {
  const advancedDebt = data.advancedMetrics?.technicalDebtDetailed;
  
  if (!advancedDebt) {
    return (
      <div className="theme-card rounded-lg p-6">
        <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
          <Wrench className="w-5 h-5 mr-2" />
          Advanced Technical Debt
        </h3>
        <div className="text-center py-8 theme-text-muted">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No technical debt data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-card rounded-lg p-6">
      <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
        <Wrench className="w-5 h-5 mr-2" />
        Advanced Technical Debt Analysis
      </h3>
      
      <div className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {Math.round(advancedDebt.totalDebtHours)}h
            </div>
            <div className="theme-text-muted text-sm">Total Effort</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400 mb-1">
              ${Math.round(advancedDebt.totalDebtCost / 1000)}k
            </div>
            <div className="theme-text-muted text-sm">Remediation Cost</div>
          </div>
        </div>

        {/* Priority & Risk */}
        <div className="flex items-center justify-between">
          <div>
            <div className="theme-text font-medium">Priority Level</div>
            <Badge className={`mt-1 ${
              advancedDebt.priorityRecommendation === 'critical' ? 'bg-red-500/20 text-red-300' :
              advancedDebt.priorityRecommendation === 'high' ? 'bg-orange-500/20 text-orange-300' :
              advancedDebt.priorityRecommendation === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-green-500/20 text-green-300'
            }`}>
              {advancedDebt.priorityRecommendation?.toUpperCase() || 'LOW'}
            </Badge>
          </div>
          <div className="text-right">
            <div className="theme-text-muted text-sm">Sprint Impact</div>
            <div className="theme-text font-medium">{advancedDebt.estimatedSprintImpact} sprints</div>
          </div>
        </div>

        {/* SLA Breach Analysis */}
        {advancedDebt.slaBreachAnalysis && (
          <div>
            <div className="flex items-center mb-3">
              <Clock className="w-4 h-4 text-orange-400 mr-2" />
              <span className="theme-text font-medium">SLA Performance</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="theme-text-muted">Breaches</div>
                <div className={`font-medium ${
                  advancedDebt.slaBreachAnalysis.breachPercentage > 50 ? 'text-red-400' :
                  advancedDebt.slaBreachAnalysis.breachPercentage > 20 ? 'text-orange-400' :
                  'text-green-400'
                }`}>
                  {Math.round(advancedDebt.slaBreachAnalysis.breachPercentage)}%
                </div>
              </div>
              <div>
                <div className="theme-text-muted">Avg Age</div>
                <div className="theme-text font-medium">
                  {Math.round(advancedDebt.slaBreachAnalysis.avgDaysOpen)} days
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROI Analysis */}
        {advancedDebt.roiOfFixing && (
          <div>
            <div className="flex items-center mb-3">
              <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
              <span className="theme-text font-medium">ROI Analysis</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="theme-text-muted">Risk Reduction</span>
                <span className="text-green-300">${Math.round(advancedDebt.roiOfFixing.riskReduction / 1000)}k</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-text-muted">Maintenance Savings</span>
                <span className="text-blue-300">${Math.round(advancedDebt.roiOfFixing.maintenanceSavings / 1000)}k</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-text-muted">Net ROI</span>
                <span className={`font-medium ${
                  (advancedDebt.roiOfFixing.netRoi || 0) > 100 ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {Math.round(advancedDebt.roiOfFixing.netRoi || 0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Age Distribution */}
        {advancedDebt.debtByAgeBucket && Object.keys(advancedDebt.debtByAgeBucket).length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <AlertCircle className="w-4 h-4 text-purple-400 mr-2" />
              <span className="theme-text font-medium">Age Distribution</span>
            </div>
            <div className="space-y-1">
              {Object.entries(advancedDebt.debtByAgeBucket).map(([age, data]: [string, any]) => (
                <div key={age} className="flex items-center justify-between text-sm">
                  <span className="theme-text-muted">{age}</span>
                  <div className="flex items-center space-x-2">
                    <span className="theme-text">{data.count}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-orange-300">${Math.round(data.cost / 1000)}k</span>
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