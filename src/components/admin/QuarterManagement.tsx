import React, { useState, useEffect } from 'react';
import { Quarter, WhiskeySample, Difficulty } from '../../types/game';
import { quarterService } from '../../services/quarterService';
import { SampleEditor } from './SampleEditor';

const DIFFICULTY_OPTIONS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

interface QuarterFormData {
  name: string;
  startDate: string;
  endDate: string;
  difficulty: Difficulty;
  isActive: boolean;
  samples: WhiskeySample[];
}

export const QuarterManagement = () => {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSampleEditor, setShowSampleEditor] = useState(false);

  const [formData, setFormData] = useState<QuarterFormData>({
    name: '',
    startDate: '',
    endDate: '',
    difficulty: 'beginner',
    isActive: true,
    samples: []
  });

  useEffect(() => {
    loadQuarters();
  }, []);

  const loadQuarters = async () => {
    try {
      setIsLoading(true);
      const fetchedQuarters = await quarterService.getAllQuarters();
      setQuarters(fetchedQuarters);
    } catch (err) {
      setError('Failed to load quarters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuarterSelect = (quarter: Quarter) => {
    setSelectedQuarter(quarter);
    setFormData({
      name: quarter.name,
      startDate: quarter.startDate.toISOString().split('T')[0],
      endDate: quarter.endDate.toISOString().split('T')[0],
      difficulty: quarter.difficulty,
      isActive: quarter.isActive,
      samples: quarter.samples
    });
    setIsEditing(true);
  };

  const handleNewQuarter = () => {
    setSelectedQuarter(null);
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      difficulty: 'beginner',
      isActive: true,
      samples: []
    });
    setIsEditing(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSamplesUpdate = (updatedSamples: WhiskeySample[]) => {
    setFormData(prev => ({
      ...prev,
      samples: updatedSamples
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedQuarter) {
        await quarterService.updateQuarter(selectedQuarter.id, {
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate)
        });
      } else {
        await quarterService.createQuarter({
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate)
        });
      }
      await loadQuarters();
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save quarter');
    }
  };

  if (isLoading) {
    return <div className="animate-spin h-8 w-8 border-t-2 border-amber-600 rounded-full mx-auto"></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {isEditing ? (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quarter Name
              </label>
              <input
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
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      quarter.difficulty === 'beginner'
                        ? 'bg-green-100 text-green-800'
                        : quarter.difficulty === 'intermediate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {quarter.difficulty.charAt(0).toUpperCase() + quarter.difficulty.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      quarter.isActive
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
};