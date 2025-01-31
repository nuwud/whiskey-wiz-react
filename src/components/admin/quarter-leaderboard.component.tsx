import { useEffect, useState } from 'react';
import { quarterService } from '../../services/quarter.service';
import { LeaderboardEntry } from '../../services/leaderboard.service';

export const QuarterLeaderboard = ({ quarterId }: { quarterId: string }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [quarterId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const leaderboardData = await quarterService.getQuarterLeaderboard(quarterId);
      setEntries(leaderboardData.map(entry => ({
        userId: entry.userId,
        username: entry.displayName || '',
        displayName: entry.displayName || '',
        quarterId: quarterId,
        score: entry.score,
        totalScore: entry.score,
        timestamp: new Date(entry.completedAt),
        completedAt: new Date(entry.completedAt),
        totalChallengesCompleted: 0,
        accuracy: {
          age: entry.accuracy.age,
          proof: entry.accuracy.proof,
          mashbill: entry.accuracy.mashbill
        }
      })));
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-spin h-8 w-8 border-t-2 border-amber-600 rounded-full mx-auto"></div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-amber-50 border-b">
        <h3 className="text-lg font-medium text-amber-900">Quarter Leaderboard</h3>
      </div>

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
                  <div className={`text-sm ${index === 0 ? 'text-amber-600 font-bold' :
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

      {entries.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No entries yet for this quarter.
        </div>
      )}
    </div>
  );
};