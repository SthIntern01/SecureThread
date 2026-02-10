import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const HelpSkeleton = () => {
  return (
    <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-8 text-center border-b border-gray-200 dark:border-white/20">
        <Skeleton className="h-10 w-48 mx-auto mb-3" />
        <Skeleton className="h-5 w-96 mx-auto mb-6" />
        <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-xl" />
      </div>

      {/* FAQ Categories */}
      <div className="p-8">
        <Skeleton className="h-8 w-56 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/20 text-center"
            >
              <Skeleton className="w-12 h-12 rounded-xl mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          ))}
        </div>

        {/* FAQ Items */}
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-white/20"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};