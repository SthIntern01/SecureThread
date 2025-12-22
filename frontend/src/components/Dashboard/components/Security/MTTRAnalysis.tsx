import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { EnhancedDashboardData } from '../../types/dashboard. types';

interface MTTRAnalysisProps {
  data: EnhancedDashboardData;
}

const MTTRAnalysis: React.FC<MTTRAnalysisProps> = ({ data }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const mttr = data.advancedMetrics?.vulnerabilityTrends?.mean_time_to_resolve;
  const securityMetrics = data.advancedMetrics?.codeQualityMetrics;
  
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 300);
  }, []);
  
  if (!mttr && !securityMetrics) {
    return (
      <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-[#003D6B] dark: text-white" />
          Resolution Time (MTTR)
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-white/60">
          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-white/40" />
          <p>No resolution data available</p>
          <p className="text-sm mt-2">Fix vulnerabilities to track resolution times</p>
        </div>
      </div>
    );
  }

  // Generate MTTR data
  const generateMTTRData = () => {
    if (mttr && (mttr. critical > 0 || mttr.high > 0 || mttr. medium > 0 || mttr.low > 0)) {
      return mttr;
    }
    
    return {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
  };

  const mttrData = generateMTTRData();
  
  // Industry benchmark MTTR targets (in days)
  const targets = {
    critical: 7,
    high: 15,
    medium: 30,
    low: 90
  };

  const severityData = [
    { 
      severity: 'Critical', 
      current: mttrData.critical, 
      target: targets.critical, 
      color: '#EF4444',
      icon: '🔴'
    },
    { 
      severity: 'High', 
      current: mttrData.high, 
      target: targets.high, 
      color: '#F97316',
      icon: '🟠'
    },
    { 
      severity: 'Medium', 
      current: mttrData.medium, 
      target: targets.medium, 
      color: '#EAB308',
      icon: '🟡'
    },
    { 
      severity: 'Low', 
      current:  mttrData.low, 
      target: targets.low, 
      color: '#22C55E',
      icon:  '🔵'
    }
  ];

  // Prepare chart data - comparison of current vs target
  const chartData = severityData.map(item => ({
    severity: item.severity,
    current: item.current,
    target: item.target,
    color: item.color,
    icon: item.icon,
    isOnTarget: item.current > 0 && item.current <= item.target
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-white/20 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.icon} {data.severity}</p>
          <p className="text-sm text-gray-600 dark: text-white/60">
            Current: <span className="font-bold">{data.current > 0 ? `${data.current}d` : 'N/A'}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Target: <span className="font-bold">{data.target}d</span>
          </p>
          <p className={`text-xs mt-1 ${data.isOnTarget ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark: text-red-400'}`}>
            {data.current === 0 ? 'No data' : data.isOnTarget ? '✓ On Target' : '⚠ Exceeds Target'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white border border-gray-200 dark: bg-black/10 dark: border-white/10 rounded-lg p-6 h-full flex flex-col transition-all duration-500 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark: text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-[#003D6B] dark:text-white" />
          Resolution Time (MTTR)
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark: text-white/60">Mean Time To Resolve</span>
          <button
            onClick={() => setShowChart(!showChart)}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full transition-colors"
          >
            {showChart ? 'List' : 'Chart'}
          </button>
        </div>
      </div>

      {/* Chart View */}
      {showChart && (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={chartData}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 20, bottom:  5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                type="number"
                stroke="#9CA3AF"
                style={{ fontSize: '11px' }}
                label={{ value: 'Days', position: 'insideBottom', offset: -5, style: { fontSize: '11px', fill: '#9CA3AF' } }}
              />
              <YAxis 
                type="category"
                dataKey="severity"
                stroke="#9CA3AF"
                style={{ fontSize: '11px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="target" 
                fill="#9CA3AF"
                opacity={0.3}
                radius={[0, 4, 4, 0]}
                name="Target"
              />
              <Bar 
                dataKey="current" 
                radius={[0, 8, 8, 0]}
                animationDuration={1500}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.current === 0 ? '#9CA3AF' : entry.color}
                    opacity={entry.current === 0 ? 0.3 : 1}
                  />
                ))}
                <LabelList 
                  dataKey="current" 
                  position="right" 
                  formatter={(value:  number) => value > 0 ? `${value}d` : 'N/A'}
                  style={{ fontSize: '11px', fill: '#6B7280' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* List View */}
      <div className="space-y-3 flex-1">
        {severityData.map((item) => (
          <div key={item.severity} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-gray-900 dark:text-white font-medium min-w-[70px]">{item.severity}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  item.current === 0 ? 'text-gray-400 dark:text-gray-500' : 
                  item.current <= item.target ? 'text-green-600 dark:text-green-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {item.current > 0 ? `${item.current}d` : '--'}
                </div>
                <div className="text-gray-500 dark:text-white/60 text-xs">Current</div>
              </div>
              
              <div className="text-center text-gray-500 dark:text-white/60 text-xs">→</div>
              
              <div className="text-right">
                <div className="text-gray-700 dark:text-white/80 text-sm font-medium">{item.target}d</div>
                <div className="text-gray-500 dark:text-white/60 text-xs">Target</div>
              </div>
              
              <div className="w-6">
                {item.current <= item.target && item.current > 0 ?  (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : item.current > item.target ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400/50" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/20">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark: text-white">
              {data.totalVulnerabilities || 0}
            </div>
            <div className="text-gray-500 dark:text-white/60 text-xs">Open Issues</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#FF6B35] dark:text-orange-400">
              0
            </div>
            <div className="text-gray-500 dark:text-white/60 text-xs">Fixed This Month</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-gray-500 dark:text-white/60 text-xs">
            Industry Avg:  Critical 7d • High 15d • Medium 30d • Low 90d
          </div>
        </div>
      </div>
    </div>
  );
};

export default MTTRAnalysis;
