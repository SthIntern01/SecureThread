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
      <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-[#003D6B] dark:text-white" />
          Resolution Time (MTTR)
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-white/60">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-white/40" />
          <p>No resolution data available</p>
          <p className="text-sm mt-2">Fix vulnerabilities to track resolution times</p>
        </div>
      </div>
    );
  }

  // Generate realistic MTTR data based on current vulnerabilities
  const generateMTTRData = () => {
    if (mttr && (mttr.critical > 0 || mttr.high > 0 || mttr.medium > 0 || mttr.low > 0)) {
      return mttr;
    }
    
    return {
      critical: 0,
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
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-500/20',
      icon: '🔴'
    },
    { 
      severity: 'High', 
      current: mttrData.high, 
      target: targets.high, 
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark: bg-orange-500/20',
      icon: '🟠'
    },
    { 
      severity: 'Medium', 
      current: mttrData.medium, 
      target: targets.medium, 
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark: bg-yellow-500/20',
      icon: '🟡'
    },
    { 
      severity: 'Low', 
      current: mttrData.low, 
      target: targets.low, 
      color: 'text-[#003D6B] dark:text-blue-400',
      bgColor: 'bg-[#B8D4E9] dark:bg-blue-500/20',
      icon: '🔵'
    }
  ];

  return (
    <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-[#003D6B] dark:text-white" />
        Resolution Time (MTTR)
        <span className="ml-auto text-xs text-gray-500 dark: text-white/60">Mean Time To Resolve</span>
      </h3>
      
      <div className="space-y-3 flex-1">
        {severityData.map((item) => (
          <div key={item.severity} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-gray-900 dark:text-white font-medium min-w-[70px]">{item.severity}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className={`text-sm font-medium ${item.color}`}>
                  {item.current > 0 ?  `${item.current}d` : '--'}
                </div>
                <div className="text-gray-500 dark:text-white/60 text-xs">Current</div>
              </div>
              
              <div className="text-center text-gray-500 dark:text-white/60 text-xs">→</div>
              
              <div className="text-right">
                <div className="text-gray-700 dark:text-white/80 text-sm font-medium">{item.target}d</div>
                <div className="text-gray-500 dark:text-white/60 text-xs">Target</div>
              </div>
              
              <div className="w-6">
                {item.current <= item.target && item.current > 0 ?  (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : item.current > item.target ?  (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400/50" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/20">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.totalVulnerabilities || 0}
            </div>
            <div className="text-gray-500 dark:text-white/60 text-xs">Open Issues</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#FF6B35] dark:text-orange-400">
              0
            </div>
            <div className="text-gray-500 dark:text-white/60 text-xs">Fixed This Month</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-gray-500 dark:text-white/60 text-xs">
            Industry Avg: Critical 7d • High 15d • Medium 30d • Low 90d
          </div>
        </div>
      </div>
    </div>
  );
};

export default MTTRAnalysis;