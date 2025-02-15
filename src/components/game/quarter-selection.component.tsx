import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quarter } from '../../types/game.types';
import { quarterService } from '../../services/quarter';
import { AnalyticsService } from '../../services/analytics.service';
import { useAuth } from '../../contexts/auth.context';
import { Difficulty } from '../../types/game.types';
import { fromFirebaseTimestamp } from '../../utils/timestamp.utils';

interface QuarterSelectionProps {
  onSelect: (quarter: Quarter) => void;
  showInactive?: boolean;
  className?: string;
}

export const QuarterSelection: React.FC<QuarterSelectionProps> = ({
  onSelect,
  showInactive = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user, signInAsGuest } = useAuth();
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuarters = async () => {
      try {
        setLoading(true);
        const fetchedQuarters = await (showInactive
          ? quarterService.getAllQuarters()
          : quarterService.getActiveQuarters());

        const sortedQuarters = [...fetchedQuarters].sort(
          (a, b) => fromFirebaseTimestamp(b.startDate).getTime() - fromFirebaseTimestamp(a.startDate).getTime()
        );
        
        setQuarters(sortedQuarters);
        AnalyticsService.trackEvent('quarters_loaded', {
          count: sortedQuarters.length,
          userId: user?.userId
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load quarters';
        setError(errorMessage);
        AnalyticsService.trackEvent('quarter_selection_error', {
          error: errorMessage,
          userId: user?.userId
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuarters();
  }, [showInactive, user]);

  const handleQuarterSelect = async (quarter: Quarter) => {
    AnalyticsService.trackEvent('quarter_selected', {
      quarterId: quarter.id,
      quarterName: quarter.name,
      userId: user?.userId
    });
    onSelect(quarter);

    try {
      if (!user) {
        await signInAsGuest();
      }
      navigate(`/game/${quarter.id}`);
    } catch (error) {
      console.error('Failed to start game:', error);
      setError('Failed to start game. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600';
      case 'intermediate':
        return 'text-amber-600';
      case 'advanced':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-4 rounded-full border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50">
        <div className="text-sm text-center text-red-700">{error}</div>
      </div>
    );
  }

  if (quarters.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-gray-50">
        <p className="text-gray-600">
          {showInactive
            ? 'No quarters available.'
            : 'No active quarters available. Check back later!'}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {quarters.map((quarter) => (
        <button
          key={quarter.id}
          onClick={() => handleQuarterSelect(quarter)}
          className={`
            p-6 rounded-lg shadow-lg text-left transition-all
            ${quarter.isActive
              ? 'bg-white hover:shadow-xl hover:scale-105'
              : 'bg-gray-50 hover:shadow-lg hover:bg-gray-100'
            }
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
          `}
        >
          <h3 className="mb-2 text-lg font-bold text-gray-900">
            {quarter.name}
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="text-gray-900">
                {fromFirebaseTimestamp(quarter.startDate)?.toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">End Date:</span>
              <span className="text-gray-900">
                {fromFirebaseTimestamp(quarter.endDate)?.toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Difficulty:</span>
              <span className={`font-medium ${getDifficultyColor(quarter.difficulty)}`}>
                {typeof quarter.difficulty === 'string' &&
                  quarter.difficulty.charAt(0).toUpperCase() + quarter.difficulty.slice(1)}
              </span>
            </div>

            {quarter.isActive && (
              <div className="mt-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            )}

            {!quarter.isActive && showInactive && (
              <div className="mt-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Inactive
                </span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};