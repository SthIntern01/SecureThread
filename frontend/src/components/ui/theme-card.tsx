import React from 'react';
import { cn } from '@/lib/utils';

interface ThemeCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'solid';
}

export const ThemeCard: React.FC<ThemeCardProps> = ({ 
  children, 
  className,
  variant = 'default'
}) => {
  return (
    <div className={cn(
      'rounded-lg p-6',
      variant === 'solid' ? 'theme-card-solid' : 'theme-card',
      className
    )}>
      {children}
    </div>
  );
};