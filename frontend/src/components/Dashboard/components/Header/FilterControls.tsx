import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock, GitBranch, ChevronDown } from "lucide-react";
import { TimeFilter, Repository, TimeFilterOptions } from '../../types/dashboard.types';

interface FilterControlsProps {
  timeFilter: TimeFilter;
  selectedRepository: number | 'all';
  repositories: Repository[];
  timeFilterOptions: TimeFilterOptions;
  showTimeDropdown: boolean;
  showRepoDropdown: boolean;
  onTimeFilterChange: (filter:  TimeFilter) => void;
  onRepositoryChange: (repoId:  number | 'all') => void;
  onToggleTimeDropdown: () => void;
  onToggleRepoDropdown:  () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  timeFilter,
  selectedRepository,
  repositories,
  timeFilterOptions,
  showTimeDropdown,
  showRepoDropdown,
  onTimeFilterChange,
  onRepositoryChange,
  onToggleTimeDropdown,
  onToggleRepoDropdown
}) => {
  return (
    <div className="flex items-center space-x-3 mt-4">
      {/* Time Filter Dropdown */}
      <div className="relative" data-dropdown="time">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e. preventDefault();
            e.stopPropagation();
            onToggleTimeDropdown();
          }}
          className="text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-100 dark:text-white/70 dark:hover:text-white dark:border-white/20 dark:hover:bg-white/10"
        >
          <Clock className="w-4 h-4 mr-2" />
          {timeFilterOptions[timeFilter]. label}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
        {showTimeDropdown && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 dark:bg-black/90 dark:backdrop-blur-lg dark:border-white/20">
            {Object.entries(timeFilterOptions).map(([key, option]) => (
              <button
                key={key}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTimeFilterChange(key as TimeFilter);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  timeFilter === key
                    ? 'bg-[#D6E6FF] text-[#003D6B] font-medium dark:bg-white/20 dark:text-white'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
                } first:rounded-t-lg last: rounded-b-lg`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Repository Filter Dropdown */}
      <div className="relative" data-dropdown="repo">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleRepoDropdown();
          }}
          className="text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-100 dark:text-white/70 dark:hover:text-white dark:border-white/20 dark:hover:bg-white/10"
        >
          <GitBranch className="w-4 h-4 mr-2" />
          {selectedRepository === 'all' 
            ? 'All Repositories' 
            : repositories.find(r => r.id === selectedRepository)?.name || 'Repository'
          }
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
        {showRepoDropdown && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto dark: bg-black/90 dark: backdrop-blur-lg dark:border-white/20">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRepositoryChange('all');
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                selectedRepository === 'all'
                  ? 'bg-[#D6E6FF] text-[#003D6B] font-medium dark:bg-white/20 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
              } rounded-t-lg`}
            >
              All Repositories ({repositories.length})
            </button>
            {repositories.map((repo) => (
              <button
                key={repo.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRepositoryChange(repo.id);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  selectedRepository === repo.id
                    ?  'bg-[#D6E6FF] text-[#003D6B] font-medium dark:bg-white/20 dark:text-white'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover: text-white'
                } last:rounded-b-lg`}
              >
                <div className="truncate font-medium">{repo.name}</div>
                <div className="text-xs text-gray-500 dark:text-white/50 truncate">{repo.full_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterControls;
