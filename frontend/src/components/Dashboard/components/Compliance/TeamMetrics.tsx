import React from 'react';
import { Users, Clock, Target, Award, TrendingUp, Calendar, Shield, Activity, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface TeamMetricsProps {
  data: EnhancedDashboardData;
}

const TeamMetrics: React.FC<TeamMetricsProps> = ({ data }) => {
  const teamMetrics = data.advancedMetrics?.teamMetrics;
  const securityScore = data.securityScore || 0;
  
  if (!teamMetrics) {
    return (
      <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-[#003D6B] dark:text-white" />
          Team Security Performance
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-white/60">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-white/40" />
          <p>No team performance data available</p>
          <p className="text-xs mt-2">Team metrics will appear after scans</p>
        </div>
      </div>
    );
  }

  // Extract metrics
  const scanFrequency = teamMetrics.scan_frequency_per_week || 0;
  const repositoriesManaged = teamMetrics.repositories_under_management || 0;
  const securityImprovement = teamMetrics.security_score_improvement || 0;
  const automationLevel = teamMetrics.automation_level || 0;
  const policyCompliance = teamMetrics.policy_compliance || 0;
  const trainingCompletion = teamMetrics.security_training_completion || 0;
  const incidentResponseTime = teamMetrics.incident_response_time || "N/A";

  const getPerformanceColor = (value: number, thresholds: {good: number, fair: number}) => {
    if (value >= thresholds.good) return 'text-green-600 dark:text-green-400';
    if (value >= thresholds.fair) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceStatus = (value: number, thresholds: {good: number, fair: number}) => {
    if (value >= thresholds.good) return 'Excellent';
    if (value >= thresholds.fair) return 'Good';
    return 'Needs Work';
  };

  const metrics = [
    {
      key: 'scan_frequency',
      label: 'Scan Frequency',
      value: scanFrequency,
      unit: '/week',
      icon: Activity,
      thresholds: { good: 2, fair: 1 },
      description: 'Weekly scans',
      iconColor: 'text-[#003D6B] dark: text-blue-400'
    },
    {
      key: 'security_improvement',
      label: 'Security Score Trend',
      value: securityImprovement,
      unit: '%',
      icon: TrendingUp,
      thresholds:  { good: 5, fair: 0 },
      description: 'Improvement',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      key: 'automation_level',
      label: 'Automation Level',
      value: automationLevel,
      unit: '%',
      icon:  Zap,
      thresholds: { good: 80, fair: 60 },
      description: 'Automated',
      iconColor: 'text-[#003D6B] dark: text-purple-400'
    },
    {
      key: 'policy_compliance',
      label: 'Policy Compliance',
      value: policyCompliance,
      unit: '%',
      icon:  Award,
      thresholds: { good: 90, fair: 70 },
      description: 'Compliant',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    }
  ];

  const overallPerformance = metrics.reduce((sum, metric) => {
    const normalizedValue = Math.min(100, (metric.value / metric.thresholds.good) * 100);
    return sum + normalizedValue;
  }, 0) / metrics.length;

  return (
    <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-[#003D6B] dark:text-purple-400" />
          Team Security Performance
        </h3>
        <Badge className={`${
          overallPerformance >= 80 ? 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300' :
          overallPerformance >= 60 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark: text-yellow-300' : 
          'bg-red-50 text-red-700 dark: bg-red-500/20 dark:text-red-300'
        } border-0 font-medium`}>
          {overallPerformance >= 80 ? 'Excellent' : 
           overallPerformance >= 60 ? 'Good' :  'Needs Improvement'}
        </Badge>
      </div>
      
      <div className="space-y-6">
        {/* Performance Metrics Grid - 4 Columns */}
        <div className="grid md:grid-cols-4 gap-4">
          {metrics. map((metric) => {
            const IconComponent = metric.icon;
            return (
              <div key={metric.key} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark: border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gray-100 dark:bg-white/5 ${metric.iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <Badge className={`${
                    metric.value >= metric.thresholds.good ? 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300' :
                    metric.value >= metric.thresholds.fair ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300' :
                    'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                  } border-0 text-xs`}>
                    {getPerformanceStatus(metric.value, metric.thresholds)}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-1 ${getPerformanceColor(metric.value, metric.thresholds)}`}>
                    {typeof metric.value === 'number' ? Math.round(metric.value) : metric.value}
                    <span className="text-lg">{metric.unit}</span>
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium text-sm mb-1">{metric.label}</div>
                  <div className="text-gray-500 dark:text-white/60 text-xs">{metric.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Metrics Grid - 3 Columns */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg text-center border border-blue-200 dark:border-blue-500/20">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-blue-100 dark: bg-blue-500/10">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{repositoriesManaged}</div>
            <div className="text-gray-500 dark:text-white/60 text-sm mt-1">Repositories</div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg text-center border border-[#003D6B]/20 dark:border-purple-500/20">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-[#D6E6FF] dark:bg-purple-500/10">
                <Shield className="w-5 h-5 text-[#003D6B] dark:text-purple-400" />
              </div>
            </div>
            <div className={`text-2xl font-bold ${getPerformanceColor(trainingCompletion, {good: 80, fair: 60})}`}>
              {Math.round(trainingCompletion)}%
            </div>
            <div className="text-gray-500 dark:text-white/60 text-sm mt-1">Training Complete</div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg text-center border border-orange-200 dark:border-orange-500/20">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-orange-100 dark: bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{incidentResponseTime}</div>
            <div className="text-gray-500 dark:text-white/60 text-sm mt-1">Response Time</div>
          </div>
        </div>

        {/* Overall Performance Bar */}
        <div className="pt-6 border-t border-gray-200 dark:border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-900 dark:text-white font-semibold text-sm">Overall Team Performance</span>
            <span className="text-gray-500 dark:text-white/60 text-sm">{Math.round(overallPerformance)}% • Target: 80%+</span>
          </div>
          
          <div className="w-full bg-gray-200 dark: bg-white/5 rounded-full h-3 mb-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                overallPerformance >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                overallPerformance >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :  
                'bg-gradient-to-r from-red-500 to-orange-500'
              }`}
              style={{ width: `${Math.min(100, overallPerformance)}%` }}
            ></div>
          </div>
        </div>

        {/* Performance Insight */}
        <div className="p-4 bg-[#D6E6FF] border border-[#003D6B]/20 dark:bg-blue-500/10 dark:border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-[#003D6B]/10 dark: bg-blue-500/20">
              <Target className="w-5 h-5 text-[#003D6B] dark:text-blue-400" />
            </div>
            <div>
              <div className="text-[#003D6B] dark: text-blue-300 font-semibold text-sm mb-1">Performance Insight</div>
              <div className="text-gray-700 dark:text-white/80 text-sm">
                {overallPerformance >= 80 ? 
                  "Exceptional security posture!  Your team is performing above industry standards.  Keep up the excellent work!" :
                overallPerformance >= 60 ? 
                  "Good progress! Focus on increasing scan frequency and automation levels to reach excellence." : 
                  "Consider implementing more automation and regular security training to improve team performance. "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMetrics; 
