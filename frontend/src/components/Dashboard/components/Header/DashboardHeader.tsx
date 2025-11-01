import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  RefreshCw, 
  AlertTriangle, 
  Shield, 
  Zap, 
  Target, 
  Calendar, 
  DollarSign 
} from "lucide-react";
import { EnhancedDashboardData, UserInfo } from '../../types/dashboard.types';

interface DashboardHeaderProps {
  userInfo: UserInfo | null;
  data: EnhancedDashboardData;
  loading: boolean;
  onRefresh: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  userInfo, 
  data, 
  loading, 
  onRefresh 
}) => {
  return (
    <div className="p-6 border-b border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm mb-3">
          <span className="font-medium text-white">SecureThread</span>
          <ChevronRight size={16} className="text-white/60" />
          <span className="font-medium text-white">Enterprise Dashboard</span>
          {userInfo && (
            <>
              <ChevronRight size={16} className="text-white/60" />
              <span className="text-white/60">{userInfo.username}</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={onRefresh} 
            variant="ghost" 
            size="sm" 
            className="text-white/70 hover:text-white"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Enterprise Security Dashboard
          </h1>
          <p className="text-white/80">
            Comprehensive security posture monitoring and compliance tracking
          </p>
          {data.totalProjects === 0 && (
            <p className="text-white/60 text-sm mt-2">
              Welcome to SecureThread! Connect your repositories to unlock advanced security insights.
            </p>
          )}
        </div>
        
        {/* Enhanced Quick Action Badges */}
        <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Critical {data.criticalIssues}
          </Badge>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Score {data.securityScore}%
          </Badge>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            <Zap className="w-3 h-3 mr-1" />
            Custom {data.customScanStats.totalCustomScans}
          </Badge>
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
            <Target className="w-3 h-3 mr-1" />
            Coverage {data.codeCoverage}%
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            <Calendar className="w-3 h-3 mr-1" />
            Today {data.scansToday}
          </Badge>
          {data.advancedMetrics?.technicalDebtDetailed && (
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              <DollarSign className="w-3 h-3 mr-1" />
              Debt ${Math.round(data.advancedMetrics.technicalDebtDetailed.totalDebtCost / 1000)}k
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;