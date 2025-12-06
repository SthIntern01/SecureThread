import React from 'react';
import { Shield, AlertTriangle, CheckCircle, AlertCircle, Lock, CreditCard, Building2, FileCheck, Globe } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface ComplianceScoresProps {
  data: EnhancedDashboardData;
}

const ComplianceScores: React.FC<ComplianceScoresProps> = ({ data }) => {
  const complianceScores = data.advancedMetrics?. complianceScores;
  
  if (!complianceScores) {
    return (
      <div className="theme-card rounded-lg p-6 h-full">
        <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Compliance Standards
        </h3>
        <div className="text-center py-8 theme-text-muted">
          <Shield className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No compliance data available</p>
          <p className="text-xs mt-2">Run scans to see compliance status</p>
        </div>
      </div>
    );
  }

  const standards = [
    {
      key: 'owasp_top10',
      name: 'OWASP TOP 10',
      fullName: 'OWASP Top 10',
      score: complianceScores.owasp_top10 || 0,
      description: 'Web Application Security',
      target: 85,
      icon: Lock,
      iconColor: 'text-red-400'
    },
    {
      key: 'pci_dss',
      name: 'PCI DSS',
      fullName: 'PCI DSS',
      score: complianceScores.pci_dss || 0,
      description: 'Payment Card Industry',
      target: 95,
      icon: CreditCard,
      iconColor: 'text-blue-400'
    },
    {
      key: 'soc2',
      name: 'SOC 2',
      fullName: 'SOC 2 Type II',
      score: complianceScores.soc2 || 0,
      description: 'Service Organization Control',
      target: 90,
      icon: Building2,
      iconColor: 'text-purple-400'
    },
    {
      key: 'iso27001',
      name: 'ISO 27001',
      fullName: 'ISO/IEC 27001',
      score: complianceScores. iso27001 || 0,
      description: 'Information Security Management',
      target: 85,
      icon: FileCheck,
      iconColor: 'text-green-400'
    },
    {
      key: 'gdpr',
      name: 'GDPR',
      fullName: 'General Data Protection Regulation',
      score: complianceScores.gdpr || 0,
      description: 'EU Data Protection',
      target: 95,
      icon: Globe,
      iconColor: 'text-cyan-400'
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
    if (score >= target) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (score >= target * 0.7) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <AlertCircle className="w-5 h-5 text-red-400" />;
  };

  const getStatus = (score: number, target: number) => {
    if (score >= target) return 'Compliant';
    if (score >= target * 0.7) return 'Near Compliance';
    if (score >= target * 0.4) return 'Partial';
    return 'Non-Compliant';
  };

  const compliantCount = standards.filter(s => s.score >= s.target).length;

  return (
    <div className="theme-card rounded-lg p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold theme-text flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-400" />
          Compliance Standards
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          compliantCount >= 4 ? 'bg-green-500/20 text-green-300' :
          compliantCount >= 2 ? 'bg-yellow-500/20 text-yellow-300' : 
          'bg-red-500/20 text-red-300'
        }`}>
          {compliantCount}/{standards.length} Met
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        {standards. map((standard) => {
          const IconComponent = standard.icon;
          return (
            <div key={standard.key} className="p-4 theme-bg-subtle rounded-lg border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-lg bg-white/5 ${standard. iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusIcon(standard.score, standard.target)}
                      <span className="theme-text font-semibold">{standard.name}</span>
                    </div>
                    <div className="theme-text-muted text-xs">{standard.description}</div>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className={`text-2xl font-bold ${getScoreColor(standard.score, standard.target)}`}>
                    {Math.round(standard.score)}%
                  </div>
                  <div className="theme-text-muted text-xs">
                    Target: {standard.target}%
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-1. 5">
                <div className="flex justify-between text-xs">
                  <span className={`font-medium ${getScoreColor(standard.score, standard.target)}`}>
                    {getStatus(standard.score, standard. target)}
                  </span>
                  <span className="theme-text-muted">
                    {Math.round(standard.score)}/{standard.target}%
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(standard.score, standard.target)}`}
                    style={{ width: `${Math. min(100, (standard.score / standard.target) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t theme-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {standards.filter(s => s.score >= s.target).length}
            </div>
            <div className="theme-text-muted text-xs">Compliant</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {standards.filter(s => s.score >= s.target * 0.7 && s.score < s.target).length}
            </div>
            <div className="theme-text-muted text-xs">Near</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {standards. filter(s => s.score < s.target * 0.7).length}
            </div>
            <div className="theme-text-muted text-xs">Non-Compliant</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceScores;