import React, { useState, useEffect } from 'react';
import { useAuth, useQuarter } from '../../contexts';
import { quarterService } from '../../services/quarter.service';
import { Quarter, WhiskeySample, ScoringRules, Difficulty, DifficultyEnum, Challenge } from '../../types/game.types';
import { SampleEditor } from './sample-editor.component';
import { Timestamp } from 'firebase/firestore';
import { toFirebaseTimestamp, fromFirebaseTimestamp } from '../../utils/timestamp.utils';

const DIFFICULTY_OPTIONS = Object.values(DifficultyEnum);

const DEFAULT_AGE_SCORING = {
  points: 35,
  maxPoints: 35,
  penaltyPerYear: 6,
  pointDeductionPerYear: 6,
  exactMatchBonus: 20,
  minValue: 1,
  maxValue: 10,
  hasLowerLimit: true,
  hasUpperLimit: false,
  gracePeriod: 1
} as const;

const DEFAULT_PROOF_SCORING = {
  points: 35,
  maxPoints: 35,
  penaltyPerPoint: 3,
  pointDeductionPerProof: 3,
  exactMatchBonus: 20,
  minValue: 80,
  maxValue: 120,
  hasLowerLimit: true,
  hasUpperLimit: false,
  gracePeriod: 1
} as const;

const DEFAULT_MASHBILL_SCORING = {
  points: 30,
  maxPoints: 30,
  pointDeductionPerType: 10,
  exactMatchBonus: 20
} as const;

const DEFAULT_SCORING = {
  age: DEFAULT_AGE_SCORING,
  proof: DEFAULT_PROOF_SCORING,
  mashbill: DEFAULT_MASHBILL_SCORING
} as const;

interface QuarterFormData {
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  duration: number;  // Changed from string to number
  difficulty: DifficultyEnum;
  minimumScore: number;
  maximumScore: number;
  minimumChallengesCompleted: number;
  isActive: boolean;
  samples: WhiskeySample[];
  description: string;
  scoringRules: ScoringRules;
  challenges: Array<Challenge>;
};

interface QuarterManagement {
  name: string;
  startDate: string;
  endDate: string;
  difficulty: DifficultyEnum;
  isActive: boolean;
  samples: WhiskeySample[];
  description: string;
  challenges: Array<Challenge>;
  scoringRules: ScoringRules;
};

// Initial form state
const initialFormState: QuarterFormData = {
  name: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  duration: 0,
  difficulty: DifficultyEnum.Beginner,
  minimumScore: 0,
  maximumScore: 100,
  minimumChallengesCompleted: 0,
  isActive: true,
  samples: [],
  description: '',
  challenges: [],
  scoringRules: DEFAULT_SCORING
};

// Utility functions
const formatTimeString = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const formatDateTimeForInput = (date: Date): string => {
  return date.toISOString().slice(0, 16);
};

