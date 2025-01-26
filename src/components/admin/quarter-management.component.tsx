import React, { useState, useEffect } from 'react';
import { useAuth, useQuarter } from '@/contexts';
import { quarterService } from '@/services/quarter.service';
import type { Quarter, WhiskeySample } from '@/types/game.types';
import { SampleEditor } from './sample-editor.component';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTY_OPTIONS: Difficulty[] = ['easy', 'medium', 'hard'];

interface QuarterFormData {
  name: string;
  startDate: string;
  endDate: string;
  difficulty: Difficulty;
  isActive: boolean;
  samples: WhiskeySample[];
  description: string;
  scoringRules: {
    age: {
      maxPoints: number;
      pointDeductionPerYear: number;
      exactMatchBonus: number;
    };
    proof: {
      maxPoints: number;
      pointDeductionPerProof: number;
      exactMatchBonus: number;
    };
    mashbill: {
      maxPoints: number;
      pointDeductionPerYear: number;
      exactMatchBonus: number;
    };
  };
}

export const QuarterManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSampleEditor, setShowSampleEditor] = useState(false);
  const { user } = useAuth();
  const { currentQuarter } = useQuarter();
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [formData, setFormData] = useState<QuarterFormData>({
    name: '',
    startDate: '',
    endDate: '',
    difficulty: 'easy',
    isActive: true,
    samples: [],
    description: '',
    scoringRules: {
      age: {
        maxPoints: 0,
        pointDeductionPerYear: 0,
        exactMatchBonus: 0
      },
      proof: {
        maxPoints: 0,
        pointDeductionPerProof: 0,
        exactMatchBonus: 0
      },
      mashbill: {
        maxPoints: 0,
        pointDeductionPerYear: 0,
        exactMatchBonus: 0
      }
    }
  });

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


  const handleQuarterSelect = (quarter: Quarter) => {
    setSelectedQuarter(quarter);
    setFormData({
      name: quarter.name,
      startDate: quarter.startDate.toISOString().split('T')[0],
      endDate: quarter.endDate.toISOString().split('T')[0],
      difficulty: quarter.difficulty || 'easy',
      isActive: quarter.isActive,
      samples: quarter.samples,
      description: quarter.description || '',
      scoringRules: {
        age: {
          maxPoints: quarter.scoringRules?.age?.maxPoints || 0,
          pointDeductionPerYear: quarter.scoringRules?.age?.pointDeductionPerYear || 0,
          exactMatchBonus: quarter.scoringRules?.age?.exactMatchBonus || 0
        },
        proof: {
          maxPoints: quarter.scoringRules?.proof?.maxPoints || 0,
          pointDeductionPerProof: quarter.scoringRules?.proof?.pointDeductionPerProof || 0,
          exactMatchBonus: quarter.scoringRules?.proof?.exactMatchBonus || 0
        },
        mashbill: {
          maxPoints: quarter.scoringRules?.mashbill?.maxPoints || 0,
          pointDeductionPerYear: quarter.scoringRules?.mashbill?.pointDeductionPerYear || 0,
          exactMatchBonus: quarter.scoringRules?.mashbill?.exactMatchBonus || 0
        }
      }
    });
    setIsEditing(true);
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    e.preventDefault();
    try {
      const quarterData: Omit<Quarter, 'id'> = {
        name: formData.name,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        difficulty: formData.difficulty,
        isActive: formData.isActive,
        description: formData.description,
        samples: formData.samples,
        scoringRules: formData.scoringRules
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
      setError('Failed to save quarter');
    }
  };

  if (loading) {
    return <div className="animate-spin h-8 w-8 border-t-2 border-amber-600 rounded-full mx-auto"></div>;
  }

  if (!user) {
    return <div className="p-4">You must be logged in to access this page.</div>;
  }

  const handleNewQuarter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedQuarter(null);
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      difficulty: 'easy',
      isActive: true,
      samples: [],
      description: '',
      scoringRules: {
        age: {
          maxPoints: 0,
          pointDeductionPerYear: 0,
          exactMatchBonus: 0
        },
        proof: {
          maxPoints: 0,
          pointDeductionPerProof: 0,
          exactMatchBonus: 0
        },
        mashbill: {
          maxPoints: 0,
          pointDeductionPerYear: 0,
          exactMatchBonus: 0
        }
      }
    });
    setIsEditing(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const quarterData: Omit<Quarter, 'id'> = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        createdAt: new Date(),
        updatedAt: new Date()
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
      samples: samples
    }));
    setShowSampleEditor(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quarter Management</h2>
        <button
          onClick={handleNewQuarter}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
        >
          Create New Quarter
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      {currentQuarter && !isEditing && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-medium">Current Active Quarter</h3>
          <p>{currentQuarter.name}</p>
          <p className="text-sm text-gray-600">
            {currentQuarter.startDate} - {currentQuarter.endDate}
          </p>
        </div>
      )}

      {isEditing ? (
        <div className="bg-white rounded-lg shadow p-6">
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Difficulty
                </label>
                <select
                  title="Difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
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
                      className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Samples ({formData.samples.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSampleEditor(true)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Manage Samples
                </button>
              </div>

              {formData.samples.length === 0 ? (
                <p className="text-gray-500 text-sm">No samples added yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {formData.samples.map((sample, index) => (
                    <li key={sample.id || index} className="py-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{sample.name}</span>
                        <span className="text-gray-500">
                          {sample.age}yr • {sample.proof}° • {sample.mashbillType}
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
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
              >
                Save Quarter
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quarter Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    {quarter.startDate.toLocaleDateString()} - {quarter.endDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${quarter.difficulty === 'easy'
                      ? 'bg-green-100 text-green-800'
                      : quarter.difficulty === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {quarter.difficulty.charAt(0).toUpperCase() + quarter.difficulty.slice(1)}
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