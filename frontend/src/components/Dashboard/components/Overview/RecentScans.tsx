import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, AlertTriangle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EnhancedDashboardData, TimeFilterOptions, TimeFilter } from '../../types/dashboard. types';

interface RecentScansProps {
  data: EnhancedDashboardData;
  timeFilterOptions: TimeFilterOptions;
  timeFilter: TimeFilter;
  selectedRepository:  number | 'all';
  repositories: any[];
}

const RecentScans: React.FC<RecentScansProps> = ({ 
  data, 
  timeFilterOptions, 
  timeFilter, 
  selectedRepository, 
  repositories 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showChart, setShowChart] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 300);
  }, []);

  if (!data. recentActivity || data.recentActivity.length === 0) {
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
      item.repository_id === current.repository_id
    );
    
    if (existingIndex === -1) {
      unique.push(current);
    }
    return unique;
  }, []);

  // Prepare data for chart - scan activity by hour
  const activityByHour = uniqueActivities.reduce((acc: any, activity) => {
    const hour = new Date(`1970/01/01 ${activity.time}`).getHours();
    const hourLabel = `${hour}:00`;
    
    if (!acc[hourLabel]) {
      acc[hourLabel] = { hour: hourLabel, scans: 0, success: 0, warning: 0, info: 0 };
    }
    
    acc[hourLabel].scans++;
    acc[hourLabel][activity.status]++;
    
    return acc;
  }, {});

  const chartData = Object.values(activityByHour).slice(-12); // Last 12 hours

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload. length) {
      return (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-white/20 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{payload[0].payload.hour}</p>
          <p className="text-sm text-gray-600 dark:text-white/60">Total Scans: <span className="font-bold">{payload[0].payload.scans}</span></p>
          {payload[0].payload.success > 0 && <p className="text-sm text-green-600 dark: text-green-400">✓ Success: {payload[0].payload. success}</p>}
          {payload[0].payload.warning > 0 && <p className="text-sm text-yellow-600 dark:text-yellow-400">⚠ Warning: {payload[0].payload.warning}</p>}
          {payload[0].payload.info > 0 && <p className="text-sm text-blue-600 dark:text-blue-400">ℹ Info: {payload[0].payload. info}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6 transition-all duration-500 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-[#2D5FFF] dark:text-white" />
          Recent Scans
        </h3>
        <button
          onClick={() => setShowChart(!showChart)}
          className="px-3 py-1 text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full transition-colors flex items-center gap-1"
        >
          <Activity className="w-3 h-3" />
          {showChart ? 'List View' : 'Chart View'}
        </button>
      </div>

      {/* Chart View */}
      {showChart && chartData.length > 0 && (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="hour" 
                stroke="#9CA3AF"
                style={{ fontSize: '11px' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                style={{ fontSize: '11px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="scans" radius={[8, 8, 0, 0]} animationDuration={1500}>
                {chartData.map((entry:  any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.warning > 0 ? '#EAB308' :
                      entry. success > 0 ? '#22C55E' :  '#3B82F6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* List View */}
      <div className="space-y-3">
        {uniqueActivities.slice(0, 5).map((activity, index) => (
          <div 
            key={activity.uniqueKey || `${activity.scan_type}-${activity.id}-${activity.repository_id}-${index}`}
            className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
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
                <span className={`px-2 py-1 rounded text-xs ${
                  activity.scan_type === 'custom' 
                    ? 'bg-[#E8F0FF] text-[#2D5FFF] dark:bg-purple-500/20 dark:text-purple-300' 
                    : 'bg-[#D6E6FF] text-[#004E89] dark:bg-blue-500/20 dark:text-blue-300'
                }`}>
                  {activity.scan_type === 'custom' ? 'Custom' : 'Standard'}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-500 dark:bg-green-400' :
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
            View all activity ({data.recentActivity.length} total)
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentScans;