const parseTimeString = (time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const calculateDuration = (startDate: Date, endDate: Date): number => {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
};

const QuarterManagement: React.FC = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSampleEditor, setShowSampleEditor] = useState(false);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [formData, setFormData] = useState<QuarterFormData>(initialFormState);

  // Hooks
  const { user } = useAuth();
  const { currentQuarter } = useQuarter();

  // Effects
  useEffect(() => {
    const loadQuarters = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const fetchedQuarters = await quarterService.getAllQuarters();
        setQuarters(fetchedQuarters);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quarters');
      } finally {
        setLoading(false);
      }
    };

    void loadQuarters();
  }, [user]);

  // Event handlers
  const handleQuarterSelect = (quarter: Quarter) => {
    setSelectedQuarter(quarter);
    const startDate = quarter.startDate instanceof Date ? 
      quarter.startDate : 
      quarter.startDate?.toDate?.() || new Date();
    const endDate = quarter.endDate instanceof Date ? 
      quarter.endDate : 
      quarter.endDate?.toDate?.() || new Date();
      
    setFormData({
      name: quarter.name,
      startDate: fromFirebaseTimestamp(quarter.startDate).toISOString().split('T')[0],
      endDate: fromFirebaseTimestamp(quarter.endDate).toISOString().split('T')[0],
      startTime: formatTimeString(startDate),
      endTime: formatTimeString(endDate),
      duration: calculateDuration(startDate, endDate),
      difficulty: quarter.difficulty as DifficultyEnum,
      minimumScore: quarter.minimumScore || 0,
      maximumScore: quarter.maximumScore || 100,
      minimumChallengesCompleted: quarter.minimumChallengesCompleted || 0,
      isActive: quarter.isActive,
      samples: quarter.samples || [],
      description: quarter.description || '',
      challenges: quarter.challenges || [],
      scoringRules: quarter.scoringRules || DEFAULT_SCORING
    });
    setIsEditing(true);
  };

  const handleNewQuarter = () => {
    const now = new Date();
    setSelectedQuarter(null);
    setFormData({
      ...initialFormState,
      startDate: formatDateTimeForInput(now),
      endDate: formatDateTimeForInput(now),
      startTime: formatTimeString(now),
      endTime: formatTimeString(now)
    });
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      
      if (name === 'startDate' || name === 'endDate') {
        const startDate = name === 'startDate' ? new Date(value) : new Date(prev.startDate);
        const endDate = name === 'endDate' ? new Date(value) : new Date(prev.endDate);
        return {
          ...prev,
          [name]: value,
          duration: calculateDuration(startDate, endDate)
        };
      }

      if (name === 'startTime' || name === 'endTime') {
        return {
          ...prev,
          [name]: formatTimeString(parseTimeString(value))
        };
      }

      return {
        ...prev,
        [name]: newValue
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const quarterData: Omit<Quarter, 'id'> = {
        name: formData.name,
        startDate: toFirebaseTimestamp(new Date(formData.startDate)),
        endDate: toFirebaseTimestamp(new Date(formData.endDate)),
        startTime: toFirebaseTimestamp(parseTimeString(formData.startTime)),
        endTime: toFirebaseTimestamp(parseTimeString(formData.endTime)),
        duration: formData.duration,
        difficulty: formData.difficulty.toLowerCase() as Difficulty,
        minimumScore: formData.minimumScore,
        maximumScore: formData.maximumScore,
        minimumChallengesCompleted: formData.minimumChallengesCompleted,
        isActive: formData.isActive,
        samples: formData.samples,
        description: formData.description,
        challenges: formData.challenges,
        scoringRules: formData.scoringRules,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (selectedQuarter) {
        await quarterService.updateQuarter(selectedQuarter.id, quarterData);
      } else {
        await quarterService.createQuarter(quarterData);
      }

      const fetchedQuarters = await quarterService.getAllQuarters();
      setQuarters(fetchedQuarters);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quarter');
    } finally {
      setLoading(false);
    }
  };

  const handleSamplesUpdate = (samples: WhiskeySample[]): void => {
    setFormData(prev => ({
      ...prev,
      samples
    }));
    setShowSampleEditor(false);
  };

  // Render methods
  if (loading) {
    return <div className="w-8 h-8 mx-auto border-t-2 rounded-full animate-spin border-amber-600" />;
  }

  if (!user) {
    return <div className="p-4">You must be logged in to access this page.</div>;
  }

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">Quarter Management</h2>
      <button
        onClick={handleNewQuarter}
        className="px-4 py-2 text-white rounded-md bg-amber-600 hover:bg-amber-700"
      >
        Create New Quarter
      </button>
    </div>

    {error && (
      <div className="p-4 text-red-600 rounded-md bg-red-50">
        {error}
      </div>
    )}

    {currentQuarter && !isEditing && (
      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
        <h3 className="font-medium">Current Active Quarter</h3>
        <p>{currentQuarter.name}</p>
        <p className="text-sm text-gray-600">
          {fromFirebaseTimestamp(currentQuarter.startDate).toLocaleDateString()} - {fromFirebaseTimestamp(currentQuarter.endDate).toLocaleDateString()}
        </p>
      </div>
    )}

    {isEditing ? (
      <div className="p-6 bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quarter Name
            </label>
            <input
              aria-label="Quarter Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                aria-label="Start Date"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                aria-label="End Date"
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Difficulty
              </label>
              <select
                title="Difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
              >
                {DIFFICULTY_OPTIONS.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="border-gray-300 rounded shadow-sm text-amber-600 focus:border-amber-500 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Samples ({formData.samples.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleEditor(true)}
                className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Manage Samples
              </button>
            </div>

            {formData.samples.length === 0 ? (
              <p className="text-sm text-gray-500">No samples added yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {formData.samples.map((sample, index) => (
                  <li key={sample.id || index} className="py-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{sample.name}</span>
                      <span className="text-gray-500">
                        {sample.age}yr • {sample.proof}° • {sample.mashbill}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white rounded-md bg-amber-600 hover:bg-amber-700"
            >
              Save Quarter
            </button>
          </div>
        </form>
      </div>
    ) : (
      <div className="overflow-hidden bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Quarter Name
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Date Range
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Difficulty
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quarters.map(quarter => (
              <tr key={quarter.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {quarter.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {fromFirebaseTimestamp(quarter.startDate).toLocaleDateString()} - {fromFirebaseTimestamp(quarter.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${String(quarter.difficulty).toUpperCase() === DifficultyEnum.Beginner
                    ? 'bg-green-100 text-green-800'
                    : String(quarter.difficulty).toUpperCase() === DifficultyEnum.Intermediate
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {String(quarter.difficulty).charAt(0).toUpperCase() + String(quarter.difficulty).slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${quarter.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {quarter.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleQuarterSelect(quarter)}
                    className="text-amber-600 hover:text-amber-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {showSampleEditor && (
      <SampleEditor
        samples={formData.samples}
        onUpdate={handleSamplesUpdate}
        onClose={() => setShowSampleEditor(false)}
      />
    )}
  </div>
);
}

export default QuarterManagement;