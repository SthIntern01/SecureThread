import React from 'react';
import { AlertCircle, Bug, Zap, Info, AlertTriangle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface CodeSmellsProps {
  data: EnhancedDashboardData;
}

const CodeSmells: React.FC<CodeSmellsProps> = ({ data }) => {
  const codeMetrics = data.advancedMetrics?.codeQualityMetrics;
  const codeSmells = codeMetrics?.code_smells;
  const vulnerabilityTypes = data.advancedMetrics?.vulnerabilityTrends?.top_vulnerability_types || [];
  
  if (!codeSmells && vulnerabilityTypes.length === 0) {
    return (
      <div className="theme-card rounded-lg p-6">
        <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
          <Bug className="w-5 h-5 mr-2 text-green-400" />
          Code Smells & Issues
          <Badge className="ml-3 bg-green-500/20 text-green-300">All Clear</Badge>
        </h3>
        <div className="text-center py-8 theme-text-muted">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-green-400 font-medium text-lg">No code smells detected</p>
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
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      count: codeSmells?.blocker || 0,
      priority: 1
    },
    {
      key: 'critical',
      label: 'Critical', 
      description: 'Fix before release',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      count: codeSmells?.critical || 0,
      priority: 2
    },
    {
      key: 'major',
      label: 'Major',
      description: 'Fix in current sprint',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      count: codeSmells?.major || 0,
      priority: 3
    },
    {
      key: 'minor',
      label: 'Minor',
      description: 'Fix when convenient',
      icon: <Info className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      count: codeSmells?.minor || 0,
      priority: 4
    },
    {
      key: 'info',
      label: 'Info',
      description: 'Informational only',
      icon: <Info className="w-5 h-5" />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
      count: codeSmells?.info || 0,
      priority: 5
    }
  ];

  const totalSmells = smellCategories.reduce((sum, category) => sum + category.count, 0);
  const hasSmells = totalSmells > 0;
  const criticalSmells = smellCategories.filter(c => c.priority <= 2 && c.count > 0);

  return (
    <div className="theme-card rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold theme-text flex items-center">
          <Bug className="w-5 h-5 mr-2 text-purple-400" />
          Code Smells & Quality Issues
          {criticalSmells.length > 0 && (
            <Badge className="ml-3 bg-red-500/20 text-red-300 animate-pulse">
              {criticalSmells.reduce((sum, c) => sum + c.count, 0)} High Priority
            </Badge>
          )}
        </h3>
        <div className="text-sm theme-text-muted">
          {totalSmells} total issues
        </div>
      </div>

      {/* Priority Alert */}
      {criticalSmells.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-red-300 font-medium text-sm">Critical Issues Detected</div>
            <div className="text-red-400/80 text-xs mt-1">
              {criticalSmells.reduce((sum, c) => sum + c.count, 0)} high-priority code issues require immediate attention. 
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Code Quality Issues - 2 Column Grid */}
        <div>
          <div className="text-white/70 text-sm font-medium mb-4 flex items-center">
            <div className="w-1 h-4 bg-purple-500 rounded-full mr-2"></div>
            Code Quality Issues
          </div>
          
          {hasSmells ?  (
            <div className="grid md:grid-cols-2 gap-3">
              {smellCategories.filter(category => category.count > 0). map((category) => (
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
                        <div className="theme-text-muted text-xs">
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
            <div className="text-center py-6 theme-bg-subtle rounded-lg">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                <Bug className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-green-400 font-medium">No code smells detected</p>
              <p className="text-xs theme-text-muted mt-1">Your code quality is excellent!</p>
            </div>
          )}
        </div>

        {/* Security-Related Code Issues */}
        {vulnerabilityTypes.length > 0 && (
          <div>
            <div className="text-white/70 text-sm font-medium mb-4 flex items-center">
              <div className="w-1 h-4 bg-red-500 rounded-full mr-2"></div>
              Security-Related Code Issues
            </div>
            
            <div className="grid md:grid-cols-2 gap-3">
              {vulnerabilityTypes.slice(0, 6).map((vulnType, index) => (
                <div 
                  key={`${vulnType. type}-${index}`} 
                  className={`p-4 rounded-lg border ${
                    vulnType.critical > 0 ? 'border-red-500/30 bg-red-500/10' :
                    vulnType.high > 5 ? 'border-orange-500/30 bg-orange-500/10' :
                    vulnType.high > 0 ? 'border-yellow-500/30 bg-yellow-500/10' : 
                    'border-blue-500/30 bg-blue-500/10'
                  } hover:scale-[1. 02] transition-transform`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`w-3 h-3 rounded-full mt-1. 5 ${
                        vulnType.critical > 0 ?  'bg-red-400' :
                        vulnType.high > 5 ? 'bg-orange-400' :
                        vulnType.high > 0 ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}></div>
                      <div className="flex-1">
                        <div className="theme-text font-medium capitalize text-sm mb-1">
                          {vulnType.type. replace(/_/g, ' ')}
                        </div>
                        <div className="theme-text-muted text-xs">
                          {vulnType.critical > 0 && (
                            <span className="text-red-400 font-medium">{vulnType.critical} critical</span>
                          )}
                          {vulnType. critical > 0 && vulnType.high > 0 && <span className="mx-1">•</span>}
                          {vulnType.high > 0 && (
                            <span className="text-orange-400">{vulnType.high} high</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="theme-text font-bold text-lg">{vulnType.count}</div>
                      <div className="theme-text-muted text-xs">issues</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="pt-6 border-t theme-border">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className={`text-2xl font-bold ${hasSmells ? 'text-yellow-400' : 'text-green-400'}`}>
                {totalSmells}
              </div>
              <div className="theme-text-muted text-xs">Quality Issues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">
                {smellCategories.filter(c => c.priority <= 2). reduce((sum, c) => sum + c.count, 0)}
              </div>
              <div className="theme-text-muted text-xs">High Priority</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {vulnerabilityTypes.reduce((sum, v) => sum + (v.critical || 0), 0)}
              </div>
              <div className="theme-text-muted text-xs">Security Issues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {vulnerabilityTypes.length}
              </div>
              <div className="theme-text-muted text-xs">Vuln Types</div>
            </div>
          </div>
          
          {(hasSmells || vulnerabilityTypes.length > 0) && (
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-center">
              <div className="theme-text-muted text-sm">
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