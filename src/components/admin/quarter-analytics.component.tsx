import React, { useEffect, useState } from 'react';
import { quarterService } from '../../services/quarter';
import { Quarter, QuarterAnalytics as QuarterAnalyticsType } from '../../types/game.types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card-ui.component';

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
  lastPlayed?: Date;
}

interface DailyStats {
  date: string;
  players: number;
  averageScore: number;
  completionRate: number;
}

interface LoadingState {
  quarters: boolean;
  stats: boolean;
  analytics: boolean;
}

const QuarterAnalytics: React.FC = () => {
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [stats, setStats] = useState<QuarterStats | null>(null);
  const [analytics, setAnalytics] = useState<QuarterAnalyticsType | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    quarters: true,
    stats: false,
    analytics: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuarters();
  }, []);

  const loadQuarters = async () => {
    try {
      setLoading(prev => ({ ...prev, quarters: true }));
      setError(null);
      
      const fetchedQuarters = await quarterService.getAllQuarters();
      
      if (!fetchedQuarters || fetchedQuarters.length === 0) {
        setError('No quarters available');
        return;
      }

      setQuarters(fetchedQuarters);
      await loadQuarterData(fetchedQuarters[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quarters');
      console.error('Error loading quarters:', err);
    } finally {
      setLoading(prev => ({ ...prev, quarters: false }));
    }
  };

  const loadQuarterData = async (quarter: Quarter) => {
    try {
      setLoading(prev => ({ ...prev, stats: true, analytics: true }));
      setError(null);
      setSelectedQuarter(quarter);

      const [quarterStats, dailyData, analyticsData] = await Promise.all([
        quarterService.getQuarterStats(quarter.id),
        quarterService.getDailyStats(quarter.id),
        quarterService.getQuarterAnalytics(quarter.id)
      ]);

      if (!quarterStats) {
        throw new Error('Failed to load quarter statistics');
      }

      setStats(quarterStats);
      setDailyStats(dailyData || []);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quarter data');
      console.error('Error loading quarter data:', err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false, analytics: false }));
    }
  };

  const renderLoadingState = () => (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-gray-600">Loading data...</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="p-4 bg-red-50 text-red-600 rounded">
      <p>{error}</p>
      <button 
        onClick={() => loadQuarters()} 
        className="mt-2 text-sm underline hover:text-red-700"
      >
        Try again
      </button>
    </div>
  );

  const renderQuarterSelector = () => (
    <Card>
      <CardHeader>
        <CardTitle>Select Quarter</CardTitle>
      </CardHeader>
      <CardContent>
        <label title="Select Quarter" htmlFor="quarter-select" className="block text-sm font-medium text-gray-700">
          Select Quarter
        </label>
        <select
          id="quarter-select"
          value={selectedQuarter?.id}
          onChange={(e) => {
            const quarter = quarters.find(q => q.id === e.target.value);
            if (quarter) loadQuarterData(quarter);
          }}
          className="w-full p-2 border rounded-md border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          disabled={loading.quarters}
        >
          {quarters.map(quarter => (
            <option key={quarter.id} value={quarter.id}>
              {quarter.name}
            </option>
          ))}
        </select>
      </CardContent>
    </Card>
  );

  const renderOverviewStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {stats.totalPlayers.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {stats.averageScore.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {stats.topScore.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {stats.completionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDailyTrends = () => {
    if (!dailyStats || dailyStats.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Daily Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 text-gray-500">
              No daily statistics available
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  yAxisId="left"
                  domain={[0, 'auto']}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  domain={[0, 'auto']}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => value.toFixed(1)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="averageScore"
                  stroke="#f59e0b"
                  name="Average Score"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="players"
                  stroke="#3b82f6"
                  name="Players"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Quarter Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Some analytics data here...</p>
          {/* Add more detailed analytics data as needed */}
        </CardContent>
      </Card>
    );
  };

  const renderSampleAccuracy = () => {
    if (!stats) return null;

    const accuracyData = [
      { category: 'Age', accuracy: stats.sampleAccuracy.age * 100 },
      { category: 'Proof', accuracy: stats.sampleAccuracy.proof * 100 },
      { category: 'Mashbill', accuracy: stats.sampleAccuracy.mashbill * 100 }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Sample Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Accuracy %',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar 
                  dataKey="accuracy" 
                  fill="#f59e0b"
                  name="Accuracy %"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDifficultyDistribution = () => {
    if (!stats) return null;

    const difficultyData = [
      { level: 'Beginner', players: stats.difficultyDistribution.beginner },
      { level: 'Intermediate', players: stats.difficultyDistribution.intermediate },
      { level: 'Advanced', players: stats.difficultyDistribution.advanced }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Difficulty Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="level"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Number of Players',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip />
                <Bar 
                  dataKey="players" 
                  fill="#f59e0b"
                  name="Players"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading.quarters) {
    return renderLoadingState();
  }

  if (error) {
    return renderErrorState();
  }

  if (!selectedQuarter || quarters.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded">
        <p>No quarters available. Please create a quarter first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {renderQuarterSelector()}
      
      {loading.stats ? (
        renderLoadingState()
      ) : (
        <>
          {renderOverviewStats()}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {renderDailyTrends()}
            {renderSampleAccuracy()}
          </div>
          {renderDifficultyDistribution()}
          {renderAnalytics()}
        </>
      )}
    </div>
  );
};

export default QuarterAnalytics;