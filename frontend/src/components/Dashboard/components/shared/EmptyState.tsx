import React from 'react';
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon:  LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  iconClassName = "w-12 h-12 mx-auto mb-3" 
}) => {
  return (
    <div className="text-center py-8 text-gray-500 dark:text-white/60">
      <Icon className={iconClassName || "w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-white/40"} />
      <p>{title}</p>
      <p className="text-sm text-gray-400 dark:text-white/40 mt-1">{description}</p>
    </div>
  );
};

export default EmptyState;