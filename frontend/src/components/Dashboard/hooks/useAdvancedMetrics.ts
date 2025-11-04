import { useState } from 'react';
import { AdvancedMetrics, TimeFilter } from '../types/dashboard.types';

export const useAdvancedMetrics = () => {
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");

  const getTimeRangeForAPI = (filter: TimeFilter): string => {
    const mapping: { [key in TimeFilter]: string } = {
      lastDay: '1d',
      lastWeek: '7d',
      lastMonth: '30d',
      last6Months: '180d',
      lastYear: '1y',
      allTime: 'all'
    };
    return mapping[filter] || '30d';
  };

  const fetchAdvancedMetrics = async (
    timeFilter: TimeFilter,
    selectedRepository: number | 'all'
  ): Promise<AdvancedMetrics | null> => {
    try {
      setMetricsLoading(true);
      setMetricsError("");

      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams({
        time_range: getTimeRangeForAPI(timeFilter),
        include_trends: 'true'
      });
      
      if (selectedRepository !== 'all') {
        params.append('repository_id', selectedRepository.toString());
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/metrics/security-overview?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Advanced metrics response:', data);
        
        const metrics: AdvancedMetrics = {
          codeQualityMetrics: data.code_quality_metrics || {},
          owaspAnalysis: data.owasp_analysis || {},
          complianceScores: data.compliance_scores || {},
          vulnerabilityTrends: data.vulnerability_trends || {},
          teamMetrics: data.team_metrics || {},
          technicalDebtDetailed: data.technical_debt || {}
        };

        setAdvancedMetrics(metrics);
        return metrics;
      }
      
      setMetricsError("Failed to fetch advanced metrics");
      return null;
    } catch (err) {
      console.error("Error fetching advanced metrics:", err);
      setMetricsError("Error fetching advanced metrics");
      return null;
    } finally {
      setMetricsLoading(false);
    }
  };

  return {
    advancedMetrics,
    metricsLoading,
    metricsError,
    fetchAdvancedMetrics
  };
};