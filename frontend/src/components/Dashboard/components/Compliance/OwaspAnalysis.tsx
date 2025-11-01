import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface OwaspAnalysisProps {
  data: EnhancedDashboardData;
}

const OwaspAnalysis: React.FC<OwaspAnalysisProps> = ({ data }) => {
  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        OWASP Top 10 Analysis
      </h3>
      
      {data.advancedMetrics?.owaspAnalysis ? (
        <div className="space-y-3">
          {Object.entries(data.advancedMetrics.owaspAnalysis)
            .sort(([,a], [,b]) => b.riskScore - a.riskScore)
            .slice(0, 6).map(([id, analysis]) => (
            <div key={id} className="flex items-center justify-between py-2 px-3 rounded bg-black/30">
              <div>
                <div className="text-white/80 text-sm font-medium">{analysis.name}</div>
                <div className="text-white/50 text-xs">{id}</div>
              </div>
              <div className="text-right">
                <Badge className={`text-xs mb-1 ${
                  analysis.complianceStatus === 'compliant' 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {analysis.complianceStatus}
                </Badge>
                <div className="text-white/60 text-xs">
                  {analysis.totalVulnerabilities} issues
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <Shield className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No OWASP analysis available</p>
        </div>
      )}
    </div>
  );
};

export default OwaspAnalysis;