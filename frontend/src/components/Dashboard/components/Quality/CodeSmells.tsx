import React from 'react';
import { AlertCircle, Bug, Zap, Info, AlertTriangle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface CodeSmellsProps {
  data:  EnhancedDashboardData;
}

const CodeSmells: React.FC<CodeSmellsProps> = ({ data }) => {
  const codeMetrics = data.advancedMetrics?.codeQualityMetrics;
  const codeSmells = codeMetrics?.code_smells;
  const vulnerabilityTypes = data.advancedMetrics?.vulnerabilityTrends?.top_vulnerability_types || [];
  
  if (!codeSmells && vulnerabilityTypes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 dark: bg-black/10 dark: border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4 flex items-center">
          <Bug className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
          Code Smells & Issues
          <Badge className="ml-3 bg-green-50 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30">All Clear</Badge>
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-white/60">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-green-600 dark:text-green-400 font-medium text-lg">No code smells detected</p>
          <p className="text-sm mt-2">Your code quality is excellent! </p>
        </div>
      </div>
    );
  }

  const smellCategories = [
    {
      key: 'blocker',
      label: 'Blocker',
      description: 'Must fix immediately',
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-500/10',
      borderColor: 'border-red-300 dark:border-red-500/30',
      count: codeSmells?.blocker || 0,
      priority: 1
    },
    {
      key: 'critical',
      label: 'Critical',
      description: 'Fix before release',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark: bg-orange-500/10',
      borderColor: 'border-orange-300 dark:border-orange-500/30',
      count: codeSmells?. critical || 0,
      priority: 2
    },
    {
      key: 'major',
      label: 'Major',
      description: 'Fix in current sprint',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
      borderColor: 'border-yellow-300 dark: border-yellow-500/30',
      count: codeSmells?.major || 0,
      priority: 3
    },
    {
      key: 'minor',
      label: 'Minor',
      description: 'Fix when convenient',
      icon: <Info className="w-5 h-5" />,
      color: 'text-[#003D6B] dark: text-blue-400',
      bgColor:  'bg-[#D6E6FF] dark:bg-blue-500/10',
      borderColor: 'border-[#003D6B]/30 dark:border-blue-500/30',
      count: codeSmells?.minor || 0,
      priority: 4
    },
    {
      key:  'info',
      label: 'Info',
      description: 'Informational only',
      icon: <Info className="w-5 h-5" />,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor:  'bg-gray-100 dark:bg-gray-500/10',
      borderColor:  'border-gray-300 dark:border-gray-500/30',
      count: codeSmells?.info || 0,
      priority: 5
    }
  ];

  const totalSmells = smellCategories.reduce((sum, category) => sum + category.count, 0);
  const hasSmells = totalSmells > 0;
  const criticalSmells = smellCategories.filter(c => c.priority <= 2 && c.count > 0);

  return (
    <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Bug className="w-5 h-5 mr-2 text-[#003D6B] dark: text-purple-400" />
          Code Smells & Quality Issues
          {criticalSmells.length > 0 && (
            <Badge className="ml-3 bg-red-50 text-red-700 border-red-300 dark: bg-red-500/20 dark:text-red-300 dark:border-red-500/30 animate-pulse">
              {criticalSmells.reduce((sum, c) => sum + c.count, 0)} High Priority
            </Badge>
          )}
        </h3>
        <div className="text-sm text-gray-500 dark:text-white/60">
          {totalSmells} total issues
        </div>
      </div>

      {/* Priority Alert */}
      {criticalSmells.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 dark: bg-red-500/10 dark:border-red-500/30 rounded-lg flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-red-700 dark:text-red-300 font-medium text-sm">Critical Issues Detected</div>
            <div className="text-red-600 dark:text-red-400/80 text-xs mt-1">
              {criticalSmells. reduce((sum, c) => sum + c.count, 0)} high-priority code issues require immediate attention. 
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Code Quality Issues - 2 Column Grid */}
        <div>
          <div className="text-gray-700 dark:text-white/70 text-sm font-medium mb-4 flex items-center">
            <div className="w-1 h-4 bg-[#003D6B] dark:bg-purple-500 rounded-full mr-2"></div>
            Code Quality Issues
          </div>
          
          {hasSmells ?  (
            <div className="grid md:grid-cols-2 gap-3">
              {smellCategories.filter(category => category.count > 0).map((category) => (
                <div 
                  key={category.key}
                  className={`p-4 rounded-lg border ${category.borderColor} ${category.bgColor} hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`${category.color} mt-0.5`}>
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${category.color} mb-1`}>
                          {category.label}
                        </div>
                        <div className="text-gray-600 dark:text-white/60 text-xs">
                          {category.description}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${category.bgColor} ${category.color} border-0 text-lg px-3 py-1`}>
                      {category.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 dark:bg-white/5 rounded-lg">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                <Bug className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-green-600 dark:text-green-400 font-medium">No code smells detected</p>
              <p className="text-xs text-gray-500 dark:text-white/60 mt-1">Your code quality is excellent!</p>
            </div>
          )}
        </div>

        {/* Security-Related Code Issues */}
        {vulnerabilityTypes.length > 0 && (
          <div>
            <div className="text-gray-700 dark:text-white/70 text-sm font-medium mb-4 flex items-center">
              <div className="w-1 h-4 bg-red-500 rounded-full mr-2"></div>
              Security-Related Code Issues
            </div>
            
            <div className="grid md:grid-cols-2 gap-3">
              {vulnerabilityTypes.slice(0, 6).map((vulnType, index) => (
                <div 
                  key={`${vulnType. type}-${index}`}
                  className={`p-4 rounded-lg border ${
                    vulnType.critical > 0 ? 'border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10' : 
                    vulnType.high > 5 ? 'border-orange-300 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10' :
                    vulnType.high > 0 ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-500/30 dark:bg-yellow-500/10' :
                    'border-blue-300 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
                  } hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`w-3 h-3 rounded-full mt-1. 5 ${
                        vulnType.critical > 0 ? 'bg-red-600 dark:bg-red-400' : 
                        vulnType.high > 5 ? 'bg-orange-600 dark:bg-orange-400' :
                        vulnType.high > 0 ? 'bg-yellow-600 dark:bg-yellow-400' :  'bg-blue-600 dark:bg-blue-400'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-gray-900 dark:text-white font-medium capitalize text-sm mb-1">
                          {vulnType.type. replace(/_/g, ' ')}
                        </div>
                        <div className="text-gray-600 dark:text-white/60 text-xs">
                          {vulnType.critical > 0 && (
                            <span className="text-red-600 dark:text-red-400 font-medium">{vulnType.critical} critical</span>
                          )}
                          {vulnType.critical > 0 && vulnType.high > 0 && <span className="mx-1">•</span>}
                          {vulnType.high > 0 && (
                            <span className="text-orange-600 dark:text-orange-400">{vulnType.high} high</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 dark:text-white font-bold text-lg">{vulnType.count}</div>
                      <div className="text-gray-500 dark:text-white/60 text-xs">issues</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-white/20">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className={`text-2xl font-bold ${hasSmells ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                {totalSmells}
              </div>
              <div className="text-gray-500 dark:text-white/60 text-xs">Quality Issues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {smellCategories.filter(c => c.priority <= 2).reduce((sum, c) => sum + c.count, 0)}
              </div>
              <div className="text-gray-500 dark:text-white/60 text-xs">High Priority</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {vulnerabilityTypes.reduce((sum, v) => sum + (v.critical || 0), 0)}
              </div>
              <div className="text-gray-500 dark:text-white/60 text-xs">Security Issues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#003D6B] dark: text-blue-400">
                {vulnerabilityTypes.length}
              </div>
              <div className="text-gray-500 dark:text-white/60 text-xs">Vuln Types</div>
            </div>
          </div>
          
          {(hasSmells || vulnerabilityTypes.length > 0) && (
            <div className="mt-4 p-3 bg-[#D6E6FF] dark:bg-blue-500/10 rounded-lg text-center">
              <div className="text-gray-700 dark:text-white/70 text-sm">
                💡 <span className="font-medium">Recommendation:</span> Prioritize fixing blocker and critical issues first for maximum impact
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeSmells;
