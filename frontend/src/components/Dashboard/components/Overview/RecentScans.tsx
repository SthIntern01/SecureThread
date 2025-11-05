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
  if (!data.recentActivity || data.recentActivity.length === 0) {
    return (
      <div className="theme-card rounded-lg p-6">
        <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Recent Scans
        </h3>
        <div className="text-center py-8 theme-text-muted">
          <Clock className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No recent activity</p>
          <p className="text-sm mt-2">Recent scans will appear here</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: "success" | "warning" | "info") => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "info":
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // 🔧 FIX: Create unique keys and deduplicate activities
  const uniqueActivities = data.recentActivity.reduce((unique: any[], current: any) => {
    const existingIndex = unique.findIndex(item => 
      item.id === current.id && 
      item.scan_type === current.scan_type &&
      item.repository_id === current.repository_id
    );
    
    if (existingIndex === -1) {
      unique.push(current);
    }
    return unique;
  }, []);

  return (
    <div className="theme-card rounded-lg p-6">
      <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        Recent Scans
      </h3>
      
      <div className="space-y-3">
        {uniqueActivities.slice(0, 5).map((activity, index) => (
          <div 
            key={activity.uniqueKey || `${activity.scan_type}-${activity.id}-${activity.repository_id}-${index}`}
            className="flex items-center space-x-3 p-3 theme-bg-subtle rounded-lg"
          >
            <div className="flex-shrink-0">
              {getStatusIcon(activity.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="theme-text font-medium truncate">
                {activity.action}
              </p>
              <div className="flex items-center space-x-2 text-sm theme-text-muted">
                <span>{activity.time}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  activity.scan_type === 'custom' 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {activity.scan_type === 'custom' ? 'Custom' : 'Standard'}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-400' :
                activity.status === 'warning' ? 'bg-yellow-400' :
                'bg-blue-400'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {data.recentActivity.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentScans;