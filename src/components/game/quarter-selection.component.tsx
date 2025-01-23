import React, { useEffect, useState } from 'react';
import { Quarter } from '../../types/game.types';
import { quarterService } from '../../services/quarterService';

interface QuarterSelectionProps {
  onSelect: (quarter: Quarter) => void;
  showInactive?: boolean;
}

export const QuarterSelection = ({ 
  onSelect,
  showInactive = false 
}: QuarterSelectionProps) => {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuarters = async () => {
      try {
        const fetchedQuarters = showInactive 
          ? await quarterService.getAllQuarters()
          : await quarterService.getActiveQuarters();
        setQuarters(fetchedQuarters);
      } catch (err) {
        setError('Failed to load quarters. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuarters();
  }, [showInactive]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  if (quarters.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600">No quarters available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quarters.map((quarter) => (
        <button
          key={quarter.id}
          onClick={() => onSelect(quarter)}
          className={`p-6 rounded-lg shadow-lg text-left transition-transform hover:scale-105 ${
            quarter.isActive
              ? 'bg-white hover:shadow-xl'
              : 'bg-gray-50 hover:shadow-lg'
          }`}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {quarter.name}
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date:</span>
              <span className="text-gray-900">
                {quarter.startDate.toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">End Date:</span>
              <span className="text-gray-900">
                {quarter.endDate.toLocaleDateString()}
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
          </div>
        </button>
      ))}
    </div>
  );
};