import React, { useState, useEffect } from 'react';
import { Code, TrendingUp, FileText, BarChart3, CheckCircle, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface CodeMetricsProps {
  data:  EnhancedDashboardData;
}

const CodeMetrics: React.FC<CodeMetricsProps> = ({ data }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showLangChart, setShowLangChart] = useState(true);
  const codeMetrics = data.advancedMetrics?.codeQualityMetrics;
  
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);
  
  if (!codeMetrics) {
    return (
      <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Code className="w-5 h-5 mr-2 text-[#003D6B] dark:text-white" />
          Code Quality Metrics
        </h3>
        <div className="text-center py-8 text-gray-500 dark: text-white/60">
          <Code className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-white/40" />
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
  const duplicatedLines = codeMetrics. duplicated_lines || {};
  const codeCoverage = codeMetrics.code_coverage || {};


  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-white/20 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-gray-900 dark:text-white capitalize mb-1">{payload[0].payload. language}</p>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Files: <span className="font-bold">{payload[0].value}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Percentage: <span className="font-bold">{payload[0].payload.percentage}%</span>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Code className="w-5 h-5 mr-2 text-[#003D6B] dark:text-blue-400" />
          Code Quality Metrics
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          maintainabilityIndex > 75 ? 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300' :
          maintainabilityIndex > 50 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark: text-yellow-300' :  
          maintainabilityIndex > 25 ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' :  
          'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300'
        }`}>
          {maintainabilityIndex > 75 ? '✓ Excellent' : 
           maintainabilityIndex > 50 ? 'Good' : 
           maintainabilityIndex > 25 ? 'Fair' : '⚠ Needs Work'}
        </div>
      </div>
      
      <div className="space-y-6 flex-1">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[#D6E6FF] border border-[#003D6B]/20 dark:bg-blue-500/10 dark:border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-4 h-4 text-[#003D6B] dark: text-blue-400" />
              <span className="text-xs text-gray-600 dark:text-white/60">Codebase Size</span>
            </div>
            <div className="text-2xl font-bold text-[#003D6B] dark: text-blue-400 mb-1">
              {(totalLines / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-gray-600 dark:text-white/60">
              {totalLines. toLocaleString()} lines • {totalFiles} files
            </div>
          </div>
          
          <div className="p-4 bg-[#E8F0FF] border border-[#003D6B]/10 dark:bg-purple-500/10 dark:border-purple-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-4 h-4 text-[#003D6B] dark: text-purple-400" />
              <span className="text-xs text-gray-600 dark: text-white/60">Maintainability</span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              maintainabilityIndex > 75 ?  'text-green-600 dark:text-green-400' :
              maintainabilityIndex > 50 ? 'text-yellow-600 dark:text-yellow-400' : 
              maintainabilityIndex > 25 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.round(maintainabilityIndex)}
            </div>
            <div className={`text-xs ${
              maintainabilityIndex > 75 ? 'text-green-600 dark:text-green-300' :
              maintainabilityIndex > 50 ? 'text-yellow-600 dark: text-yellow-300' :  
              maintainabilityIndex > 25 ? 'text-orange-600 dark:text-orange-300' : 'text-red-600 dark: text-red-300'
            }`}>
              {maintainabilityIndex > 75 ? 'Excellent score' : 
               maintainabilityIndex > 50 ? 'Good score' :
               maintainabilityIndex > 25 ? 'Fair score' : 'Poor score'}
            </div>
          </div>
        </div>

        {/* Language Distribution - ENHANCED WITH CHART */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 text-[#003D6B] dark:text-purple-400 mr-2" />
              <span className="text-gray-900 dark:text-white font-medium text-sm">Language Distribution</span>
            </div>
            {languageDistribution.length > 0 && (
              <button
                onClick={() => setShowLangChart(!showLangChart)}
                className="px-3 py-1 text-xs bg-gray-100 dark: bg-white/10 hover: bg-gray-200 dark: hover:bg-white/20 rounded-full transition-colors"
              >
                {showLangChart ?  'List View' : 'Chart View'}
              </button>
            )}
          </div>
          
          {languageDistribution.length > 0 ?  (
            <>
              {/* Bar Chart Visualization */}
              {showLangChart && (
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={languageDistribution.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis 
                        dataKey="language" 
                        stroke="#9CA3AF"
                        style={{ fontSize: '11px' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        style={{ fontSize: '11px' }}
                        label={{ value: 'Files', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#9CA3AF' } }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="files" radius={[8, 8, 0, 0]} animationDuration={1500}>
                        {languageDistribution.slice(0, 5).map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              index === 0 ?  '#3B82F6' :  
                              index === 1 ? '#10B981' : 
                              index === 2 ? '#EAB308' : 
                              index === 3 ? '#8B5CF6' :  '#EC4899'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Progress Bars (List View) */}
              <div className="space-y-2">
                {languageDistribution. slice(0, 5).map((lang, index) => (
                  <div key={`${lang. language}-${index}`} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-blue-600 dark:bg-blue-400' :  
                          index === 1 ? 'bg-green-600 dark:bg-green-400' : 
                          index === 2 ? 'bg-yellow-600 dark:bg-yellow-400' : 
                          index === 3 ? 'bg-purple-600 dark:bg-purple-400' : 'bg-pink-600 dark:bg-pink-400'
                        }`}></div>
                        <span className="text-gray-900 dark:text-white text-sm capitalize">{lang.language}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-500 dark:text-white/60 text-xs">{lang.files} files</span>
                        <span className="text-gray-900 dark:text-white font-medium text-sm">{lang.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-1. 5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          index === 0 ? 'bg-blue-600 dark:bg-blue-400' : 
                          index === 1 ? 'bg-green-600 dark:bg-green-400' :
                          index === 2 ? 'bg-yellow-600 dark:bg-yellow-400' :
                          index === 3 ? 'bg-purple-600 dark:bg-purple-400' : 'bg-pink-600 dark: bg-pink-400'
                        } transition-all duration-300`}
                        style={{ width: `${lang.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                
                {languageDistribution.length > 5 && (
                  <div className="text-center pt-2">
                    <span className="text-gray-500 dark:text-white/60 text-xs">
                      +{languageDistribution.length - 5} more languages
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4 bg-gray-50 dark:bg-white/5 rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-white/30" />
              <p className="text-xs text-gray-500 dark:text-white/60">No language data</p>
            </div>
          )}
        </div>

        {/* Quality Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 dark:text-white/60 text-xs">Complexity</span>
              {complexityScore < 50 ?  (
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <div className={`text-xl font-bold ${
              complexityScore < 25 ? 'text-green-600 dark:text-green-400' :
              complexityScore < 50 ? 'text-yellow-600 dark: text-yellow-400' : 
              complexityScore < 75 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.round(complexityScore)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 dark: text-white/60 text-xs">Duplication</span>
              {(duplicatedLines. percentage || 0) < 5 ? (
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <div className={`text-xl font-bold ${
              (duplicatedLines.percentage || 0) < 5 ? 'text-green-600 dark: text-green-400' :  
              (duplicatedLines.percentage || 0) < 10 ? 'text-yellow-600 dark:text-yellow-400' :  
              (duplicatedLines. percentage || 0) < 15 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {(duplicatedLines.percentage || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Coverage & Debt Summary */}
        <div className="pt-4 border-t border-gray-200 dark:border-white/20 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-white/60 text-sm">Code Coverage</span>
            <div className="flex items-center space-x-2">
              <span className={`font-medium text-sm ${
                (codeCoverage.average || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                (codeCoverage.average || 0) >= 60 ? 'text-yellow-600 dark:text-yellow-400' :  'text-red-600 dark:text-red-400'
              }`}>
                {Math.round(codeCoverage.average || 0)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-white/60">
                / {codeCoverage.target || 80}% target
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-white/60 text-sm">Technical Debt</span>
            <span className={`font-medium text-sm ${
              (codeMetrics.technical_debt?. priority || 'low') === 'high' ? 'text-red-600 dark:text-red-400' :
              (codeMetrics.technical_debt?.priority || 'low') === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
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
