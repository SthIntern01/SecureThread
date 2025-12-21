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
    <div className="p-6 border-b border-gray-200 dark:border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm mb-3">
          <span className="font-medium text-gray-900 dark:text-white">
            SecureThread
          </span>
          <ChevronRight size={16} className="text-gray-500 dark:text-white/60" />
          <span className="font-medium text-gray-900 dark:text-white">
            Enterprise Dashboard
          </span>
          {userInfo && (
            <>
              <ChevronRight size={16} className="text-gray-500 dark:text-white/60" />
              <span className="text-gray-500 dark:text-white/60">
                {userInfo.username}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={onRefresh} 
            variant="ghost" 
            size="sm" 
            className="text-gray-700 hover:text-gray-900 dark:text-white/70 dark:hover:text-white"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Enterprise Security Dashboard
          </h1>
          <p className="text-gray-700 dark:text-white/80">
            Comprehensive security posture monitoring and compliance tracking
          </p>
          {data.totalProjects === 0 && (
            <p className="text-sm mt-2 text-gray-500 dark:text-white/60">
              Welcome to SecureThread! Connect your repositories to unlock advanced security insights.
            </p>
          )}
        </div>
        
        {/* Badges - Semantic colors stay, but light mode updates */}
        <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
          <Badge className="bg-red-50 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Critical {data.criticalIssues}
          </Badge>
          <Badge className="bg-green-50 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Score {data.securityScore}%
          </Badge>
          <Badge className="bg-[#E8F0FF] text-[#003D6B] border-[#003D6B]/30 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30">
            <Zap className="w-3 h-3 mr-1" />
            Custom {data.customScanStats. totalCustomScans}
          </Badge>
          <Badge className="bg-[#D6E6FF] text-[#003D6B] border-[#003D6B]/30 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30">
            <Target className="w-3 h-3 mr-1" />
            Coverage {data.codeCoverage}%
          </Badge>
          <Badge className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30">
            <Calendar className="w-3 h-3 mr-1" />
            Today {data.scansToday}
          </Badge>
          {data.advancedMetrics?. technicalDebtDetailed && (
            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30">
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
