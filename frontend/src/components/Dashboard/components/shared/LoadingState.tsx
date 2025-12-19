import React from 'react';
import { RefreshCw } from "lucide-react";

interface LoadingStateProps {
  message?:  string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading enhanced security analytics..." 
}) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-[#003D6B] dark: text-white animate-spin mx-auto mb-4" />
        <p className="text-gray-900 dark: text-white">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;