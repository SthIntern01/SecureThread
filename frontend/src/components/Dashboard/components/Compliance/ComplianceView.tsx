import React from 'react';
import ComplianceScores from './ComplianceScores';
import OwaspAnalysis from './OwaspAnalysis';
import TeamMetrics from './TeamMetrics';
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface ComplianceViewProps {
  data: EnhancedDashboardData;
}

const ComplianceView: React.FC<ComplianceViewProps> = ({ data }) => {
  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <ComplianceScores data={data} />
        <OwaspAnalysis data={data} />
        <TeamMetrics data={data} />
      </div>
    </div>
  );
};

export default ComplianceView;