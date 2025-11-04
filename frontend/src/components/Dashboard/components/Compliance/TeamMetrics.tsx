import React from 'react';
import { Users, TrendingUp, Target, Award, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface TeamMetricsProps {
  data: EnhancedDashboardData;
}

const TeamMetrics: React.FC<TeamMetricsProps> = ({ data }) => {
  const teamMetrics = data.advancedMetrics?.teamMetrics;
  const securityScore = data.securityScore || 0;
  const totalVulnerabilities = data.totalVulnerabilities || 0;
  
  if (!teamMetrics) {
    return (
      <div className="bg-black/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Team Security Performance
        </h3>
        <div className="text-center py-8 text-white/60">
          <Users className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No team performance data available</p>
        </div>
      </div>
    );
  }

  // Calculate derived metrics
  const scanFrequency = teamMetrics.scan_frequency_per_week || 0;
  const repositoriesManaged = teamMetrics.repositories_under_management || 0;
  const securityImprovement = teamMetrics.security_score_improvement || 0;
  const automationLevel = teamMetrics.automation_level || 0;
  const policyCompliance = teamMetrics.policy_compliance || 0;
  const trainingCompletion = teamMetrics.security_training_completion || 0;
  const incidentResponseTime = teamMetrics.incident_response_time || "N/A";
  const developerSecurityScore = teamMetrics.developer_security_score || securityScore;

  // Performance indicators
  const getPerformanceColor = (value: number, thresholds: {good: number, fair: number}) => {
    if (value >= thresholds.good) return 'text-green-400';
    if (value >= thresholds.fair) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceStatus = (value: number, thresholds: {good: number, fair: number}) => {
    if (value >= thresholds.good) return 'Excellent';
    if (value >= thresholds.fair) return 'Good';
    return 'Needs Improvement';
  };

  const metrics = [
    {
      key: 'scan_frequency',
      label: 'Scan Frequency',
      value: scanFrequency,
      unit: '/week',
      icon: <Clock className="w-4 h-4" />,
      thresholds: { good: 2, fair: 1 },
      description: 'Weekly security scans'
    },
    {
      key: 'security_improvement',
      label: 'Security Score Trend',
      value: securityImprovement,
      unit: '%',
      icon: <TrendingUp className="w-4 h-4" />,
      thresholds: { good: 5, fair: 0 },
      description: 'Improvement over time'
    },
    {
      key: 'automation_level',
      label: 'Automation Level',
      value: automationLevel,
      unit: '%',
      icon: <Target className="w-4 h-4" />,
      thresholds: { good: 80, fair: 60 },
      description: 'Process automation'
    },
    {
      key: 'policy_compliance',
      label: 'Policy Compliance',
      value: policyCompliance,
      unit: '%',
      icon: <Award className="w-4 h-4" />,
      thresholds: { good: 90, fair: 70 },
      description: 'Security policy adherence'
    }
  ];

  const overallPerformance = metrics.reduce((sum, metric) => {
    const normalizedValue = Math.min(100, (metric.value / metric.thresholds.good) * 100);
    return sum + normalizedValue;
  }, 0) / metrics.length;

  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Team Security Performance
      </h3>
      
      <div className="space-y-6">
        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div key={metric.key} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={getPerformanceColor(metric.value, metric.thresholds)}>
                    {metric.icon}
                  </div>
                  <span className="text-white/70 text-sm">{metric.label}</span>
                </div>
                <Badge className={`${
                  metric.value >= metric.thresholds.good ? 'bg-green-500/20 text-green-300' :
                  metric.value >= metric.thresholds.fair ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                } border-0 text-xs`}>
                  {getPerformanceStatus(metric.value, metric.thresholds)}
                </Badge>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <div className={`text-2xl font-bold ${getPerformanceColor(metric.value, metric.thresholds)}`}>
                    {typeof metric.value === 'number' ? Math.round(metric.value) : metric.value}
                    <span className="text-lg">{metric.unit}</span>
                  </div>
                  <div className="text-white/60 text-xs">{metric.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{repositoriesManaged}</div>
            <div className="text-white/60 text-sm">Repositories</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${getPerformanceColor(trainingCompletion, {good: 80, fair: 60})}`}>
              {Math.round(trainingCompletion)}%
            </div>
            <div className="text-white/60 text-sm">Training Complete</div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-400">{incidentResponseTime}</div>
            <div className="text-white/60 text-sm">Response Time</div>
          </div>
        </div>

        {/* Overall Performance Summary */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Overall Team Performance</span>
            <Badge className={`${
              overallPerformance >= 80 ? 'bg-green-500/20 text-green-300' :
              overallPerformance >= 60 ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            } border-0`}>
              {overallPerformance >= 80 ? 'Excellent' :
               overallPerformance >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                overallPerformance >= 80 ? 'bg-green-500' :
                overallPerformance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, overallPerformance)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-white/60">
            <span>{Math.round(overallPerformance)}% Performance Score</span>
            <span>Target: 80%+</span>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="text-blue-300 text-sm font-medium mb-1">💡 Performance Insight</div>
          <div className="text-white/80 text-sm">
            {overallPerformance >= 80 ? 
              "Excellent security posture! Your team is performing above industry standards." :
            overallPerformance >= 60 ?
              "Good progress! Focus on increasing scan frequency and automation levels." :
              "Consider implementing more automation and regular security training to improve performance."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMetrics;