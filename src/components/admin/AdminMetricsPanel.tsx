"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminDashboardService, AdminDashboardMetrics } from '@/services/AdminDashboardService';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { AdminMetricsPanelLoading } from '../common/LoadingStates';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function AdminMetricsPanel() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const adminService = new AdminDashboardService();

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getComprehensiveDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) return <AdminMetricsPanelLoading />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading metrics</AlertTitle>
        <AlertDescription>
          {error.message}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            className="mt-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return null;

  return (
    <ErrorBoundary>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

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
                      <span>Top Player: {quarter.topPerformer.username}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
    </ErrorBoundary>
  );
}