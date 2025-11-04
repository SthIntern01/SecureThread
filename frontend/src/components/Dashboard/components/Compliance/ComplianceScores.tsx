import React from 'react';
import { Shield, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface ComplianceScoresProps {
  data: EnhancedDashboardData;
}

const ComplianceScores: React.FC<ComplianceScoresProps> = ({ data }) => {
  const complianceScores = data.advancedMetrics?.complianceScores;
  
  if (!complianceScores) {
    return (
      <div className="bg-black/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Compliance Standards
        </h3>
        <div className="text-center py-8 text-white/60">
          <Shield className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No compliance data available</p>
        </div>
      </div>
    );
  }

  const standards = [
    {
      key: 'owasp_top10',
      name: 'OWASP_TOP10',
      fullName: 'OWASP Top 10',
      score: complianceScores.owasp_top10 || 0,
      description: 'Web Application Security',
      target: 85
    },
    {
      key: 'pci_dss',
      name: 'PCI_DSS',
      fullName: 'PCI DSS',
      score: complianceScores.pci_dss || 0,
      description: 'Payment Card Industry',
      target: 95
    },
    {
      key: 'soc2',
      name: 'SOC 2',
      fullName: 'SOC 2 Type II',
      score: complianceScores.soc2 || 0,
      description: 'Service Organization Control',
      target: 90
    },
    {
      key: 'iso27001',
      name: 'ISO 27001',
      fullName: 'ISO/IEC 27001',
      score: complianceScores.iso27001 || 0,
      description: 'Information Security Management',
      target: 85
    },
    {
      key: 'gdpr',
      name: 'GDPR',
      fullName: 'General Data Protection Regulation',
      score: complianceScores.gdpr || 0,
      description: 'EU Data Protection',
      target: 95
    }
  ];

  const getScoreColor = (score: number, target: number) => {
    if (score >= target) return 'text-green-400';
    if (score >= target * 0.7) return 'text-yellow-400';
    if (score >= target * 0.4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressColor = (score: number, target: number) => {
    if (score >= target) return 'bg-green-500';
    if (score >= target * 0.7) return 'bg-yellow-500';
    if (score >= target * 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (score: number, target: number) => {
    if (score >= target) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (score >= target * 0.7) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  const getStatus = (score: number, target: number) => {
    if (score >= target) return 'Compliant';
    if (score >= target * 0.7) return 'Near Compliance';
    if (score >= target * 0.4) return 'Partial Compliance';
    return 'Non-Compliant';
  };

  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        Compliance Standards
      </h3>
      
      <div className="space-y-4">
        {standards.map((standard) => (
          <div key={standard.key} className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(standard.score, standard.target)}
                <div>
                  <div className="text-white font-medium">{standard.name}</div>
                  <div className="text-white/60 text-sm">{standard.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${getScoreColor(standard.score, standard.target)}`}>
                  {Math.round(standard.score)}%
                </div>
                <div className="text-white/60 text-sm">
                  Target: {standard.target}%
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">{getStatus(standard.score, standard.target)}</span>
                <span className="text-white/60">{Math.round(standard.score)}/{standard.target}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(standard.score, standard.target)}`}
                  style={{ width: `${Math.min(100, (standard.score / standard.target) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">
              {standards.filter(s => s.score >= s.target).length}
            </div>
            <div className="text-white/60 text-sm">Compliant</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">
              {standards.filter(s => s.score >= s.target * 0.7 && s.score < s.target).length}
            </div>
            <div className="text-white/60 text-sm">Near Compliance</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">
              {standards.filter(s => s.score < s.target * 0.7).length}
            </div>
            <div className="text-white/60 text-sm">Non-Compliant</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceScores;