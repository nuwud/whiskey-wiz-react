import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminDashboardService, AdminDashboardMetrics } from '@/services/AdminDashboardService';
import { 
  BarChart, 
  LineChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

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
      {/* Player Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Player Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Total Players: {metrics.totalPlayers}</p>
            <div>
              <h4 className="font-medium">Authentication Breakdown</h4>
              <BarChart
                width={300}
                height={200}
                data={[
                  { name: 'Guest', value: metrics.playerDemographics.authMethodBreakdown.guest },
                  { name: 'Email', value: metrics.playerDemographics.authMethodBreakdown.email },
                  { name: 'Gmail', value: metrics.playerDemographics.authMethodBreakdown.gmail },
                  { name: 'Shopify', value: metrics.playerDemographics.authMethodBreakdown.shopify },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarter Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Quarter Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            width={300}
            height={200}
            data={metrics.quarterPerformance}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarterId" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="averageScore" stroke="#8884d8" />
            <Line type="monotone" dataKey="totalPlayers" stroke="#82ca9d" />
          </LineChart>
        </CardContent>
      </Card>

      {/* Revenue Projections */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Subscription Conversions</p>
              <p className="text-2xl font-bold">
                {metrics.revenueProjections.subscriptionConversions}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Merchandise Sales</p>
              <p className="text-2xl font-bold">
                ${metrics.revenueProjections.merchandiseSales}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Bottle Sales</p>
              <p className="text-2xl font-bold">
                ${metrics.revenueProjections.bottleSales}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Recommended Merchandise</h4>
              <ul className="list-disc pl-4">
                {metrics.machineLearningSuggestions.recommendedMerchandise.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
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