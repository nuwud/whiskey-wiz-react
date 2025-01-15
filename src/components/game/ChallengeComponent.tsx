import React from 'react';
import { Challenge } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

interface ChallengeComponentProps {
  challenge: Challenge;
}

export const ChallengeComponent: React.FC<ChallengeComponentProps> = ({ challenge }) => {
  const { submitAnswer, useHint } = useGameStore();
  const [showHint, setShowHint] = React.useState(false);

  const handleAnswerSelect = (answer: string) => {
    submitAnswer(challenge.id, answer);
  };

  const handleUseHint = () => {
    useHint(challenge.id);
    setShowHint(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Challenge</h2>
        <p className="text-gray-700">{challenge.question}</p>
      </div>

      {challenge.sample && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-semibold mb-2">Whiskey Sample</h3>
          <p>Age: {challenge.sample.age} years</p>
          <p>Proof: {challenge.sample.proof}°</p>
          <p>Type: {challenge.sample.mashbillType}</p>
        </div>
      )}

      <div className="space-y-3">
        {challenge.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(option)}
            className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          >
            {option}
          </button>
        ))}
      </div>

      {challenge.hint && !showHint && (
        <button
          onClick={handleUseHint}
          className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
        >
          Use Hint
        </button>
      )}

      {showHint && challenge.hint && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
          <p className="text-sm">{challenge.hint}</p>
        </div>
      )}
    </div>
  );
};