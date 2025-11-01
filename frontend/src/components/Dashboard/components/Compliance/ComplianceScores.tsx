import React from 'react';
import { Award } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface ComplianceScoresProps {
  data: EnhancedDashboardData;
}

const ComplianceScores: React.FC<ComplianceScoresProps> = ({ data }) => {
  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Award className="w-5 h-5 mr-2" />
        Compliance Standards
      </h3>
      
      {data.advancedMetrics?.complianceScores ? (
        <div className="space-y-4">
          {Object.entries(data.advancedMetrics.complianceScores).map(([standard, score]) => (
            <div key={standard} className="flex items-center justify-between">
              <span className="text-white/70 text-sm font-medium">
                {standard === 'owaspTop10' ? 'OWASP Top 10' :
                 standard === 'pciDss' ? 'PCI DSS' :
                 standard === 'soc2' ? 'SOC 2' :
                 standard === 'iso27001' ? 'ISO 27001' :
                 standard === 'gdpr' ? 'GDPR' : standard.toUpperCase()}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getComplianceScoreColor(score).replace('text-', 'bg-').replace('-400', '-400')}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${getComplianceScoreColor(score)}`}>
                  {Math.round(score)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <Award className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No compliance data available</p>
        </div>
      )}
    </div>
  );
};

export default ComplianceScores;