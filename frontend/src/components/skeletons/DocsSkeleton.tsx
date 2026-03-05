import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DocsSkeleton = () => {
  return (
    <>
      {/* Header Container - Matches your screenshot */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm mb-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Title and Buttons Row - Left aligned title, right aligned buttons */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-12 w-80 mb-3" />
              <Skeleton className="h-5 w-[500px]" />
            </div>
            <div className="flex items-center space-x-3 ml-6">
              <Skeleton className="h-11 w-40 rounded-lg" />
              <Skeleton className="h-11 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Icon/Feature Section with centered icon */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-12 text-center">
          <div className="flex justify-center mb-8">
            <Skeleton className="w-20 h-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto mb-8" />
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Quick Start Cards - 4 column grid */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/15 transition-all duration-300 text-center"
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

      {/* Features Section - 2 column grid with detailed cards */}
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
                className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/20 p-6 hover:bg-gray-50 dark:hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-4" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Getting Started Section with Steps */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="p-8 space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="flex items-start space-x-4 mb-4">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <Skeleton className="h-7 w-64 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  {/* Code block */}
                  <div className="bg-gray-900 dark:bg-black/40 rounded-xl p-4 border border-gray-700 dark:border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="h-4 w-24 bg-gray-700 dark:bg-white/20" />
                      <Skeleton className="h-4 w-4 bg-gray-700 dark:bg-white/20" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2 bg-gray-700 dark:bg-white/20" />
                    <Skeleton className="h-4 w-48 mb-2 bg-gray-700 dark:bg-white/20" />
                    <Skeleton className="h-4 w-40 bg-gray-700 dark:bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Integrations Section */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          <Skeleton className="h-8 w-64 mb-2" />
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
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>

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
                      <Skeleton className="w-5 h-5 rounded flex-shrink-0 mt-0.5" />
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
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-white/10 rounded-lg p-4 border border-gray-200 dark:border-white/20"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Skeleton className="w-5 h-5 rounded" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden mb-6">
        <div className="p-8 border-b border-gray-200 dark:border-white/20">
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="p-8 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="bg-white dark:bg-white/10 rounded-xl p-6 border border-gray-200 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/15 transition-all"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="bg-gradient-to-r from-[#D6E6FF] to-[#E8F0FF] dark:from-orange-500/20 dark:to-orange-500/40 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden">
        <div className="p-12 text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-6" />
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
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