import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { AdminMetricsPanelLoading } from '../common/LoadingStates';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function AdminMetricsPanel() {
  const [metrics, setMetrics] = useState({
    totalPlayers: 0,
    activeQuarters: 0,
    averageScore: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const resultsRef = collection(db, 'gameResults');
      const playersRef = collection(db, 'users');
      const quartersRef = collection(db, 'quarters');

      const [resultsSnap, playersSnap, quartersSnap] = await Promise.all([
        getDocs(query(resultsRef)),
        getDocs(query(playersRef)),
        getDocs(query(quartersRef))
      ]);

      const results = resultsSnap.docs.map(doc => doc.data());
      const totalScores = results.reduce((acc, result) => acc + result.score, 0);
      const avgScore = results.length > 0 ? totalScores / results.length : 0;

      setMetrics({
        totalPlayers: playersSnap.size,
        activeQuarters: quartersSnap.docs.filter(doc => doc.data().status === 'active').length,
        averageScore: avgScore,
        completionRate: (results.length / (playersSnap.size * quartersSnap.size)) * 100
      });
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

  const content = (
    <div className="space-y-6">
      <div className="flex justify-end">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPlayers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Quarters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeQuarters}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageScore.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      {error ? (
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
      ) : (
        content
      )}
    </ErrorBoundary>
  );
}