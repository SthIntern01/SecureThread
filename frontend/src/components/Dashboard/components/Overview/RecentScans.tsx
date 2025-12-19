import React from 'react';
import { Clock, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { EnhancedDashboardData, TimeFilterOptions, TimeFilter } from '../../types/dashboard.types';

interface RecentScansProps {
  data: EnhancedDashboardData;
  timeFilterOptions: TimeFilterOptions;
  timeFilter: TimeFilter;
  selectedRepository: number | 'all';
  repositories: any[];
}

const RecentScans: React.FC<RecentScansProps> = ({ 
  data, 
  timeFilterOptions, 
  timeFilter, 
  selectedRepository, 
  repositories 
}) => {
  if (! data.recentActivity || data.recentActivity.length === 0) {
    return (
      <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-[#2D5FFF] dark:text-white" />
          Recent Scans
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-white/60">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-white/40" />
          <p>No recent activity</p>
          <p className="text-sm mt-2">Recent scans will appear here</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: "success" | "warning" | "info") => {
    switch (status) {
      case "success": 
        return <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />;
      case "warning": 
        return <AlertTriangle className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />;
      case "info": 
        return <AlertCircle className="w-4 h-4 text-[#2D5FFF] dark:text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const uniqueActivities = data.recentActivity.reduce((unique:  any[], current: any) => {
    const existingIndex = unique.findIndex(item => 
      item.id === current.id && 
      item.scan_type === current.scan_type &&
      item.repository_id === current. repository_id
    );
    
    if (existingIndex === -1) {
      unique.push(current);
    }
    return unique;
  }, []);

  return (
    <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-[#2D5FFF] dark:text-white" />
        Recent Scans
      </h3>
      
      <div className="space-y-3">
        {uniqueActivities.slice(0, 5).map((activity, index) => (
          <div 
            key={activity.uniqueKey || `${activity.scan_type}-${activity.id}-${activity.repository_id}-${index}`}
            className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg"
          >
            <div className="flex-shrink-0">
              {getStatusIcon(activity.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-white font-medium truncate">
                {activity.action}
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-white/60">
                <span>{activity.time}</span>
                <span>•</span>
                {/* LIGHT: Blue badges, DARK: Original colors */}
                <span className={`px-2 py-1 rounded text-xs ${
                  activity. scan_type === 'custom' 
                    ? 'bg-[#E8F0FF] text-[#2D5FFF] dark:bg-purple-500/20 dark:text-purple-300' 
                    : 'bg-[#D6E6FF] text-[#004E89] dark:bg-blue-500/20 dark:text-blue-300'
                }`}>
                  {activity.scan_type === 'custom' ? 'Custom' : 'Standard'}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              {/* Status dots - keep semantic colors */}
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ?  'bg-green-500 dark:bg-green-400' :
                activity.status === 'warning' ? 'bg-yellow-500 dark:bg-yellow-400' :
                'bg-[#2D5FFF] dark:bg-blue-400'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {data.recentActivity.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-[#2D5FFF] hover:text-[#004E89] dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentScans;