import React from 'react';
import { AlertCircle, Bug, Zap, Info, AlertTriangle } from "lucide-react";
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
      <div className="bg-black/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Bug className="w-5 h-5 mr-2" />
          Code Smells & Issues
        </h3>
        <div className="text-center py-8 text-white/60">
          <Bug className="w-12 h-12 mx-auto mb-3 text-green-400/60" />
          <p className="text-green-400">No code smells detected</p>
          <p className="text-sm mt-2">Your code quality looks good!</p>
        </div>
      </div>
    );
  }

  const smellCategories = [
    {
      key: 'blocker',
      label: 'Blocker Issues',
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      count: codeSmells?.blocker || 0
    },
    {
      key: 'critical',
      label: 'Critical Issues', 
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
      count: codeSmells?.critical || 0
    },
    {
      key: 'major',
      label: 'Major Issues',
      icon: <Zap className="w-4 h-4" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      count: codeSmells?.major || 0
    },
    {
      key: 'minor',
      label: 'Minor Issues',
      icon: <Info className="w-4 h-4" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      count: codeSmells?.minor || 0
    },
    {
      key: 'info',
      label: 'Info Issues',
      icon: <Info className="w-4 h-4" />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500/30',
      count: codeSmells?.info || 0
    }
  ];

  const totalSmells = smellCategories.reduce((sum, category) => sum + category.count, 0);
  const hasSmells = totalSmells > 0;

  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Bug className="w-5 h-5 mr-2" />
        Code Smells & Issues
      </h3>
      
      <div className="space-y-6">
        {/* Code Quality Issues */}
        <div>
          <div className="text-white/70 text-sm mb-3">Code Quality Issues</div>
          
          {hasSmells ? (
            <div className="grid grid-cols-1 gap-3">
              {smellCategories.filter(category => category.count > 0).map((category) => (
                <div key={category.key} className={`p-3 rounded-lg border ${category.borderColor} ${category.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={category.color}>
                        {category.icon}
                      </div>
                      <div>
                        <div className={`font-medium ${category.color}`}>{category.label}</div>
                        <div className="text-white/60 text-sm">
                          {category.key === 'blocker' ? 'Must fix immediately' :
                           category.key === 'critical' ? 'Should fix before release' :
                           category.key === 'major' ? 'Should fix in this sprint' :
                           category.key === 'minor' ? 'Fix when convenient' :
                           'Informational only'}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${category.bgColor} ${category.color} border-0`}>
                      {category.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-white/60">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-full flex items-center justify-center">
                <Bug className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-green-400 font-medium">No code smells detected</p>
              <p className="text-sm mt-1">Your code quality is excellent!</p>
            </div>
          )}
        </div>

        {/* Security Issues as Code Quality Problems */}
        {vulnerabilityTypes.length > 0 && (
          <div>
            <div className="text-white/70 text-sm mb-3">Security-Related Code Issues</div>
            
            <div className="space-y-2">
              {vulnerabilityTypes.slice(0, 5).map((vulnType, index) => (
                <div key={`${vulnType.type}-${index}`} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      vulnType.critical > 0 ? 'bg-red-400' :
                      vulnType.high > 5 ? 'bg-orange-400' :
                      vulnType.high > 0 ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}></div>
                    <div>
                      <div className="text-white font-medium capitalize">
                        {vulnType.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-white/60 text-sm">
                        {vulnType.critical > 0 && `${vulnType.critical} critical, `}
                        {vulnType.high > 0 && `${vulnType.high} high risk`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{vulnType.count}</div>
                    <div className="text-white/60 text-xs">issues</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className={`text-xl font-bold ${hasSmells ? 'text-yellow-400' : 'text-green-400'}`}>
                {totalSmells}
              </div>
              <div className="text-white/60 text-sm">Code Quality Issues</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-400">
                {vulnerabilityTypes.reduce((sum, v) => sum + (v.critical || 0), 0)}
              </div>
              <div className="text-white/60 text-sm">Security Issues</div>
            </div>
          </div>
          
          {(hasSmells || vulnerabilityTypes.length > 0) && (
            <div className="mt-4 text-center">
              <div className="text-white/60 text-sm">
                Prioritize fixing blocker and critical issues first
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeSmells;