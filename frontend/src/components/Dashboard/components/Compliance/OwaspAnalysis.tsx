import React from 'react';
import { Shield, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface OwaspAnalysisProps {
  data: EnhancedDashboardData;
}

const OwaspAnalysis: React.FC<OwaspAnalysisProps> = ({ data }) => {
  const owaspAnalysis = data.advancedMetrics?.owaspAnalysis;
  
  if (!owaspAnalysis) {
    return (
      <div className="bg-black/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          OWASP Top 10 Analysis
        </h3>
        <div className="text-center py-8 text-white/60">
          <Shield className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No OWASP analysis data available</p>
        </div>
      </div>
    );
  }

  const owaspCategories = [
    { id: 'A01:2021', name: 'Broken Access Control', priority: 1 },
    { id: 'A02:2021', name: 'Cryptographic Failures', priority: 2 },
    { id: 'A03:2021', name: 'Injection', priority: 3 },
    { id: 'A04:2021', name: 'Insecure Design', priority: 4 },
    { id: 'A05:2021', name: 'Security Misconfiguration', priority: 5 },
    { id: 'A06:2021', name: 'Vulnerable Components', priority: 6 },
    { id: 'A07:2021', name: 'Identification Failures', priority: 7 },
    { id: 'A08:2021', name: 'Software Integrity Failures', priority: 8 },
    { id: 'A09:2021', name: 'Logging Failures', priority: 9 },
    { id: 'A10:2021', name: 'Server-Side Request Forgery', priority: 10 }
  ];

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        OWASP Top 10 Analysis
      </h3>
      
      <div className="space-y-3">
        {owaspCategories.map((category) => {
          const analysisData = owaspAnalysis[category.id];
          
          if (!analysisData) {
            return (
              <div key={category.id} className="bg-white/5 rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-white/40 font-mono text-sm mt-1">
                      {category.id.split(':')[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium">{category.name}</div>
                      <div className="text-white/60 text-sm">{category.id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/60 text-sm">No data</div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={category.id} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-white/80 font-mono text-sm mt-1 min-w-[60px]">
                    {category.id.split(':')[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{analysisData.name}</div>
                    <div className="text-white/60 text-sm mb-2">{category.id}</div>
                    
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <Badge className={`${getRiskColor(analysisData.risk_level)} border text-xs`}>
                        {analysisData.risk_level?.toUpperCase() || 'UNKNOWN'} RISK
                      </Badge>
                      
                      {analysisData.vulnerabilities_found > 0 && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                          {analysisData.vulnerabilities_found} Issues
                        </Badge>
                      )}
                      
                      <Badge className={`${getComplianceColor(analysisData.compliance_score)} bg-opacity-20 border text-xs`}>
                        {Math.round(analysisData.compliance_score)}% Compliant
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className={`text-2xl font-bold ${
                    analysisData.vulnerabilities_found === 0 ? 'text-green-400' :
                    analysisData.vulnerabilities_found < 5 ? 'text-yellow-400' :
                    analysisData.vulnerabilities_found < 20 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {analysisData.vulnerabilities_found}
                  </div>
                  <div className="text-white/60 text-sm">Issues</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-red-400">
              {Object.values(owaspAnalysis).filter((item: any) => item?.risk_level === 'high').length}
            </div>
            <div className="text-white/60 text-sm">High Risk</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">
              {Object.values(owaspAnalysis).filter((item: any) => item?.risk_level === 'medium').length}
            </div>
            <div className="text-white/60 text-sm">Medium Risk</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">
              {Object.values(owaspAnalysis).filter((item: any) => item?.risk_level === 'low').length}
            </div>
            <div className="text-white/60 text-sm">Low Risk</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {Object.values(owaspAnalysis).reduce((sum: number, item: any) => sum + (item?.vulnerabilities_found || 0), 0)}
            </div>
            <div className="text-white/60 text-sm">Total Issues</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwaspAnalysis;