import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const AIChatSkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-gray-200 dark:border-white/20 bg-white/80 dark:bg-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Welcome Message */}
        <div className="flex justify-center">
          <div className="max-w-2xl text-center space-y-4">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
        </div>

        {/* Sample Messages */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-2xl ${
              i % 2 === 0 
                ? 'bg-white dark:bg-white/10' 
                : 'bg-[#003D6B]/10 dark:bg-orange-500/20'
            } rounded-2xl p-4 border border-gray-200 dark:border-white/20`}>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-200 dark:border-white/20 bg-white/80 dark:bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
};