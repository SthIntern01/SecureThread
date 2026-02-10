import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DocsSkeleton = () => {
  return (
    <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
      {/* Hero Section */}
      <div className="p-8 md:p-12 text-center border-b border-gray-200 dark:border-white/20 bg-gradient-to-br from-[#D6E6FF]/30 to-[#E8F0FF]/30 dark:from-orange-500/10 dark:to-orange-500/5">
        <Skeleton className="h-12 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 mx-auto mb-8" />
        <div className="flex items-center justify-center space-x-4">
          <Skeleton className="h-12 w-48 rounded-lg" />
          <Skeleton className="h-12 w-40 rounded-lg" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-xl" />
      </div>

      {/* Quick Start Cards */}
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/20 text-center"
            >
              <Skeleton className="w-12 h-12 rounded-xl mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
          ))}
        </div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {[...Array(3)].map((_, sectionIndex) => (
            <div key={sectionIndex}>
              <Skeleton className="h-8 w-56 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/20"
                  >
                    <Skeleton className="w-10 h-10 rounded-lg mb-4" />
                    <Skeleton className="h-6 w-48 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};