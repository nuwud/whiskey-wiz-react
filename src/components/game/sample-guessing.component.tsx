import React, { useState } from 'react';
import { useGameStore } from '../../store/game.store';

const MASHBILL_TYPES = [
  'Bourbon',
  'Rye',
  'Wheat',
  'Corn',
  'Malted Barley',
  'Single Malt'
];

interface GuessFormData {
  age: number;
  proof: number;
  mashbill: string;
}

export const SampleGuessing = () => {
  const { currentSample, submitSampleGuess, navigateSample } = useGameStore();
  
  const [guessData, setGuessData] = useState<GuessFormData>({
    age: 0,
    proof: 0,
    mashbill: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSampleGuess(currentSample, guessData);
    navigateSample('next');
  };

  const handleInputChange = (field: keyof GuessFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let value: string | number = e.target.value;
    if (field === 'age' || field === 'proof') {
      value = Number(value) || 0;
    }
    setGuessData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Sample {currentSample}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Age Input */}
        <div>
          <label 
            htmlFor="age" 
            className="block text-sm font-medium text-gray-700"
          >
            Age (Years)
          </label>
          <input
            type="number"
            id="age"
            name="age"
            min="0"
            max="50"
            value={guessData.age}
            onChange={handleInputChange('age')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        {/* Proof Input */}
        <div>
          <label 
            htmlFor="proof" 
            className="block text-sm font-medium text-gray-700"
          >
            Proof
          </label>
          <input
            type="number"
            id="proof"
            name="proof"
            min="80"
            max="160"
            step="0.1"
            value={guessData.proof}
            onChange={handleInputChange('proof')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        {/* Mashbill Selection */}
        <div>
          <label 
            htmlFor="mashbill" 
            className="block text-sm font-medium text-gray-700"
          >
            Mashbill Type
          </label>
          <select
            id="mashbill"
            name="mashbill"
            value={guessData.mashbill}
            onChange={handleInputChange('mashbill')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="">Select Mashbill</option>
            {MASHBILL_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => navigateSample('previous')}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous Sample
          </button>

          <button
            type="submit"
            disabled={!guessData.age || !guessData.proof || !guessData.mashbill}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit & Next
          </button>
        </div>
      </form>
    </div>
  );
};