import React from 'react';
import { AlertTriangle, FileCode, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface SecurityHotspotsProps {
  data: EnhancedDashboardData;
}

const SecurityHotspots: React.FC<SecurityHotspotsProps> = ({ data }) => {
  const hotspots = data.advancedMetrics?.vulnerabilityTrends?.security_hotspots || [];
  
  if (!hotspots || hotspots.length === 0) {
    return (
      <div className="theme-card rounded-lg p-6">
        <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Security Hotspots
        </h3>
        <div className="text-center py-8 theme-text-muted">
          <Shield className="w-12 h-12 mx-auto mb-3 text-green-400/60" />
          <p className="text-green-400">No security hotspots detected</p>
          <p className="text-sm mt-2">Your most vulnerable files will appear here</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (critical: number, high: number) => {
    if (critical > 5) return 'border-red-500/50 bg-red-500/10';
    if (critical > 0 || high > 10) return 'border-orange-500/50 bg-orange-500/10';
    if (high > 5) return 'border-yellow-500/50 bg-yellow-500/10';
    return 'border-blue-500/50 bg-blue-500/10';
  };

  const getSeverityBadgeColor = (critical: number, high: number) => {
    if (critical > 5) return 'bg-red-500/20 text-red-300';
    if (critical > 0 || high > 10) return 'bg-orange-500/20 text-orange-300';
    if (high > 5) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-blue-500/20 text-blue-300';
  };

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx'].includes(ext || '')) return '🟨';
    if (['py'].includes(ext || '')) return '🐍';
    if (['java'].includes(ext || '')) return '☕';
    if (['php'].includes(ext || '')) return '💜';
    if (['sql'].includes(ext || '')) return '🗃️';
    if (filePath.toLowerCase().includes('dockerfile')) return '🐳';
    return '📄';
  };

  return (
    <div className="theme-card rounded-lg p-6">
      <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        Security Hotspots
      </h3>
      
      <div className="space-y-3">
        {hotspots.slice(0, 8).map((hotspot, index) => (
          <div 
            key={`${hotspot.file_path}-${index}`}
            className={`p-4 rounded-lg border ${getSeverityColor(hotspot.critical, hotspot.high)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="text-xl mt-0.5">
                  {getFileIcon(hotspot.file_path)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileCode className="w-4 h-4 theme-text-muted" />
                    <span className="theme-text font-medium truncate" title={hotspot.file_path}>
                      {hotspot.file_path.split('/').pop() || hotspot.file_path}
                    </span>
                  </div>
                  <div className="theme-text-muted text-xs truncate mb-2" title={hotspot.file_path}>
                    {hotspot.file_path}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityBadgeColor(hotspot.critical, hotspot.high)}>
                      {hotspot.count} issues
                    </Badge>
                    {hotspot.critical > 0 && (
                      <Badge className="bg-red-500/20 text-red-300">
                        {hotspot.critical} critical
                      </Badge>
                    )}
                    {hotspot.high > 0 && (
                      <Badge className="bg-orange-500/20 text-orange-300">
                        {hotspot.high} high
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-3">
                <div className="theme-text font-bold text-lg">{hotspot.count}</div>
                <div className="theme-text-muted text-xs">vulnerabilities</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t theme-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold theme-text">
              {hotspots.length}
            </div>
            <div className="theme-text-muted text-sm">Files at Risk</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">
              {hotspots.reduce((sum, h) => sum + h.critical, 0)}
            </div>
            <div className="theme-text-muted text-sm">Critical Issues</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-400">
              {hotspots.reduce((sum, h) => sum + h.high, 0)}
            </div>
            <div className="theme-text-muted text-sm">High Risk Issues</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="theme-text-muted text-sm">
            Focus on top {Math.min(3, hotspots.length)} files for maximum security impact
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityHotspots;