import React from 'react';
import { SecurityAlertsPieChart } from "@/components/ui/SecurityAlertsPieChart";
import SecurityOverview from './SecurityOverview';
import RecentScans from './RecentScans';
import VulnerabilityTypes from './VulnerabilityTypes';
import PriorityQueue from './PriorityQueue';
import { 
  EnhancedDashboardData, 
  UserInfo, 
  TimeFilterOptions, 
  TimeFilter, 
  Repository 
} from '../../types/dashboard.types';

interface OverviewViewProps {
  data: EnhancedDashboardData;
  userInfo: UserInfo | null;
  timeFilterOptions: TimeFilterOptions;
  timeFilter: TimeFilter;
  selectedRepository: number | 'all';
  repositories: Repository[];
}

const OverviewView: React.FC<OverviewViewProps> = ({ 
  data, 
  userInfo, 
  timeFilterOptions, 
  timeFilter, 
  selectedRepository, 
  repositories 
}) => {
  return (
    <div className="grid lg:grid-cols-3 gap-0">
      {/* Left Side - Security Overview */}
      <div className="lg:col-span-2 p-6 border-r border-white/10">
        <SecurityOverview 
          data={data}
          userInfo={userInfo}
          timeFilterOptions={timeFilterOptions}
          timeFilter={timeFilter}
          selectedRepository={selectedRepository}
          repositories={repositories}
        />
        <RecentScans data={data} />
        <VulnerabilityTypes data={data} />
      </div>

      {/* Right Side - Charts & Analytics */}
      <div className="p-6 flex flex-col">
        {/* Security Alerts Pie Chart */}
        <div className="mb-6">
          <SecurityAlertsPieChart 
            critical={data.criticalIssues}
            high={data.vulnerabilityTypes.filter(v => v.severity === 'high').reduce((sum, v) => sum + v.count, 0)}
            medium={data.vulnerabilityTypes.filter(v => v.severity === 'medium').reduce((sum, v) => sum + v.count, 0)}
            low={data.vulnerabilityTypes.filter(v => v.severity === 'low').reduce((sum, v) => sum + v.count, 0)}
          />
        </div>

        <PriorityQueue 
          data={data}
          selectedRepository={selectedRepository}
          repositories={repositories}
        />
      </div>
    </div>
  );
};

export default OverviewView;