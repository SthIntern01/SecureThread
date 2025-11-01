import React from 'react';
import { Users } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface TeamMetricsProps {
  data: EnhancedDashboardData;
}

const TeamMetrics: React.FC<TeamMetricsProps> = ({ data }) => {
  return (
    <div className="bg-black/20 rounded-lg p-6 lg:col-span-2">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Team Security Performance
      </h3>
      
      {data.advancedMetrics?.teamMetrics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {data.advancedMetrics.teamMetrics.scanFrequencyPerWeek?.toFixed(1) || 0}
            </div>
            <div className="text-white/60 text-sm">Scans/Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {Math.round(data.advancedMetrics.teamMetrics.automationLevel || 0)}%
            </div>
            <div className="text-white/60 text-sm">Automation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-2">
              {Math.round(data.advancedMetrics.teamMetrics.policyCompliance || 0)}%
            </div>
            <div className="text-white/60 text-sm">Policy Compliance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400 mb-2">
              {Math.round(data.advancedMetrics.teamMetrics.developerSecurityScore || 0)}%
            </div>
            <div className="text-white/60 text-sm">Dev Security Score</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <Users className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No team metrics available</p>
        </div>
      )}
    </div>
  );
};

export default TeamMetrics;