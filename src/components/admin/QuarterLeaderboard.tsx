import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { QuarterLeaderboardLoading } from '../common/LoadingStates';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  age: number;
  proof: number;
  mashbill: string;
  completed: Date;
}

export function QuarterLeaderboard({ quarterId }: { quarterId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const resultsRef = collection(db, 'gameResults');
      const q = query(
        resultsRef,
        where('quarterId', '==', quarterId),
        orderBy('score', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const leaderboardData = querySnapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          rank: index + 1,
          playerId: data.userId,
          playerName: data.playerName,
          score: data.score,
          age: data.age,
          proof: data.proof,
          mashbill: data.mashbill,
          completed: data.completedAt?.toDate() || new Date()
        };
      });

      setEntries(leaderboardData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch leaderboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [quarterId]);

  if (loading) return <QuarterLeaderboardLoading />;

  const content = (
    <Card>
      <CardHeader className="bg-amber-50 border-b flex flex-row justify-between items-center">
        <CardTitle>Quarter {quarterId} Leaderboard</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLeaderboard}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mashbill</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.playerId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.rank}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.playerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.score}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.age}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.proof}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.mashbill}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.completed.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary>
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading leaderboard</AlertTitle>
          <AlertDescription>
            {error.message}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeaderboard}
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