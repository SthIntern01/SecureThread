import React from 'react';
import CodeMetrics from './CodeMetrics';
import TechnicalDebt from './TechnicalDebt';
import CodeSmells from './CodeSmells';
import { EnhancedDashboardData } from '../../types/dashboard.types';

interface QualityViewProps {
  data: EnhancedDashboardData;
}

const QualityView: React.FC<QualityViewProps> = ({ data }) => {
  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <CodeMetrics data={data} />
        <TechnicalDebt data={data} />
        <CodeSmells data={data} />
      </div>
    </div>
  );
};

export default QualityView;