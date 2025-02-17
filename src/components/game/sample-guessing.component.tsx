import React, { useState, useEffect } from 'react';
import { useGameProgression } from '../../store/game-progression.store';
import { Flame } from 'lucide-react';
import { SampleKey, SampleGuess, SampleId } from '../../types/game.types';

const SAMPLE_IDS: SampleId[] = ['A', 'B', 'C', 'D'];

const MASHBILL_TYPES = [
  'Bourbon',
  'Rye',
  'Wheat',
  'Single Malt',
  'Specialty'
];

const defaultGuess: SampleGuess = {
  age: 0,
  proof: 0,
  mashbill: '',
  rating: 0,
  notes: '',
  score: 0,
  submitted: false
} as const;

export const createGuess = (partial?: Partial<SampleGuess>): SampleGuess => ({
  ...defaultGuess,
  ...partial
});

export const createInitialGuesses = (): Record<SampleKey, SampleGuess> => 
  Object.fromEntries(
    SAMPLE_IDS.map(id => [id, createGuess()])
  ) as Record<SampleKey, SampleGuess>;

interface GuessFormData {
  age: number;
  proof: number;
  mashbill: string;
  rating: number;
  notes: string;
}

interface SampleGuessingProps {
  currentSample: SampleId;
  guess: SampleGuess;
  onSubmitGuess: (sampleId: SampleId, guess: SampleGuess) => void;
  onNextSample: () => void;
  onPreviousSample: () => void;
  isLastSample: boolean;
  onGameComplete: () => void;  // Add this prop
}

export const SampleGuessing: React.FC<SampleGuessingProps> = ({
  currentSample,
  guess,
  onSubmitGuess,
  onNextSample,
  onPreviousSample,
  isLastSample,
  onGameComplete
}) => {
  const { submitGuess, samples } = useGameProgression(); // Ensure samples is defined
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [guessData, setGuessData] = useState<GuessFormData>({
    age: 0,
    proof: 0,
    mashbill: '',
    rating: 0,
    notes: ''
  });

  useEffect(() => {
    if (guess) {
      setGuessData({
        age: guess.age,
        proof: guess.proof,
        mashbill: guess.mashbill,
        rating: guess.rating,
        notes: guess.notes
      });
      setRating(guess.rating);
      setNotes(guess.notes);
    } else {
      setGuessData({
        age: 0,
        proof: 0,
        mashbill: '',
        rating: 0,
        notes: ''
      });
      setRating(0);
      setNotes('');
    }
  }, [currentSample, guess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!samples || Object.keys(samples).length === 0) {
      alert('Samples are not available. Please wait for initialization.');
      return;
    }

    // Validate required fields
    if (!guessData.age || !guessData.proof || !guessData.mashbill) {
      alert('Please fill in age, proof, and mashbill before continuing');
      return;
    }
    
    const completeGuess: SampleGuess = {
      ...guessData,
      rating,  // optional
      notes,   // optional
      score: 0,
      submitted: true
    };
    
    console.log('Submitting guess for sample:', currentSample);
    await submitGuess(currentSample, completeGuess);
    onSubmitGuess(currentSample, completeGuess);
    
    if (isLastSample) {
      console.log('Last sample submitted, calling onGameComplete');
      await onGameComplete();
    } else {
      console.log('Moving to next sample');
      onNextSample();
    }
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
      {/* Sample Selection */}
      <div className="flex justify-between mb-8">
        {SAMPLE_IDS.map((sample) => (
          <div
            key={sample}
            className={`w-24 h-16 flex items-center justify-center border ${
              currentSample === sample ? 'border-amber-500' : 'border-gray-200'
            } rounded`}
          >
            Sample {sample}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-center mb-8">
        <p className="text-lg">
          Take your first sip of Sample {currentSample} and see how good your whiskey taste buds are...
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Age Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What do you think the age statement is?
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20">
              <input
                aria-label="Age"
                type="number"
                value={guessData.age}
                onChange={handleInputChange('age')}
                className="w-full p-2 border rounded"
                min="0"
                max="50"
              />
            </div>
            <div className="flex-1">
              <input
                aria-label="Age"
                type="range"
                min="0"
                max="50"
                value={guessData.age}
                onChange={handleInputChange('age')}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Proof Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What do you think the proof is?
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20">
              <input
                aria-label="Proof"
                type="number"
                value={guessData.proof}
                onChange={handleInputChange('proof')}
                className="w-full p-2 border rounded"
                min="80"
                max="160"
              />
            </div>
            <div className="flex-1">
              <input
                aria-label="Proof"
                type="range"
                min="80"
                max="160"
                value={guessData.proof}
                onChange={handleInputChange('proof')}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Mashbill Radio Buttons */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What do you think the mashbill is?
          </label>
          <div className="grid grid-cols-3 gap-4">
            {MASHBILL_TYPES.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="mashbill"
                  value={type}
                  checked={guessData.mashbill === type}
                  onChange={handleInputChange('mashbill')}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Star Rating System */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How do you rate this whiskey?
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`
                      w-8 h-8 
                      flex items-center justify-center 
                      rounded-lg
                      transition-all duration-200
                      ${
                        rating >= value
                          ? 'text-amber-500 hover:text-amber-600 rating-icon rating-icon-selected'
                          : 'text-gray-300 hover:text-gray-400 rating-icon'
                      }
                      focus:outline-none 
                      focus:ring-2 
                      focus:ring-offset-2 
                      focus:ring-amber-500
                    `}
                    aria-label={`Rate ${value} out of 10`}
                  >
                    <Flame
                      size={20}
                      className={`transform transition-transform ${
                        rating >= value ? 'scale-110' : 'scale-100'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600">
                {rating ? `${rating}/10` : 'Not rated'}
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 
                    border border-gray-300 rounded-md hover:bg-gray-50
                    transition-colors duration-200"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 text-sm text-gray-500">
              {rating > 0 && (
                <span className="text-amber-600 font-medium">
                  {rating <= 3
                    ? 'Not my favorite'
                    : rating <= 5
                    ? 'Decent'
                    : rating <= 7
                    ? 'Pretty good'
                    : rating <= 9
                    ? 'Excellent'
                    : 'Exceptional!'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notes Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tasting Notes
          </label>
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                min-h-[120px] resize-y
                placeholder-gray-400
                transition-all duration-200"
              placeholder="Describe what you taste... (vanilla, caramel, spice, etc.)"
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {notes.length}/500
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Add any flavor notes, aromas, or personal observations
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onPreviousSample}
            disabled={!guessData.age || !guessData.proof || !guessData.mashbill}
            className="px-4 py-2 ${!guessData.age || !guessData.proof || !guessData.mashbill ? 'opacity-50 cursor-not-allowed' : ''} border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous Sample
          </button>
          <button
            type="submit"  
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
          >
            {isLastSample ? 'Submit' : 'Next Sample'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SampleGuessing;