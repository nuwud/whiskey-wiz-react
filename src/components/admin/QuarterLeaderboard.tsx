import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { quarterService } from '../../services/quarterService';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { QuarterLeaderboardLoading } from '../common/LoadingStates';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  completedAt: Date;
  accuracy: {
    age: number;
    proof: number;
    mashbill: number;
  };
}

export const QuarterLeaderboard = ({ quarterId }: { quarterId: string }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const leaderboardData = await quarterService.getQuarterLeaderboard(quarterId);
      setEntries(leaderboardData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load leaderboard'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [quarterId]);

  if (loading) return <QuarterLeaderboardLoading />;

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader className="bg-amber-50 border-b flex flex-row justify-between items-center">
          <CardTitle>Quarter {quarterId} Leaderboard</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLeaderboard}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          {error ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading leaderboard</AlertTitle>
              <AlertDescription>
                {error.message}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadLeaderboard}
                  className="mt-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No entries yet for this quarter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age Accuracy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proof Accuracy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mashbill Accuracy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry, index) => (
                    <tr key={entry.userId} className={index < 3 ? 'bg-amber-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          index === 0 ? 'text-amber-600 font-bold' :
                          index === 1 ? 'text-gray-600 font-bold' :
                          index === 2 ? 'text-amber-800 font-bold' :
                          'text-gray-900'
                        }`}>
                          #{index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.displayName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-amber-600">
                          {entry.score}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {Math.round(entry.accuracy.age)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {Math.round(entry.accuracy.proof)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {Math.round(entry.accuracy.mashbill)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {entry.completedAt.toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};