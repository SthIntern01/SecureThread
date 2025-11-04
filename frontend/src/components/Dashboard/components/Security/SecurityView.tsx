import React from 'react';
import VulnerabilityTrends from './VulnerabilityTrends';
import MTTRAnalysis from './MTTRAnalysis';
import SecurityHotspots from './SecurityHotspots';
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface SecurityViewProps {
  data: EnhancedDashboardData;
}

const SecurityView: React.FC<SecurityViewProps> = ({ data }) => {
  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <VulnerabilityTrends data={data} />
        <MTTRAnalysis data={data} />
        <SecurityHotspots data={data} />
      </div>
    </div>
  );
};

export default SecurityView;