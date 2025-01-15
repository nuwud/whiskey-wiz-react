import { useState } from 'react';
import { Challenge as ChallengeType } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

interface ChallengeProps {
  challenge: ChallengeType;
  onAnswer: (answer: string) => void;
  onUseHint: () => void;
}

export const Challenge = ({ challenge, onAnswer, onUseHint }: ChallengeProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const { hints, submitAnswer, useHint } = useGameStore();
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    submitAnswer(challenge.id, selectedAnswer);
    setSelectedAnswer('');
  };

  const handleHint = () => {
    if (hints > 0 && !showHint) {
      useHint(challenge.id);
      setShowHint(true);
      onUseHint();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Challenge Header */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-amber-600 uppercase">
            {challenge.type} Challenge
          </span>
          <span className="text-sm text-gray-500">
            {challenge.points} points
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{challenge.question}</h2>
      </div>

      {/* Whiskey Sample Info */}
      <div className="bg-amber-50 p-4 rounded-lg">
        <h3 className="font-medium text-amber-900 mb-2">Sample Information</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt className="text-sm text-amber-700">Name:</dt>
          <dd className="text-sm text-amber-900 font-medium">{challenge.sample.name}</dd>
          
          <dt className="text-sm text-amber-700">Age:</dt>
          <dd className="text-sm text-amber-900 font-medium">{challenge.sample.age} years</dd>
          
          <dt className="text-sm text-amber-700">Proof:</dt>
          <dd className="text-sm text-amber-900 font-medium">{challenge.sample.proof}°</dd>
          
          <dt className="text-sm text-amber-700">Distillery:</dt>
          <dd className="text-sm text-amber-900 font-medium">{challenge.sample.distillery}</dd>
        </dl>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {challenge.options.map((option) => (
          <button
            key={option}
            onClick={() => setSelectedAnswer(option)}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
              selectedAnswer === option
                ? 'border-amber-600 bg-amber-50'
                : 'border-gray-200 hover:border-amber-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Hint Section */}
      <div className="pt-4 border-t">
        {showHint ? (
          <div className="text-amber-800 bg-amber-50 p-3 rounded-lg">
            <span className="font-medium">Hint:</span> {challenge.hint}
          </div>
        ) : (
          <button
            onClick={handleHint}
            disabled={hints === 0}
            className={`text-sm ${
              hints > 0
                ? 'text-amber-600 hover:text-amber-700'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Use Hint ({hints} remaining)
          </button>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedAnswer}
        className={`w-full py-3 px-4 rounded-lg font-medium ${
          selectedAnswer
            ? 'bg-amber-600 text-white hover:bg-amber-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Submit Answer
      </button>
    </div>
  );
};