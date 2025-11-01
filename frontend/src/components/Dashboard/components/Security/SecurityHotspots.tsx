import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileCode, Shield } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface SecurityHotspotsProps {
  data: EnhancedDashboardData;
}

const SecurityHotspots: React.FC<SecurityHotspotsProps> = ({ data }) => {
  return (
    <div className="bg-black/20 rounded-lg p-6 lg:col-span-2">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        Security Hotspots
      </h3>
      
      {data.advancedMetrics?.vulnerabilityTrends?.securityHotspots && data.advancedMetrics.vulnerabilityTrends.securityHotspots.length > 0 ? (
        <div className="space-y-2">
          {data.advancedMetrics.vulnerabilityTrends.securityHotspots.slice(0, 8).map((hotspot, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 rounded bg-black/30">
              <div className="flex items-center space-x-3">
                <FileCode className="w-4 h-4 text-white/60" />
                <span className="text-white/80 text-sm font-mono">{hotspot.filePath}</span>
              </div>
              <div className="flex items-center space-x-3">
                {hotspot.critical > 0 && (
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                    {hotspot.critical} critical
                  </Badge>
                )}
                {hotspot.high > 0 && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                    {hotspot.high} high
                  </Badge>
                )}
                <span className="text-white/60 text-sm">{hotspot.count} total</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <Shield className="w-12 h-12 mx-auto mb-3 text-green-400/60" />
          <p>No security hotspots detected</p>
        </div>
      )}
    </div>
  );
};

export default SecurityHotspots;