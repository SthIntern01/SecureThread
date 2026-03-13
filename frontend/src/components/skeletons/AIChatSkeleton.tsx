import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const AIChatSkeleton = () => {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
      <div className="min-h-screen flex flex-col relative">
        {/* Header */}
        <header className="flex justify-between items-center p-6 relative z-20">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>

        {/* Main Content - Centered */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10 pb-32">
          <div className="max-w-4xl mx-auto space-y-8 w-full">
            {/* Badge with icon */}
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-10 w-80 rounded-full" />
              </div>
            </div>

            {/* Main Headline - Large and Bold */}
            <div className="space-y-4">
              <Skeleton className="h-16 w-full max-w-3xl mx-auto" />
              <Skeleton className="h-16 w-[600px] mx-auto" />
            </div>

            {/* Subtitle */}
            <Skeleton className="h-6 w-[700px] mx-auto" />

            {/* Suggestion Pills - 2 rows */}
            <div className="pt-8 space-y-4">
              <div className="flex justify-center gap-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-56 rounded-full" />
                ))}
              </div>
              <div className="flex justify-center gap-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-52 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer Input - Fixed at bottom */}
        <footer className="fixed bottom-0 left-0 right-0 p-6 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-white/20 z-30">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 bg-white dark:bg-white/10 rounded-2xl border-2 border-gray-200 dark:border-white/20 p-3">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-40 mt-2 mx-auto" />
          </div>
        </footer>
      </div>
    </div>
  );
};