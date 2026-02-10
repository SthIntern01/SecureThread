import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const ProjectCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-white/20 p-6 transition-all">
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Description */}
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-4" />

      {/* Vulnerability stats */}
      <div className="flex items-center space-x-4 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-8 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer with last scan and button */}
      <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200 dark:border-white/20">
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
};

export const ProjectsSkeleton = () => {
  return (
    <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
      {/* Header Section - EXACT match */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <div className="flex items-center space-x-2 text-sm mb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="mt-6 lg:mt-0">
            <Skeleton className="h-10 w-56 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Stats Section - Grid of 4 */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-10 w-20 mx-auto mb-1" />
              <Skeleton className="h-5 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};