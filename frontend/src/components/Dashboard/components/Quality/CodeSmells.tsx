import React from 'react';
import { Bug, CheckCircle } from "lucide-react";
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface CodeSmellsProps {
  data: EnhancedDashboardData;
}

const CodeSmells: React.FC<CodeSmellsProps> = ({ data }) => {
  return (
    <div className="bg-black/20 rounded-lg p-6 lg:col-span-2">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Bug className="w-5 h-5 mr-2" />
        Code Smells & Issues
      </h3>
      
      {data.advancedMetrics?.codeQualityMetrics?.codeSmells ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(data.advancedMetrics.codeQualityMetrics.codeSmells).map(([type, count]) => (
            <div key={type} className="text-center">
              <div className={`text-2xl font-bold mb-1 ${
                type === 'blocker' ? 'text-red-400' :
                type === 'critical' ? 'text-orange-400' :
                type === 'major' ? 'text-yellow-400' :
                type === 'minor' ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {count}
              </div>
              <div className="text-white/60 text-sm capitalize">{type}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/60">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400/60" />
          <p>No code smells detected</p>
        </div>
      )}
    </div>
  );
};

export default CodeSmells;