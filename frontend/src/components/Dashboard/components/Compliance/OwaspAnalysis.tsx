import React from 'react';
import { Shield, AlertTriangle, Lock, Key, Database, Workflow, Settings, Package, UserX, FileCheck, ScrollText, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface OwaspAnalysisProps {
  data: EnhancedDashboardData;
}

const OwaspAnalysis: React.FC<OwaspAnalysisProps> = ({ data }) => {
  const owaspAnalysis = data.advancedMetrics?.owaspAnalysis;
  
  if (!owaspAnalysis) {
    return (
      <div className="theme-card rounded-lg p-6 h-full">
        <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          OWASP Top 10 Analysis
        </h3>
        <div className="text-center py-8 theme-text-muted">
          <Shield className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No OWASP analysis data available</p>
          <p className="text-xs mt-2">Security scan results will appear here</p>
        </div>
      </div>
    );
  }

  const owaspCategories = [
    { id: 'A01:2021', name: 'Broken Access Control', priority: 1, icon: Lock, iconColor: 'text-red-400' },
    { id: 'A02:2021', name: 'Cryptographic Failures', priority: 2, icon: Key, iconColor: 'text-orange-400' },
    { id: 'A03:2021', name: 'Injection', priority: 3, icon: Database, iconColor: 'text-yellow-400' },
    { id: 'A04:2021', name: 'Insecure Design', priority: 4, icon: Workflow, iconColor: 'text-purple-400' },
    { id: 'A05:2021', name: 'Security Misconfiguration', priority: 5, icon: Settings, iconColor: 'text-blue-400' },
    { id: 'A06:2021', name: 'Vulnerable Components', priority: 6, icon: Package, iconColor: 'text-pink-400' },
    { id: 'A07:2021', name: 'Identification Failures', priority: 7, icon: UserX, iconColor: 'text-cyan-400' },
    { id: 'A08:2021', name: 'Software Integrity Failures', priority: 8, icon: FileCheck, iconColor: 'text-green-400' },
    { id: 'A09:2021', name: 'Logging Failures', priority: 9, icon: ScrollText, iconColor: 'text-indigo-400' },
    { id: 'A10:2021', name: 'Server-Side Request Forgery', priority: 10, icon: Globe, iconColor: 'text-teal-400' }
  ];

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?. toLowerCase()) {
      case 'high': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
      case 'medium': return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' };
      case 'low': return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' };
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' };
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const highRiskCount = Object.values(owaspAnalysis). filter((item: any) => item?. risk_level === 'high').length;
  const totalIssues = Object.values(owaspAnalysis).reduce((sum: number, item: any) => sum + (item?.vulnerabilities_found || 0), 0);

  return (
    <div className="theme-card rounded-lg p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold theme-text flex items-center">
          <Shield className="w-5 h-5 mr-2 text-purple-400" />
          OWASP Top 10 Analysis
        </h3>
        {highRiskCount > 0 && (
          <Badge className="bg-red-500/20 text-red-300 animate-pulse">
            {highRiskCount} High Risk
          </Badge>
        )}
      </div>

      {/* Scrollable Categories */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
        {owaspCategories.map((category) => {
          const analysisData = owaspAnalysis[category.id];
          const IconComponent = category.icon;
          
          if (!analysisData) {
            return (
              <div key={category.id} className="p-3 theme-bg-subtle rounded-lg opacity-40 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      <IconComponent className={`w-4 h-4 ${category. iconColor}`} />
                    </div>
                    <div>
                      <div className="theme-text text-sm font-medium">{category.name}</div>
                      <div className="theme-text-muted text-xs">{category.id}</div>
                    </div>
                  </div>
                  <span className="theme-text-muted text-xs">No data</span>
                </div>
              </div>
            );
          }

          const colors = getRiskColor(analysisData.risk_level);

          return (
            <div 
              key={category.id} 
              className={`p-4 rounded-lg border ${colors. border} ${colors.bg} hover:scale-[1.01] transition-transform`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg bg-white/5 ${category.iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="theme-text font-semibold text-sm mb-1 truncate" title={analysisData.name}>
                      {analysisData.name}
                    </div>
                    <div className="theme-text-muted text-xs mb-2">{category.id}</div>
                    
                    <div className="flex flex-wrap items-center gap-1. 5">
                      <Badge className={`${colors.bg} ${colors.text} border-0 text-xs`}>
                        {analysisData.risk_level?. toUpperCase() || 'UNKNOWN'}
                      </Badge>
                      
                      {analysisData.vulnerabilities_found > 0 && (
                        <Badge className="bg-red-500/20 text-red-300 border-0 text-xs">
                          {analysisData.vulnerabilities_found} Issues
                        </Badge>
                      )}
                      
                      <Badge className={`${getComplianceColor(analysisData.compliance_score)} bg-white/5 border-0 text-xs`}>
                        {Math.round(analysisData.compliance_score)}%
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-3">
                  <div className={`text-2xl font-bold ${
                    analysisData.vulnerabilities_found === 0 ? 'text-green-400' :
                    analysisData.vulnerabilities_found < 5 ? 'text-yellow-400' :
                    analysisData.vulnerabilities_found < 20 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {analysisData.vulnerabilities_found}
                  </div>
                  <div className="theme-text-muted text-xs">issues</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t theme-border">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-red-400">
              {Object.values(owaspAnalysis). filter((item: any) => item?.risk_level === 'high').length}
            </div>
            <div className="theme-text-muted text-xs">High</div>
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-400">
              {Object.values(owaspAnalysis).filter((item: any) => item?.risk_level === 'medium').length}
            </div>
            <div className="theme-text-muted text-xs">Medium</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">
              {Object.values(owaspAnalysis).filter((item: any) => item?.risk_level === 'low').length}
            </div>
            <div className="theme-text-muted text-xs">Low</div>
          </div>
          <div>
            <div className="text-xl font-bold theme-text">
              {totalIssues}
            </div>
            <div className="theme-text-muted text-xs">Total</div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        . custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        . custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default OwaspAnalysis;