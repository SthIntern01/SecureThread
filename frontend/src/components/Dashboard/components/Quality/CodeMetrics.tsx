import React from 'react';
import { Code, TrendingUp, FileText, BarChart3 } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface CodeMetricsProps {
  data: EnhancedDashboardData;
}

const CodeMetrics: React.FC<CodeMetricsProps> = ({ data }) => {
  // 🔧 FIX: Change from codeMetrics to codeQualityMetrics
  const codeMetrics = data.advancedMetrics?.codeQualityMetrics;
  
  if (!codeMetrics) {
    return (
      <div className="bg-black/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Code className="w-5 h-5 mr-2" />
          Code Quality Metrics
        </h3>
        <div className="text-center py-8 text-white/60">
          <Code className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No code quality data available</p>
        </div>
      </div>
    );
  }

  // Rest of your code stays exactly the same...
  const totalLines = codeMetrics.total_lines_of_code || 0;
  const totalFiles = codeMetrics.total_files || 0;
  const maintainabilityIndex = codeMetrics.maintainability_index || 0;
  const complexityScore = codeMetrics.complexity_score || 50;
  const languageDistribution = codeMetrics.language_distribution || [];
  const duplicatedLines = codeMetrics.duplicated_lines || {};

  return (
    <div className="bg-black/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Code className="w-5 h-5 mr-2" />
        Code Quality Metrics
      </h3>
      
      <div className="space-y-6">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {totalLines.toLocaleString()}
            </div>
            <div className="text-white/70 font-medium text-sm">Lines of Code</div>
            <div className="text-xs text-blue-300 mt-1">
              Across {totalFiles} files
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold mb-1 ${
              maintainabilityIndex > 75 ? 'text-green-400' :
              maintainabilityIndex > 50 ? 'text-yellow-400' :
              maintainabilityIndex > 25 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {Math.round(maintainabilityIndex)}
            </div>
            <div className="text-white/70 font-medium text-sm">Maintainability</div>
            <div className={`text-xs mt-1 ${
              maintainabilityIndex > 75 ? 'text-green-300' :
              maintainabilityIndex > 50 ? 'text-yellow-300' :
              maintainabilityIndex > 25 ? 'text-orange-300' : 'text-red-300'
            }`}>
              {maintainabilityIndex > 75 ? 'Excellent' :
               maintainabilityIndex > 50 ? 'Good' :
               maintainabilityIndex > 25 ? 'Fair' : 'Poor'}
            </div>
          </div>
        </div>

        {/* Language Distribution */}
        <div>
          <div className="flex items-center mb-3">
            <FileText className="w-4 h-4 text-purple-400 mr-2" />
            <span className="text-white font-medium">Language Distribution</span>
          </div>
          
          {languageDistribution.length > 0 ? (
            <div className="space-y-2">
              {languageDistribution.slice(0, 6).map((lang, index) => (
                <div key={`${lang.language}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-400' :
                      index === 1 ? 'bg-green-400' :
                      index === 2 ? 'bg-yellow-400' :
                      index === 3 ? 'bg-purple-400' :
                      index === 4 ? 'bg-pink-400' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-white capitalize">{lang.language}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white/60 text-sm">{lang.files} files</span>
                    <span className="text-white font-medium">{lang.percentage}%</span>
                  </div>
                </div>
              ))}
              
              {languageDistribution.length > 6 && (
                <div className="text-white/60 text-sm text-center pt-2">
                  +{languageDistribution.length - 6} more languages
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-white/60">
              <FileText className="w-8 h-8 mx-auto mb-2 text-white/40" />
              <p className="text-sm">No language data detected</p>
              <p className="text-xs mt-1">Run scans on repositories with source code</p>
            </div>
          )}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className={`text-xl font-bold mb-1 ${
              complexityScore < 25 ? 'text-green-400' :
              complexityScore < 50 ? 'text-yellow-400' :
              complexityScore < 75 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {Math.round(complexityScore)}
            </div>
            <div className="text-white/60 text-sm">Complexity Score</div>
          </div>
          
          <div className="text-center">
            <div className={`text-xl font-bold mb-1 ${
              (duplicatedLines.percentage || 0) < 5 ? 'text-green-400' :
              (duplicatedLines.percentage || 0) < 10 ? 'text-yellow-400' :
              (duplicatedLines.percentage || 0) < 15 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {(duplicatedLines.percentage || 0).toFixed(1)}%
            </div>
            <div className="text-white/60 text-sm">Duplicated Code</div>
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Code Coverage</span>
              <span className={`font-medium ${
                (codeMetrics.code_coverage?.average || 0) >= 80 ? 'text-green-400' :
                (codeMetrics.code_coverage?.average || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(codeMetrics.code_coverage?.average || 0)}% 
                <span className="text-white/60 ml-1">
                  (Target: {codeMetrics.code_coverage?.target || 80}%)
                </span>
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/60">Technical Debt</span>
              <span className={`font-medium ${
                (codeMetrics.technical_debt?.priority || 'low') === 'high' ? 'text-red-400' :
                (codeMetrics.technical_debt?.priority || 'low') === 'medium' ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {(codeMetrics.technical_debt?.priority || 'low').toUpperCase()} Priority
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeMetrics;