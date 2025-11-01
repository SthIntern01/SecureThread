import React from 'react';
import { Code2 } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface CodeMetricsProps {
  data: EnhancedDashboardData;
}

const CodeMetrics: React.FC<CodeMetricsProps> = ({ data }) => {
  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Code2 className="w-5 h-5 mr-2" />
        Code Quality Metrics
      </h3>
      
      {data.advancedMetrics?.codeQualityMetrics ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {data.advancedMetrics.codeQualityMetrics.totalLinesOfCode?.toLocaleString() || '0'}
              </div>
              <div className="text-white/60 text-sm">Lines of Code</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {data.advancedMetrics.codeQualityMetrics.maintainabilityIndex || 0}
              </div>
              <div className="text-white/60 text-sm">Maintainability</div>
            </div>
          </div>
          
          {/* Language Distribution */}
          <div>
            <h4 className="text-white font-medium mb-2">Language Distribution</h4>
            <div className="space-y-2">
              {(data.advancedMetrics.codeQualityMetrics.languageDistribution || []).slice(0, 5).map((lang, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-white/70 text-sm capitalize">{lang.language}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{ width: `${lang.percentage}%` }}
                      />
                    </div>
                    <span className="text-white/60 text-xs">{lang.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <Code2 className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No code quality data available</p>
        </div>
      )}
    </div>
  );
};

export default CodeMetrics;