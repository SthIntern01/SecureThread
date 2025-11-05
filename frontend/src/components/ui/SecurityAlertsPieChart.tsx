import React, { useState, useMemo } from 'react';
import { Zap, ChevronDown } from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';

interface SecurityAlertsPieChartProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
  totalVulnerabilities?: number;
  rawSecurityMetrics?: any; // Raw security metrics from API
  vulnerabilityTrends?: any; // Raw vulnerability trends from API
}

export const SecurityAlertsPieChart: React.FC<SecurityAlertsPieChartProps> = ({
  critical,
  high,
  medium,
  low,
  totalVulnerabilities,
  rawSecurityMetrics,
  vulnerabilityTrends
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const { actualTheme } = useTheme();

  // 🔧 DYNAMIC CALCULATION - Recalculate from raw data every time
  const dynamicVulnerabilityData = useMemo(() => {
    console.log('🔄 RECALCULATING DYNAMIC VULNERABILITY DATA');
    console.log('📥 Props received:', { critical, high, medium, low, totalVulnerabilities });
    console.log('📥 Raw security metrics:', rawSecurityMetrics);
    console.log('📥 Raw vulnerability trends:', vulnerabilityTrends);
    
    // Start with the passed props
    let finalBreakdown = { critical, high, medium, low };
    
    // Try to get more accurate data from raw security metrics
    if (rawSecurityMetrics) {
      const fromSecurityMetrics = {
        critical: rawSecurityMetrics.critical_vulnerabilities || critical,
        high: rawSecurityMetrics.high_vulnerabilities || high,
        medium: rawSecurityMetrics.medium_vulnerabilities || medium,
        low: rawSecurityMetrics.low_vulnerabilities || low
      };
      
      console.log('📊 From security metrics:', fromSecurityMetrics);
      finalBreakdown = fromSecurityMetrics;
    }
    
    // Try to get data from vulnerability trends risk distribution
    if (vulnerabilityTrends?.security_metrics?.risk_distribution) {
      const riskDist = vulnerabilityTrends.security_metrics.risk_distribution;
      const fromRiskDistribution = {
        critical: riskDist.critical || finalBreakdown.critical,
        high: riskDist.high || finalBreakdown.high,
        medium: riskDist.medium || finalBreakdown.medium,
        low: riskDist.low || finalBreakdown.low
      };
      
      console.log('📊 From risk distribution:', fromRiskDistribution);
      finalBreakdown = fromRiskDistribution;
    }
    
    // Validate against total
    const calculatedTotal = finalBreakdown.critical + finalBreakdown.high + finalBreakdown.medium + finalBreakdown.low;
    const expectedTotal = totalVulnerabilities || calculatedTotal;
    
    console.log('🧮 VALIDATION:');
    console.log('- Calculated total:', calculatedTotal);
    console.log('- Expected total:', expectedTotal);
    console.log('- Final breakdown:', finalBreakdown);
    
    // If totals don't match and we have an expected total, adjust proportionally
    if (calculatedTotal !== expectedTotal && expectedTotal > 0 && calculatedTotal > 0) {
      const scaleFactor = expectedTotal / calculatedTotal;
      finalBreakdown = {
        critical: Math.round(finalBreakdown.critical * scaleFactor),
        high: Math.round(finalBreakdown.high * scaleFactor),
        medium: Math.round(finalBreakdown.medium * scaleFactor),
        low: Math.round(finalBreakdown.low * scaleFactor)
      };
      
      console.log('🔧 SCALED BREAKDOWN:', finalBreakdown);
      console.log('🔧 SCALED TOTAL:', finalBreakdown.critical + finalBreakdown.high + finalBreakdown.medium + finalBreakdown.low);
    }
    
    return {
      breakdown: finalBreakdown,
      total: expectedTotal,
      isValid: calculatedTotal > 0
    };
  }, [critical, high, medium, low, totalVulnerabilities, rawSecurityMetrics, vulnerabilityTrends]);

  const { breakdown, total, isValid } = dynamicVulnerabilityData;

  // Calculate percentages dynamically
  const calculatePercentage = (value: number, totalVal: number) => {
    return totalVal > 0 ? (value / totalVal) * 100 : 0;
  };

  const severityData = [
    {
      name: 'Critical',
      value: breakdown.critical,
      percentage: calculatePercentage(breakdown.critical, total),
      color: '#ef4444',
      bgColor: 'bg-red-500'
    },
    {
      name: 'High', 
      value: breakdown.high,
      percentage: calculatePercentage(breakdown.high, total),
      color: '#f97316',
      bgColor: 'bg-orange-500'
    },
    {
      name: 'Medium',
      value: breakdown.medium,
      percentage: calculatePercentage(breakdown.medium, total),
      color: '#eab308',
      bgColor: 'bg-yellow-500'
    },
    {
      name: 'Low',
      value: breakdown.low,
      percentage: calculatePercentage(breakdown.low, total),
      color: '#22c55e',
      bgColor: 'bg-green-500'
    }
  ].filter(item => item.value > 0);

  // Get current display data
  const getCurrentData = () => {
    if (selectedSeverity === 'all') {
      return {
        displayValue: total,
        label: 'Total',
        severityBreakdown: severityData
      };
    } else {
      const severityItem = severityData.find(item => item.name.toLowerCase() === selectedSeverity);
      return {
        displayValue: severityItem?.value || 0,
        label: severityItem?.name || 'Unknown',
        severityBreakdown: severityData
      };
    }
  };

  const currentData = getCurrentData();

  // Create dynamic pie chart
  const createPieChart = () => {
    if (!isValid || total === 0) {
      return (
        <div className="w-48 h-48 flex items-center justify-center relative">
          <div className="w-40 h-40 bg-green-500/20 rounded-full border-4 border-green-500/40 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">0</div>
              <div className="text-green-300 text-sm">No Issues</div>
            </div>
          </div>
        </div>
      );
    }

    const size = 192;
    const center = size / 2;
    const radius = 70;
    const strokeWidth = 20;

    let cumulativePercentage = 0;

    return (
      <div className="relative w-48 h-48">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={actualTheme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          
          {/* Dynamic severity segments */}
          {severityData.map((item, index) => {
            const strokeDasharray = 2 * Math.PI * radius;
            const strokeOffset = strokeDasharray - (item.percentage / 100) * strokeDasharray;
            const rotateAngle = (cumulativePercentage / 100) * 360;
            
            cumulativePercentage += item.percentage;
            
            return (
              <circle
                key={item.name}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className={`transition-all duration-300 ${
                  selectedSeverity === 'all' || selectedSeverity === item.name.toLowerCase() 
                    ? 'opacity-100' 
                    : 'opacity-30'
                }`}
                style={{
                  transform: `rotate(${rotateAngle}deg)`,
                  transformOrigin: `${center}px ${center}px`,
                }}
              />
            );
          })}
        </svg>
        
        {/* Dynamic center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-gray-200/60 dark:bg-black/40 rounded-full w-20 h-20 flex items-center justify-center backdrop-blur-sm border-2 border-gray-300 dark:border-white/20">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentData.displayValue}</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">{currentData.label}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  return (
    <div className="bg-white/90 dark:bg-white/10 rounded-lg p-6 backdrop-blur-sm border-2 border-gray-300 dark:border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-500 dark:text-yellow-400" />
          Security Alerts
        </h3>
        <div className="text-red-600 dark:text-red-400 font-bold text-lg">
          {total}
        </div>
      </div>

      {/* Debug info (remove in production) */}
      <div className="mb-4 p-2 bg-blue-100 dark:bg-blue-500/10 rounded text-xs text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30">
        Debug: C:{breakdown.critical} H:{breakdown.high} M:{breakdown.medium} L:{breakdown.low} = {breakdown.critical + breakdown.high + breakdown.medium + breakdown.low}
      </div>

      <div className="relative mb-6">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full bg-white dark:bg-white/10 rounded-lg px-4 py-2 flex items-center justify-between text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-colors border-2 border-gray-300 dark:border-white/20"
        >
          <span className="capitalize">
            {severityOptions.find(opt => opt.value === selectedSeverity)?.label}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900/95 rounded-lg border-2 border-gray-300 dark:border-white/20 z-10 backdrop-blur-sm shadow-xl">
            {severityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedSeverity(option.value as any);
                  setShowDropdown(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  selectedSeverity === option.value 
                    ? 'bg-gray-200 dark:bg-white/20 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-700 dark:text-white/70'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center mb-6">
        {createPieChart()}
      </div>

      {/* Dynamic legend */}
      <div className="space-y-3">
        {currentData.severityBreakdown.map((item) => (
          <div key={item.name} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-white/5 rounded-lg border-2 border-gray-300 dark:border-white/10">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${item.bgColor} border-2 border-gray-400 dark:border-white/20`}></div>
              <span className="text-gray-900 dark:text-white/90 font-medium">{item.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 dark:text-white font-bold">{item.value}</span>
              <span className="text-gray-600 dark:text-white/50 text-sm">({item.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic summary */}
      {isValid && total > 0 && (
        <div className="mt-6 pt-4 border-t-2 border-gray-300 dark:border-white/20">
          <div className="text-center p-3 bg-gray-100 dark:bg-white/5 rounded-lg border-2 border-gray-300 dark:border-white/10">
            <div className="text-gray-700 dark:text-white/70 text-sm">
              {breakdown.critical > 0 ? (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  🚨 {breakdown.critical} critical issues require immediate attention
                </span>
              ) : breakdown.high > 0 ? (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  ⚠️ {breakdown.high} high-risk issues need review
                </span>
              ) : (
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                  📋 Monitor {breakdown.medium + breakdown.low} medium/low priority issues
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};