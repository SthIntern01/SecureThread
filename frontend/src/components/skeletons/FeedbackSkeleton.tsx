import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const FeedbackSkeleton = () => {
  return (
    <div className="bg-white/95 dark:bg-white/10 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
      {/* Header - Centered */}
      <div className="p-8 border-b border-gray-200 dark:border-white/20">
        {/* Breadcrumb - Left aligned */}
        <div className="flex items-center space-x-2 text-sm mb-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Title and Description - Centered */}
        <div className="text-center max-w-3xl mx-auto">
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-[600px] mx-auto" />
        </div>
      </div>

      {/* Form Content */}
      <div className="p-8">
        <div className="space-y-6">
          {/* Feedback Type Selection - 2x2 grid */}
          <div>
            <div className="flex items-center space-x-1 mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className="bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/20 rounded-xl p-6 flex items-center space-x-3"
                >
                  <Skeleton className="w-6 h-6 rounded flex-shrink-0" />
                  <Skeleton className="h-6 w-40" />
                </div>
              ))}
            </div>
          </div>

          {/* Description Field */}
          <div>
            <div className="flex items-center space-x-1 mb-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>

          {/* Attachments Upload Area */}
          <div>
            <Skeleton className="h-5 w-44 mb-4" />
            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-12">
              <Skeleton className="w-12 h-12 rounded-lg mx-auto mb-4" />
              <Skeleton className="h-5 w-56 mx-auto mb-2" />
              <Skeleton className="h-4 w-80 mx-auto mb-6" />
              <Skeleton className="h-11 w-40 mx-auto rounded-lg" />
            </div>
          </div>

          {/* Additional form fields if needed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-5 w-28 mb-4" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};