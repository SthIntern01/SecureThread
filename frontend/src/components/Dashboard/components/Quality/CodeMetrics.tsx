import React from 'react';
import { Code, TrendingUp, FileText, BarChart3, CheckCircle, AlertCircle } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface CodeMetricsProps {
  data: EnhancedDashboardData;
}

const CodeMetrics: React.FC<CodeMetricsProps> = ({ data }) => {
  const codeMetrics = data.advancedMetrics?.codeQualityMetrics;
  
  if (!codeMetrics) {
    return (
      <div className="theme-card rounded-lg p-6 h-full">
        <h3 className="text-lg font-semibold theme-text mb-4 flex items-center">
          <Code className="w-5 h-5 mr-2" />
          Code Quality Metrics
        </h3>
        <div className="text-center py-8 theme-text-muted">
          <Code className="w-12 h-12 mx-auto mb-3 text-white/40" />
          <p>No code quality data available</p>
          <p className="text-xs mt-2">Run scans to see metrics</p>
        </div>
      </div>
    );
  }

  const totalLines = codeMetrics.total_lines_of_code || 0;
  const totalFiles = codeMetrics.total_files || 0;
  const maintainabilityIndex = codeMetrics.maintainability_index || 0;
  const complexityScore = codeMetrics. complexity_score || 50;
  const languageDistribution = codeMetrics.language_distribution || [];
  const duplicatedLines = codeMetrics.duplicated_lines || {};
  const codeCoverage = codeMetrics. code_coverage || {};

  return (
    <div className="theme-card rounded-lg p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold theme-text flex items-center">
          <Code className="w-5 h-5 mr-2 text-blue-400" />
          Code Quality Metrics
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          maintainabilityIndex > 75 ?  'bg-green-500/20 text-green-300' :
          maintainabilityIndex > 50 ? 'bg-yellow-500/20 text-yellow-300' :
          maintainabilityIndex > 25 ? 'bg-orange-500/20 text-orange-300' : 
          'bg-red-500/20 text-red-300'
        }`}>
          {maintainabilityIndex > 75 ? '✓ Excellent' :
           maintainabilityIndex > 50 ? 'Good' :
           maintainabilityIndex > 25 ?  'Fair' : '⚠ Needs Work'}
        </div>
      </div>
      
      <div className="space-y-6 flex-1">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 theme-bg-subtle rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-xs theme-text-muted">Codebase Size</span>
            </div>
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {(totalLines / 1000).toFixed(1)}k
            </div>
            <div className="text-xs theme-text-muted">
              {totalLines. toLocaleString()} lines • {totalFiles} files
            </div>
          </div>
          
          <div className="p-4 theme-bg-subtle rounded-lg border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs theme-text-muted">Maintainability</span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              maintainabilityIndex > 75 ?  'text-green-400' :
              maintainabilityIndex > 50 ? 'text-yellow-400' :
              maintainabilityIndex > 25 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {Math.round(maintainabilityIndex)}
            </div>
            <div className={`text-xs ${
              maintainabilityIndex > 75 ? 'text-green-300' :
              maintainabilityIndex > 50 ? 'text-yellow-300' :
              maintainabilityIndex > 25 ? 'text-orange-300' : 'text-red-300'
            }`}>
              {maintainabilityIndex > 75 ? 'Excellent score' :
               maintainabilityIndex > 50 ? 'Good score' :
               maintainabilityIndex > 25 ?  'Fair score' : 'Poor score'}
            </div>
          </div>
        </div>

        {/* Language Distribution */}
        <div>
          <div className="flex items-center mb-3">
            <BarChart3 className="w-4 h-4 text-purple-400 mr-2" />
            <span className="theme-text font-medium text-sm">Language Distribution</span>
          </div>
          
          {languageDistribution.length > 0 ? (
            <div className="space-y-2">
              {languageDistribution.slice(0, 5).map((lang, index) => (
                <div key={`${lang. language}-${index}`} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-blue-400' :
                        index === 1 ? 'bg-green-400' :
                        index === 2 ? 'bg-yellow-400' :
                        index === 3 ? 'bg-purple-400' : 'bg-pink-400'
                      }`}></div>
                      <span className="theme-text text-sm capitalize">{lang.language}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="theme-text-muted text-xs">{lang.files} files</span>
                      <span className="theme-text font-medium text-sm">{lang.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-1. 5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        index === 0 ? 'bg-blue-400' :
                        index === 1 ? 'bg-green-400' :
                        index === 2 ? 'bg-yellow-400' :
                        index === 3 ? 'bg-purple-400' : 'bg-pink-400'
                      } transition-all duration-300`}
                      style={{ width: `${lang.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              
              {languageDistribution.length > 5 && (
                <div className="text-center pt-2">
                  <span className="theme-text-muted text-xs">
                    +{languageDistribution.length - 5} more languages
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 theme-bg-subtle rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-white/30" />
              <p className="text-xs theme-text-muted">No language data</p>
            </div>
          )}
        </div>

        {/* Quality Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 theme-bg-subtle rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="theme-text-muted text-xs">Complexity</span>
              {complexityScore < 50 ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-400" />
              )}
            </div>
            <div className={`text-xl font-bold ${
              complexityScore < 25 ? 'text-green-400' :
              complexityScore < 50 ? 'text-yellow-400' :
              complexityScore < 75 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {Math.round(complexityScore)}
            </div>
          </div>
          
          <div className="p-3 theme-bg-subtle rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="theme-text-muted text-xs">Duplication</span>
              {(duplicatedLines.percentage || 0) < 5 ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-400" />
              )}
            </div>
            <div className={`text-xl font-bold ${
              (duplicatedLines.percentage || 0) < 5 ? 'text-green-400' :
              (duplicatedLines.percentage || 0) < 10 ? 'text-yellow-400' :
              (duplicatedLines.percentage || 0) < 15 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {(duplicatedLines.percentage || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Coverage & Debt Summary */}
        <div className="pt-4 border-t theme-border space-y-2">
          <div className="flex justify-between items-center">
            <span className="theme-text-muted text-sm">Code Coverage</span>
            <div className="flex items-center space-x-2">
              <span className={`font-medium text-sm ${
                (codeCoverage.average || 0) >= 80 ? 'text-green-400' :
                (codeCoverage.average || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(codeCoverage.average || 0)}%
              </span>
              <span className="text-xs theme-text-muted">
                / {codeCoverage.target || 80}% target
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="theme-text-muted text-sm">Technical Debt</span>
            <span className={`font-medium text-sm ${
              (codeMetrics.technical_debt?.priority || 'low') === 'high' ? 'text-red-400' :
              (codeMetrics. technical_debt?.priority || 'low') === 'medium' ?  'text-yellow-400' : 'text-green-400'
            }`}>
              {(codeMetrics.technical_debt?.priority || 'LOW').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeMetrics;