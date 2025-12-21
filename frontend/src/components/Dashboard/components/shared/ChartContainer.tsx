import React from 'react';
import { LucideIcon } from "lucide-react";

interface ChartContainerProps {
  title: string;
  icon?:  LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  className = "" 
}) => {
  return (
    <div className={`bg-white border border-gray-200 dark:bg-black/10 dark:border-white/10 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        {Icon && <Icon className="w-5 h-5 mr-2 text-[#003D6B] dark:text-white" />}
        {title}
      </h3>
      {children}
    </div>
  );
};

export default ChartContainer;
