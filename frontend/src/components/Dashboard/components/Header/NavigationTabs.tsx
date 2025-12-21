import React from 'react';
import { BarChart3, Shield, Code2, Award } from "lucide-react";
import { SelectedView } from '../../types/dashboard.types';

interface NavigationTabsProps {
  selectedView: SelectedView;
  onViewChange: (view: SelectedView) => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ selectedView, onViewChange }) => {
  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon:  <BarChart3 className="w-4 h-4" /> },
    { key: 'security' as const, label:  'Security', icon: <Shield className="w-4 h-4" /> },
    { key: 'quality' as const, label: 'Code Quality', icon: <Code2 className="w-4 h-4" /> },
    { key: 'compliance' as const, label: 'Compliance', icon: <Award className="w-4 h-4" /> }
  ];

  return (
    <div className="flex items-center space-x-4 mt-6">
      <div className="flex items-center space-x-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onViewChange(tab. key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === tab.key
                // UPDATED: Navy blue for active tab in light mode
                ? 'bg-[#D6E6FF] text-[#003D6B] border border-[#003D6B]/30 dark:bg-white/20 dark:text-white dark:border-white/30'
                :  'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavigationTabs;
