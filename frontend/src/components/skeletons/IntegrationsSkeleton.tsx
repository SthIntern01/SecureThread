import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const IntegrationsSkeleton = () => {
  return (
    <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
      {/* Header Section */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <div className="flex items-center space-x-2 text-sm mb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Skeleton className="h-9 w-56 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>
      </div>

      {/* Stats Section - 3 cards */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="bg-green-50 dark:bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-green-200 dark:border-white/20"
            >
              <Skeleton className="h-10 w-16 mx-auto mb-2" />
              <Skeleton className="h-5 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-gray-200 dark:border-white/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4 flex-1">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};