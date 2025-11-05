import React from 'react';
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  valueColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-400",
  valueColor = "theme-text",
  trend
}) => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center">
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
      <div className={`text-2xl font-bold mb-1 ${valueColor}`}>
        {value}
      </div>
      <div className="text-white/70 font-medium text-sm">{title}</div>
      {subtitle && (
        <div className="text-xs text-white/50 mt-1">{subtitle}</div>
      )}
      {trend && (
        <div className={`text-xs mt-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </div>
      )}
    </div>
  );
};

export default MetricCard;