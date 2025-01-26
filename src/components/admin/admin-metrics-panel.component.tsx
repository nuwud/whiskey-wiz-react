"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-ui.component';
import { AdminDashboardMetrics, AdminDashboardService, } from 'src/services/admin-dashboard.service';

export function AdminMetricsPanel() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const adminService = new AdminDashboardService();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await adminService.getComprehensiveDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <div>Loading metrics...</div>;
  if (!metrics) return <div>No metrics available</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Player Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-bold">Total Players</h3>
              <p className="text-3xl font-bold">{metrics.totalPlayers}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold">Authentication Breakdown</h3>
              <ul className="space-y-2">
                {Object.entries(metrics.playerDemographics.authMethodBreakdown).map(([type, count]) => (
                  <li key={type} className="flex justify-between">
                    <span className="capitalize">{type}</span>
                    <span className="font-bold">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quarter Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4">
            {metrics.quarterPerformance.map((quarter) => (
              <div key={quarter.quarterId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{quarter.quarterId}</h4>
                  <span className="text-sm">
                    Average Score: {quarter.averageScore}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Total Players: {quarter.totalPlayers}</span>
                  {quarter.topPerformer && (
                    <span>Top Player: {quarter.topPerformer.displayName}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Cards */}
      <Card>
        <CardHeader>
          <CardTitle>ML Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4">
            <div>
              <h4 className="font-medium">Marketing Segments</h4>
              <ul className="list-disc pl-4">
                {metrics.machineLearningSuggestions.marketingSegments.map((segment, i) => (
                  <li key={i}>{segment}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}