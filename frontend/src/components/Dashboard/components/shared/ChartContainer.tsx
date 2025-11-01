import React from 'react';
import { LucideIcon } from "lucide-react";

interface ChartContainerProps {
  title: string;
  icon?: LucideIcon;
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
    <div className={`bg-black/20 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        {Icon && <Icon className="w-5 h-5 mr-2" />}
        {title}
      </h3>
      {children}
    </div>
  );
};

export default ChartContainer;