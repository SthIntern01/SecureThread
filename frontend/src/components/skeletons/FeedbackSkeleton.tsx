import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const FeedbackSkeleton = () => {
  return (
    <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-8 text-center border-b border-gray-200 dark:border-white/20 bg-gradient-to-br from-[#D6E6FF]/30 to-[#E8F0FF]/30 dark:from-orange-500/10 dark:to-orange-500/5">
        <Skeleton className="h-10 w-64 mx-auto mb-3" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      {/* Form */}
      <div className="p-8 space-y-6">
        {/* Feedback Type */}
        <div>
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <Skeleton className="h-5 w-24 mb-3" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Description */}
        <div>
          <Skeleton className="h-5 w-28 mb-3" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>

        {/* Attachments */}
        <div>
          <Skeleton className="h-5 w-32 mb-3" />
          <Skeleton className="h-24 w-full rounded-lg border-2 border-dashed" />
        </div>

        {/* Submit Button */}
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
};