import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { PlayerStatsLoading } from '../common/LoadingStates';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface GameResult {
  id: string;
  quarter: string;
  score: number;
  accuracy: number;
  completedAt: Date;
}

export function PlayerStats() {
  const [stats, setStats] = useState({
    totalGames: 0,
    averageScore: 0,
    bestQuarter: '',
    results: [] as GameResult[]
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const resultsRef = collection(db, 'gameResults');
      const q = query(resultsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GameResult[];

      const avgScore = results.reduce((acc, game) => acc + game.score, 0) / results.length;
      const bestGame = results.reduce((best, game) => 
        game.score > (best?.score || 0) ? game : best
      , results[0]);

      setStats({
        totalGames: results.length,
        averageScore: avgScore,
        bestQuarter: bestGame?.quarter || '',
        results
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <PlayerStatsLoading />;

  const content = (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalGames}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageScore.toFixed(1)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Best Quarter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.bestQuarter}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Recent Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.results.slice(0, 5).map(result => (
              <div key={result.id} className="flex justify-between items-center">
                <span>{result.quarter}</span>
                <span className="text-lg font-medium">{result.score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ErrorBoundary>
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading stats</AlertTitle>
          <AlertDescription>
            {error.message}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
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