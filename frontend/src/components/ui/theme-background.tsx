"use client";
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { EtherealBackground } from './ethereal-background';
import { BackgroundBeams } from './background-beams';
import { cn } from '@/lib/utils';

interface ThemeBackgroundProps {
  className?: string;
}

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ className }) => {
  const { actualTheme } = useTheme();

  return (
    <>
      {actualTheme === 'dark' ? (
        <EtherealBackground 
          className={cn("absolute inset-0", className)}
          color="rgba(255, 255, 255, 0.6)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.8, scale: 1.2 }}
          sizing="fill"
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-orange-50", className)}>
          <BackgroundBeams />
        </div>
      )}
    </>
  );
};
