import React from 'react';
import CodeMetrics from './CodeMetrics';
import TechnicalDebt from './TechnicalDebt';
import CodeSmells from './CodeSmells';
import { EnhancedDashboardData } from '../../types/dashboard.types';
import { Code, Wrench, Bug, TrendingUp } from "lucide-react";

interface QualityViewProps {
  data: EnhancedDashboardData;
}

const QualityView: React.FC<QualityViewProps> = ({ data }) => {
  // Extract key metrics for summary cards
  const codeMetrics = data.advancedMetrics?.codeQualityMetrics;
  const advancedDebt = data.advancedMetrics?.technicalDebtDetailed;
  const codeSmells = codeMetrics?.code_smells;
  
  const maintainabilityIndex = codeMetrics?.maintainability_index || 0;
  const totalDebtHours = Math.round(advancedDebt?.totalDebtHours || 0);
  const totalSmells = Object.values(codeSmells || {}).reduce((sum:  number, count) => sum + (count as number || 0), 0);
  const complexityScore = codeMetrics?.complexity_score || 50;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards Section - Top Priority Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Maintainability Card - Keep semantic colors */}
        <div className={`bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-4 border-l-4 ${
          maintainabilityIndex > 75 ? 'border-l-green-500' :
          maintainabilityIndex > 50 ?  'border-l-yellow-500' :
          maintainabilityIndex > 25 ? 'border-l-orange-500' : 'border-l-red-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Code className={`w-5 h-5 ${
              maintainabilityIndex > 75 ? 'text-green-600 dark:text-green-400' :
              maintainabilityIndex > 50 ? 'text-yellow-600 dark:text-yellow-400' :
              maintainabilityIndex > 25 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
            }`} />
            <span className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wide">Maintainability</span>
          </div>
          <div className={`text-3xl font-bold ${
            maintainabilityIndex > 75 ? 'text-green-600 dark:text-green-400' :
            maintainabilityIndex > 50 ? 'text-yellow-600 dark:text-yellow-400' :
            maintainabilityIndex > 25 ? 'text-orange-600 dark:text-orange-400' :  'text-red-600 dark:text-red-400'
          }`}>
            {Math.round(maintainabilityIndex)}
          </div>
          <div className="text-gray-600 dark:text-white/60 text-sm mt-1">
            {maintainabilityIndex > 75 ?  'Excellent' :
             maintainabilityIndex > 50 ? 'Good' : 
             maintainabilityIndex > 25 ? 'Fair' : 'Poor'}
          </div>
        </div>

        {/* Technical Debt Card - Keep yellow (semantic) */}
        <div className="bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <Wrench className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wide">Tech Debt</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {totalDebtHours}h
          </div>
          <div className="text-gray-600 dark:text-white/60 text-sm mt-1">Remediation effort</div>
        </div>

        {/* Code Smells Card - LIGHT:  Navy/semantic, DARK: Original */}
        <div className={`bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-4 border-l-4 ${
          totalSmells === 0 ? 'border-l-green-500' :  
          totalSmells < 10 ? 'border-l-[#003D6B] dark:border-l-blue-500' :  
          totalSmells < 50 ? 'border-l-yellow-500' : 'border-l-red-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Bug className={`w-5 h-5 ${
              totalSmells === 0 ? 'text-green-600 dark: text-green-400' :  
              totalSmells < 10 ? 'text-[#003D6B] dark: text-blue-400' : 
              totalSmells < 50 ? 'text-yellow-600 dark:text-yellow-400' :  'text-red-600 dark:text-red-400'
            }`} />
            <span className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wide">Code Smells</span>
          </div>
          <div className={`text-3xl font-bold ${
            totalSmells === 0 ? 'text-green-600 dark:text-green-400' :  
            totalSmells < 10 ? 'text-[#003D6B] dark: text-blue-400' : 
            totalSmells < 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {totalSmells}
          </div>
          <div className="text-gray-600 dark:text-white/60 text-sm mt-1">
            {totalSmells === 0 ? 'Clean code' : 'Issues detected'}
          </div>
        </div>

        {/* Complexity Card - Keep semantic colors */}
        <div className={`bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-4 border-l-4 ${
          complexityScore < 25 ? 'border-l-green-500' :
          complexityScore < 50 ? 'border-l-blue-500' :
          complexityScore < 75 ? 'border-l-orange-500' : 'border-l-red-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className={`w-5 h-5 ${
              complexityScore < 25 ? 'text-green-600 dark:text-green-400' :
              complexityScore < 50 ? 'text-blue-600 dark:text-blue-400' :
              complexityScore < 75 ? 'text-orange-600 dark:text-orange-400' :  'text-red-600 dark:text-red-400'
            }`} />
            <span className="text-xs text-gray-500 dark:text-white/60 uppercase tracking-wide">Complexity</span>
          </div>
          <div className={`text-3xl font-bold ${
            complexityScore < 25 ? 'text-green-600 dark:text-green-400' :
            complexityScore < 50 ?  'text-blue-600 dark:text-blue-400' :
            complexityScore < 75 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {Math.round(complexityScore)}
          </div>
          <div className="text-gray-600 dark:text-white/60 text-sm mt-1">
            {complexityScore < 25 ? 'Low' : 
             complexityScore < 50 ? 'Moderate' : 
             complexityScore < 75 ? 'High' : 'Very High'}
          </div>
        </div>
      </div>

      {/* Main Content Grid - Code Metrics & Technical Debt side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CodeMetrics data={data} />
        <TechnicalDebt data={data} />
      </div>

      {/* Code Smells - Full Width for better visibility */}
      <div className="w-full">
        <CodeSmells data={data} />
      </div>
    </div>
  );
};

export default QualityView;
