import React from 'react';
import { AlertTriangle, FileCode, Shield, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface SecurityHotspotsProps {
  data: EnhancedDashboardData;
}

const SecurityHotspots: React.FC<SecurityHotspotsProps> = ({ data }) => {
  const hotspots = data.advancedMetrics?.vulnerabilityTrends?.security_hotspots || [];
  
  if (! hotspots || hotspots. length === 0) {
    return (
      <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4 flex items-center">
          <Flame className="w-5 h-5 mr-2 text-[#FF6B35] dark:text-orange-400" />
          Security Hotspots
          <Badge className="ml-3 bg-green-50 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30">All Clear</Badge>
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-white/60">
          <Shield className="w-12 h-12 mx-auto mb-3 text-green-500/60 dark:text-green-400/60" />
          <p className="text-green-600 dark:text-green-400">No security hotspots detected</p>
          <p className="text-sm mt-2">Your most vulnerable files will appear here</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (critical: number, high: number) => {
    if (critical > 5) return 'border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10';
    if (critical > 0 || high > 10) return 'border-orange-300 bg-orange-50 dark:border-orange-500/50 dark:bg-orange-500/10';
    if (high > 5) return 'border-yellow-300 bg-yellow-50 dark:border-yellow-500/50 dark:bg-yellow-500/10';
    return 'border-[#B8D4E9] bg-[#D6E6FF] dark:border-blue-500/50 dark:bg-blue-500/10';
  };

  const getSeverityBadgeColor = (critical: number, high: number) => {
    if (critical > 5) return 'bg-red-50 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30';
    if (critical > 0 || high > 10) return 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30';
    if (high > 5) return 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30';
    return 'bg-[#D6E6FF] text-[#003D6B] border-[#003D6B]/30 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
  };

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx'].includes(ext || '')) return '🟨';
    if (['py']. includes(ext || '')) return '🐍';
    if (['java'].includes(ext || '')) return '☕';
    if (['php'].includes(ext || '')) return '💜';
    if (['sql'].includes(ext || '')) return '🗃️';
    if (filePath.toLowerCase().includes('dockerfile')) return '🐳';
    return '📄';
  };

  const totalCritical = hotspots.reduce((sum, h) => sum + h.critical, 0);
  const totalHigh = hotspots.reduce((sum, h) => sum + h.high, 0);

  return (
    <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6">
      {/* Header with priority indicator */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Flame className="w-5 h-5 mr-2 text-[#FF6B35] dark:text-orange-400" />
          Security Hotspots
          {totalCritical > 0 && (
            <Badge className="ml-3 bg-red-50 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30 animate-pulse">
              {totalCritical} Critical
            </Badge>
          )}
        </h3>
        <div className="text-sm text-gray-500 dark:text-white/60">
          Showing top {Math.min(8, hotspots.length)} of {hotspots.length} files
        </div>
      </div>

      {/* Priority Alert Banner */}
      {totalCritical > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 dark: bg-red-500/10 dark:border-red-500/30 rounded-lg flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-red-700 dark:text-red-300 font-medium text-sm">High Priority Action Required</div>
            <div className="text-red-600 dark:text-red-400/80 text-xs mt-1">
              {totalCritical} critical vulnerabilities detected across {hotspots.filter(h => h.critical > 0).length} files. 
              Immediate remediation recommended.
            </div>
          </div>
        </div>
      )}
      
      {/* Hotspots Grid - 2 columns for better readability */}
      <div className="grid md:grid-cols-2 gap-4">
        {hotspots.slice(0, 8).map((hotspot, index) => (
          <div 
            key={`${hotspot.file_path}-${index}`}
            className={`p-4 rounded-lg border ${getSeverityColor(hotspot.critical, hotspot.high)} hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="text-2xl mt-0.5">
                  {getFileIcon(hotspot.file_path)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileCode className="w-4 h-4 text-gray-500 dark:text-white/60" />
                    <span className="text-gray-900 dark:text-white font-medium truncate" title={hotspot.file_path}>
                      {hotspot. file_path. split('/').pop() || hotspot.file_path}
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-white/60 text-xs truncate mb-3" title={hotspot.file_path}>
                    {hotspot. file_path}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getSeverityBadgeColor(hotspot.critical, hotspot.high)}>
                      {hotspot.count} total
                    </Badge>
                    {hotspot.critical > 0 && (
                      <Badge className="bg-red-50 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30 font-bold">
                        {hotspot. critical} critical
                      </Badge>
                    )}
                    {hotspot.high > 0 && (
                      <Badge className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark: text-orange-300 dark: border-orange-500/30">
                        {hotspot.high} high
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-3">
                <div className="text-gray-900 dark:text-white font-bold text-2xl">{hotspot.count}</div>
                <div className="text-gray-500 dark: text-white/60 text-xs">issues</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Summary Section */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/20">
        <div className="grid grid-cols-4 gap-4 text-center mb-4">
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {hotspots.length}
            </div>
            <div className="text-gray-500 dark: text-white/60 text-sm">Files at Risk</div>
          </div>
          <div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {totalCritical}
            </div>
            <div className="text-gray-500 dark:text-white/60 text-sm">Critical Issues</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {totalHigh}
            </div>
            <div className="text-gray-500 dark:text-white/60 text-sm">High Risk</div>
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {hotspots.reduce((sum, h) => sum + h.count, 0)}
            </div>
            <div className="text-gray-500 dark:text-white/60 text-sm">Total Vulnerabilities</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-[#D6E6FF] dark:bg-blue-500/10 rounded-lg text-center">
          <div className="text-gray-700 dark:text-white/70 text-sm">
            💡 <span className="font-medium">Pro Tip:</span> Focus on top {Math.min(3, hotspots.length)} files with critical issues for maximum security impact
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityHotspots;