import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DocsSkeleton = () => {
  return (
    <>
      {/* Header Container with Search */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm mb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Title and Description */}
          <div className="text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-[500px] mx-auto" />
          </div>
        </div>

        {/* Search Section */}
        <div className="p-8">
          <div className="relative max-w-2xl mx-auto">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Quick Start Section - 4 cards grid */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </div>

      {/* Features Section - Large feature cards */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/20 p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-4" />
                {/* Feature list items */}
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started Section - Step by step */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="p-8 space-y-8">
          {/* Step cards */}
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="flex items-center space-x-3 mb-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-7 w-64" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-4" />
              {/* Code block */}
              <div className="bg-gray-900 dark:bg-black/40 rounded-lg p-4 border border-gray-700 dark:border-white/10">
                <Skeleton className="h-4 w-32 mb-2 bg-gray-700 dark:bg-white/20" />
                <Skeleton className="h-4 w-48 mb-2 bg-gray-700 dark:bg-white/20" />
                <Skeleton className="h-4 w-40 bg-gray-700 dark:bg-white/20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Integrations Section */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          <Skeleton className="h-7 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-white/10 rounded-xl p-6 border border-gray-200 dark:border-white/20"
              >
                <Skeleton className="w-12 h-12 rounded-lg mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>

          {/* Integration cards with lists */}
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-white/10 rounded-xl p-6 border border-gray-200 dark:border-white/20"
              >
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex items-start space-x-3">
                      <Skeleton className="w-5 h-5 rounded mt-0.5" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          <Skeleton className="h-7 w-56 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-white/10 rounded-lg p-4 border border-gray-200 dark:border-white/20"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Skeleton className="w-5 h-5 rounded" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section - Accordion style */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          <Skeleton className="h-7 w-72 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="p-8 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-white/10 rounded-xl p-6 border border-gray-200 dark:border-white/20"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action - Gradient banner */}
      <div className="bg-gradient-to-r from-[#D6E6FF] to-[#E8F0FF] dark:from-orange-500/20 dark:to-orange-500/40 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
        <div className="p-12 text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-6" />
          <Skeleton className="h-8 w-96 mx-auto mb-4" />
          <Skeleton className="h-5 w-[600px] mx-auto mb-8" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton className="h-12 w-48 rounded-lg" />
            <Skeleton className="h-12 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    </>
  );
};