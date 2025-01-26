import { useEffect, useState } from 'react';
import { Quarter } from '../../types/game.types';
import { quarterService } from 'src/services/quarter.service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface QuarterStats {
  topScore: number;
  totalPlayers: number;
  averageScore: number;
  completionRate: number;
  sampleAccuracy: {
    age: number;
    proof: number;
    mashbill: number;
  };
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

interface DailyStats {
  date: string;
  players: number;
  averageScore: number;
  completionRate: number;
}

export const quarterAnalytics = () => {
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [stats, setStats] = useState<QuarterStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuarters();
  }, []);

  const loadQuarters = async () => {
    try {
      const fetchedQuarters = await quarterService.getAllQuarters();
      setQuarters(fetchedQuarters);
      if (fetchedQuarters.length > 0) {
        await loadQuarterStats(fetchedQuarters[0]);
      }
    } catch (err) {
      setError('Failed to load quarters');
    } finally {
      setLoading(false);
    }
  };

  const loadQuarterStats = async (quarter: Quarter) => {
    try {
      setLoading(true);
      setSelectedQuarter(quarter);
      const [quarterStats, dailyData] = await Promise.all([
        quarterService.getQuarterStats(quarter.id),
        quarterService.getDailyStats(quarter.id)
      ]);
      setStats(quarterStats as unknown as QuarterStats);
      setDailyStats(dailyData as DailyStats[]);
    } catch (err) {
      setError('Failed to load statistics');
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
    <div className="space-y-8">
      {/* Quarter Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Quarter
        </label>
        <select title="Select Quarter"
          value={selectedQuarter?.id}
          onChange={(e) => {
            const quarter = quarters.find(q => q.id === e.target.value);
            if (quarter) loadQuarterStats(quarter);
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
        >
          {quarters.map(quarter => (
            <option key={quarter.id} value={quarter.id}>
              {quarter.name}
            </option>
          ))}
        </select>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900">Total Players</h3>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {stats.totalPlayers}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900">Average Score</h3>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {Math.round(stats.averageScore)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900">Top Score</h3>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {stats.topScore}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900">Completion Rate</h3>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {Math.round(stats.completionRate)}%
            </p>
          </div>
        </div>
      )}

      {/* Daily Trends Chart */}
      {dailyStats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="averageScore"
                  stroke="#f59e0b"
                  name="Average Score"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="players"
                  stroke="#3b82f6"
                  name="Players"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sample Accuracy */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Accuracy</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { category: 'Age', accuracy: stats.sampleAccuracy.age },
                  { category: 'Proof', accuracy: stats.sampleAccuracy.proof },
                  { category: 'Mashbill', accuracy: stats.sampleAccuracy.mashbill }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#f59e0b" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Difficulty Distribution */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Player Difficulty Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { level: 'Beginner', players: stats.difficultyDistribution.beginner },
                  { level: 'Intermediate', players: stats.difficultyDistribution.intermediate },
                  { level: 'Advanced', players: stats.difficultyDistribution.advanced }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="players" fill="#f59e0b" name="Players" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};