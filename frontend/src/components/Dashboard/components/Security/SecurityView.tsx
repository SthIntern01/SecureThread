import React from 'react';
import VulnerabilityTrends from './VulnerabilityTrends';
import MTTRAnalysis from './MTTRAnalysis';
import SecurityHotspots from './SecurityHotspots';
import { EnhancedDashboardData } from '../../types/dashboard. types';
import { AlertTriangle, TrendingUp, Clock, Shield } from "lucide-react";

interface SecurityViewProps {
  data: EnhancedDashboardData;
}

const SecurityView: React.FC<SecurityViewProps> = ({ data }) => {
  // Extract key metrics for summary cards
  const trends = data.advancedMetrics?.vulnerabilityTrends?. monthly_trends || [];
  const hotspots = data.advancedMetrics?.vulnerabilityTrends?.security_hotspots || [];
  const totalVulnerabilities = data.totalVulnerabilities || 0;
  const criticalCount = trends.reduce((sum, t) => sum + t.critical, 0);
  const openIssues = totalVulnerabilities;
  const fixedThisMonth = trends.length > 0 ? trends[trends.length - 1]?.fixed || 0 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards Section - Top Priority Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Critical Vulnerabilities Card */}
        <div className="theme-card rounded-lg p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-xs theme-text-muted uppercase tracking-wide">Critical</span>
          </div>
          <div className="text-3xl font-bold text-red-400">
            {criticalCount}
          </div>
          <div className="theme-text-muted text-sm mt-1">Requires immediate attention</div>
        </div>

        {/* Open Issues Card */}
        <div className="theme-card rounded-lg p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-orange-400" />
            <span className="text-xs theme-text-muted uppercase tracking-wide">Open Issues</span>
          </div>
          <div className="text-3xl font-bold text-orange-400">
            {openIssues}
          </div>
          <div className="theme-text-muted text-sm mt-1">Total vulnerabilities</div>
        </div>

        {/* Fixed This Month Card */}
        <div className="theme-card rounded-lg p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-xs theme-text-muted uppercase tracking-wide">Fixed</span>
          </div>
          <div className="text-3xl font-bold text-green-400">
            {fixedThisMonth}
          </div>
          <div className="theme-text-muted text-sm mt-1">This month</div>
        </div>

        {/* Security Hotspots Card */}
        <div className="theme-card rounded-lg p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="text-xs theme-text-muted uppercase tracking-wide">Hotspots</span>
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {hotspots.length}
          </div>
          <div className="theme-text-muted text-sm mt-1">Files at risk</div>
        </div>
      </div>

      {/* Main Content Grid - Trends & MTTR side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        <VulnerabilityTrends data={data} />
        <MTTRAnalysis data={data} />
      </div>

      {/* Security Hotspots - Full Width for better visibility */}
      <div className="w-full">
        <SecurityHotspots data={data} />
      </div>
    </div>
  );
};

export default SecurityView;