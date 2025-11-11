import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
        <p className="theme-text mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;