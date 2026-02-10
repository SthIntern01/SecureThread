import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
      {/* Header Skeleton */}
      <div className="p-6 border-b border-gray-200 dark:border-white/20">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 pt-6">
        <div className="flex space-x-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/20">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/10"
            >
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/10"
            >
              <Skeleton className="h-6 w-48 mb-6" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};