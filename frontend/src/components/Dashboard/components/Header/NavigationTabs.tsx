import React from 'react';
import { BarChart3, Shield, Code2, Award } from "lucide-react";
import { SelectedView } from '../../types/dashboard.types';

interface NavigationTabsProps {
  selectedView: SelectedView;
  onViewChange: (view: SelectedView) => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({ selectedView, onViewChange }) => {
  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'security' as const, label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { key: 'quality' as const, label: 'Code Quality', icon: <Code2 className="w-4 h-4" /> },
    { key: 'compliance' as const, label: 'Compliance', icon: <Award className="w-4 h-4" /> }
  ];

  return (
    <div className="flex items-center space-x-4 mt-6">
      <div className="flex items-center space-x-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onViewChange(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === tab.key
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-white/70 hover:text-white hover:bg-white/10'
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