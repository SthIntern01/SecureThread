import React from 'react';
import { DashboardSkeleton } from '@/components/skeletons';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  return <DashboardSkeleton />;
};

export default LoadingState;