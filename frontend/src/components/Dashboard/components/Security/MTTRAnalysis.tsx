import React from 'react';
import { Clock } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface MTTRAnalysisProps {
  data: EnhancedDashboardData;
}

const MTTRAnalysis: React.FC<MTTRAnalysisProps> = ({ data }) => {
  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        Resolution Time (MTTR)
      </h3>
      
      {data.advancedMetrics?.vulnerabilityTrends?.meanTimeToResolve ? (
        <div className="space-y-3">
          {Object.entries(data.advancedMetrics.vulnerabilityTrends.meanTimeToResolve).map(([severity, days]) => (
            <div key={severity} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  severity === 'critical' ? 'bg-red-400' :
                  severity === 'high' ? 'bg-orange-400' :
                  severity === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                }`} />
                <span className="text-white/70 text-sm capitalize">{severity}</span>
              </div>
              <span className="text-white text-sm font-medium">
                {days > 0 ? `${days} days` : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <Clock className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No resolution data available</p>
        </div>
      )}
    </div>
  );
};

export default MTTRAnalysis;