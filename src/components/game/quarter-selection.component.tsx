import React, { useEffect, useState } from 'react';
import { Quarter } from '@/types';
import { quarterService } from '@/services/quarter.service';
import { analyticsService } from '@/services/analytics.service';
import { useAuth } from '@/contexts/auth.context';

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
  const { user } = useAuth();
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
        
        // Sort quarters by start date (most recent first)
        const sortedQuarters = [...fetchedQuarters].sort(
          (a, b) => b.startDate.getTime() - a.startDate.getTime()
        );
        
        setQuarters(sortedQuarters);
        analyticsService.trackError('Quarters loaded', 'quarter_selection', user?.uid);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load quarters';
        setError(errorMessage);
        analyticsService.trackError(errorMessage, 'quarter_selection', user?.uid);
      } finally {
        setLoading(false);
      }
    };

    fetchQuarters();
  }, [showInactive, user]);

  const handleQuarterSelect = (quarter: Quarter) => {
    if (!user) return;

    // Track quarter selection
    analyticsService.trackError('Quarter selected', 'quarter_selection', user.uid);
    
    onSelect(quarter);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="text-sm text-red-700 text-center">{error}</div>
      </div>
    );
  }

  if (quarters.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
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
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {quarter.name}
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="text-gray-900">
                {new Date(quarter.startDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">End Date:</span>
              <span className="text-gray-900">
                {new Date(quarter.endDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Difficulty:</span>
              <span className={`font-medium ${
                quarter.difficulty === 'beginner'
                  ? 'text-green-600'
                  : quarter.difficulty === 'intermediate'
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}>
                {quarter.difficulty.charAt(0).toUpperCase() + quarter.difficulty.slice(1)}
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