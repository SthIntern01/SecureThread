import React from 'react';
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  iconClassName = "w-12 h-12 mx-auto mb-3 text-white/40" 
}) => {
  return (
    <div className="text-center py-8 theme-text-muted">
      <Icon className={iconClassName} />
      <p>{title}</p>
      <p className="text-sm text-white/40 mt-1">{description}</p>
    </div>
  );
};

export default EmptyState;