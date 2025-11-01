import React from 'react';
import { Wrench } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface TechnicalDebtProps {
  data: EnhancedDashboardData;
}

const TechnicalDebt: React.FC<TechnicalDebtProps> = ({ data }) => {
  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Wrench className="w-5 h-5 mr-2" />
        Technical Debt Analysis
      </h3>
      
      {data.advancedMetrics?.technicalDebtDetailed ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {Math.round(data.advancedMetrics.technicalDebtDetailed.totalDebtHours)}h
              </div>
              <div className="text-white/60 text-sm">Total Debt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                ${Math.round(data.advancedMetrics.technicalDebtDetailed.totalDebtCost / 1000)}k
              </div>
              <div className="text-white/60 text-sm">Cost Impact</div>
            </div>
          </div>

          {/* Debt by Severity */}
          <div>
            <h4 className="text-white font-medium mb-2">Debt Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(data.advancedMetrics.technicalDebtDetailed.debtBySeverity || {}).map(([severity, debt]) => (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      severity === 'critical' ? 'bg-red-400' :
                      severity === 'high' ? 'bg-orange-400' :
                      severity === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                    }`} />
                    <span className="text-white/70 text-sm capitalize">{severity}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm">{debt.hours}h</div>
                    <div className="text-white/60 text-xs">${Math.round(debt.cost)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROI Analysis */}
          {data.advancedMetrics.technicalDebtDetailed.roiOfFixing && (
            <div>
              <h4 className="text-white font-medium mb-2">ROI of Fixing</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Maintenance Savings</span>
                  <span className="text-green-300">${Math.round(data.advancedMetrics.technicalDebtDetailed.roiOfFixing.maintenanceSavings / 1000)}k</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Risk Reduction</span>
                  <span className="text-blue-300">${Math.round(data.advancedMetrics.technicalDebtDetailed.roiOfFixing.riskReduction / 1000)}k</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Productivity Gain</span>
                  <span className="text-purple-300">${Math.round(data.advancedMetrics.technicalDebtDetailed.roiOfFixing.productivityGain / 1000)}k</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No technical debt data available</p>
        </div>
      )}
    </div>
  );
};

export default TechnicalDebt;