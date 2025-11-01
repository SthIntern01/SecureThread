import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, Clock } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface RecentScansProps {
  data: EnhancedDashboardData;
}

const RecentScans: React.FC<RecentScansProps> = ({ data }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "warning":
        return <Activity className="w-4 h-4 text-yellow-400" />;
      case "info":
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getScanTypeBadge = (scanType: 'standard' | 'custom') => {
    return (
      <Badge className={`text-xs ${
        scanType === 'custom' 
          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      }`}>
        {scanType === 'custom' ? 'Custom' : 'Standard'}
      </Badge>
    );
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-accent" />
        Recent Scans
      </h3>
      <div className="space-y-2">
        {data.recentActivity.length > 0 ? (
          data.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/20">
              <div className="flex items-center space-x-3">
                {getStatusIcon(activity.status)}
                <div>
                  <div className="text-white font-medium text-sm">{activity.action}</div>
                  <div className="text-white/60 text-xs">{activity.time}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getScanTypeBadge(activity.scan_type)}
                <Badge
                  className={`text-xs ${
                    activity.status === "success"
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : activity.status === "warning"
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  }`}
                >
                  {activity.status === "success" ? "Clean" : 
                   activity.status === "warning" ? "Issues" : "Running"}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-white/60">
            <Activity className="w-12 h-12 mx-auto mb-3 text-white/40" />
            <p>No recent scans found</p>
            <p className="text-sm text-white/40 mt-1">
              Start scanning to see activity here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentScans;