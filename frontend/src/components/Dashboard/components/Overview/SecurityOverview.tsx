import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { EnhancedDashboardData, UserInfo, TimeFilterOptions, TimeFilter, Repository } from '../../types/dashboard.types';

interface SecurityOverviewProps {
  data: EnhancedDashboardData;
  userInfo: UserInfo | null;
  timeFilterOptions: TimeFilterOptions;
  timeFilter: TimeFilter;
  selectedRepository: number | 'all';
  repositories: Repository[];
}

const SecurityOverview: React.FC<SecurityOverviewProps> = ({ 
  data, 
  userInfo, 
  timeFilterOptions, 
  timeFilter, 
  selectedRepository, 
  repositories 
}) => {
  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold theme-text flex items-center">
          <Shield className="w-5 h-5 mr-2 text-accent" />
          Security Overview
        </h3>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            Repos: {data.totalProjects}
          </Badge>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            Custom: {data.customScanStats.totalCustomScans}
          </Badge>
        </div>
      </div>
      
      <div className="text-center mb-6">
        <div className="text-3xl font-bold theme-text mb-2">
          {userInfo?.username}'s Security Posture
        </div>
        <div className={`text-xl font-semibold ${getSecurityScoreColor(data.securityScore)}`}>
          {data.securityScore}% Secure
        </div>
        <div className="theme-text-muted text-sm mt-2">
          {selectedRepository === 'all' 
            ? `Monitoring ${data.totalProjects} repositories`
            : `Monitoring ${repositories.find(r => r.id === selectedRepository)?.name || 'selected repository'}`
          } • {timeFilterOptions[timeFilter].label.toLowerCase()}
        </div>
      </div>
    </div>
  );
};

export default SecurityOverview;