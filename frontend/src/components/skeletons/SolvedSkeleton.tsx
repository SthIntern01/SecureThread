import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const SolvedSkeleton = () => {
  return (
    <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-8 bg-gradient-to-br from-[#D6E6FF]/30 to-[#E8F0FF]/30 dark:from-orange-500/10 dark:to-orange-500/5 border-b border-gray-200 dark:border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-10 w-20 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <div className="flex flex-wrap items-center gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
          <Skeleton className="h-10 flex-1 min-w-64 rounded-lg ml-auto" />
        </div>
      </div>

      {/* Issues List */}
      <div className="p-8">
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex items-center space-x-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};