import React from 'react';
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface MTTRAnalysisProps {
  data: EnhancedDashboardData;
}

const MTTRAnalysis: React.FC<MTTRAnalysisProps> = ({ data }) => {
  const mttr = data.advancedMetrics?.vulnerabilityTrends?.mean_time_to_resolve;
  const securityMetrics = data.advancedMetrics?.codeQualityMetrics;
  
  if (!mttr && !securityMetrics) {
    return (
      <div className="theme-card rounded-lg p-6 h-full">
        <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Resolution Time (MTTR)
        </h3>
        <div className="text-center py-8 theme-text-muted">
          <Clock className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No resolution data available</p>
          <p className="text-sm mt-2">Fix vulnerabilities to track resolution times</p>
        </div>
      </div>
    );
  }

  // Generate realistic MTTR data based on current vulnerabilities
  const generateMTTRData = () => {
    if (mttr && (mttr.critical > 0 || mttr. high > 0 || mttr.medium > 0 || mttr.low > 0)) {
      return mttr;
    }
    
    // Generate estimated MTTR based on industry standards
    return {
      critical: 0, // No fixes yet, but show targets
      high: 0,
      medium: 0,
      low: 0
    };
  };

  const mttrData = generateMTTRData();
  
  // Industry benchmark MTTR targets (in days)
  const targets = {
    critical: 7,
    high: 15,
    medium: 30,
    low: 90
  };

  const severityData = [
    { 
      severity: 'Critical', 
      current: mttrData.critical, 
      target: targets.critical, 
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      icon: '🔴'
    },
    { 
      severity: 'High', 
      current: mttrData.high, 
      target: targets.high, 
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      icon: '🟠'
    },
    { 
      severity: 'Medium', 
      current: mttrData.medium, 
      target: targets.medium, 
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      icon: '🟡'
    },
    { 
      severity: 'Low', 
      current: mttrData.low, 
      target: targets.low, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      icon: '🔵'
    }
  ];

  return (
    <div className="theme-card rounded-lg p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        Resolution Time (MTTR)
        <span className="ml-auto text-xs theme-text-muted">Mean Time To Resolve</span>
      </h3>
      
      <div className="space-y-3 flex-1">
        {severityData.map((item) => (
          <div key={item.severity} className="flex items-center justify-between p-3 theme-bg-subtle rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{item.icon}</span>
              <span className="theme-text font-medium min-w-[70px]">{item.severity}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className={`text-sm font-medium ${item.color}`}>
                  {item.current > 0 ?  `${item.current}d` : '--'}
                </div>
                <div className="theme-text-muted text-xs">Current</div>
              </div>
              
              <div className="text-center theme-text-muted text-xs">→</div>
              
              <div className="text-right">
                <div className="theme-text-secondary text-sm font-medium">{item.target}d</div>
                <div className="theme-text-muted text-xs">Target</div>
              </div>
              
              <div className="w-6">
                {item.current <= item.target && item.current > 0 ?  (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : item.current > item.target ?  (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400/50" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t theme-border">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold theme-text">
              {data.totalVulnerabilities || 0}
            </div>
            <div className="theme-text-muted text-xs">Open Issues</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400">
              0
            </div>
            <div className="theme-text-muted text-xs">Fixed This Month</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="theme-text-muted text-xs">
            Industry Avg: Critical 7d • High 15d • Medium 30d • Low 90d
          </div>
        </div>
      </div>
    </div>
  );
};

export default MTTRAnalysis;