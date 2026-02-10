import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const SettingsSkeleton = () => {
  return (
    <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Settings Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/20">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-1 p-4 text-center border-r border-gray-200 dark:border-white/20 last:border-r-0">
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Settings Content */}
      <div className="p-8 space-y-8">
        {[...Array(4)].map((_, sectionIndex) => (
          <div key={sectionIndex} className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/20">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-32 mb-3" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  {i === 0 && <Skeleton className="h-3 w-64 mt-2" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};