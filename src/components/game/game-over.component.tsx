import { useGameStore } from '../../store/game.store';
import { useAuthStore } from '../../store/auth.store';

interface GameOverProps {
  onPlayAgain: () => void;
}

export const GameOver = ({ onPlayAgain }: GameOverProps) => {
  const { user } = useAuthStore();
  const { score, guesses, samples, challenges, answers, hints, lives } = useGameStore();
  const totalChallenges = challenges.length;
  const calculateSampleAccuracy = () => {
    if (!samples.length) return 0;
    let totalAccuracy = 0;

    Object.entries(guesses).forEach(([id, guess]) => {
      const sample = samples.find(s => s.id === id);
      if (!sample || !guess.score) return;

      // Each sample can score up to 140 points (50 + 20 bonus for age and proof, 50 for mashbill)
      const accuracyPercentage = (guess.score / 140) * 100;
      totalAccuracy += accuracyPercentage;
    });

    return totalAccuracy / samples.length;
  };

  const sampleAccuracy = calculateSampleAccuracy();
  const challengeAccuracy = Object.values(answers).filter(answer => answer === 'correct').length / totalChallenges * 100;
  const hintsUsed = 3 - hints;
  const livesRemaining = lives;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Game Over!</h2>

      {/* Final Score */}
      <div className="text-center mb-8">
        <div className="text-5xl font-bold text-amber-600 mb-2">{score}</div>
        <div className="text-gray-600">Final Score</div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-800">
            {sampleAccuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Sample Accuracy</div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-800">
            {challengeAccuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Challenge Accuracy</div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-800">
            {hintsUsed}
          </div>
          <div className="text-sm text-gray-600">Hints Used</div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-800">
            {livesRemaining}
          </div>
          <div className="text-sm text-gray-600">Lives Remaining</div>
        </div>
      </div>

      {/* Guest Sign Up Prompt */}
      {user?.isAnonymous && (
        <div className="mb-8 p-4 bg-amber-50 rounded-lg">
          <p className="text-amber-800 text-center">
            Sign up to save your score and compete on the leaderboard!
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <a
              href="/register"
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
            >
              Sign Up
            </a>
            <a
              href="/login"
              className="px-4 py-2 border border-amber-600 text-amber-600 rounded-md hover:bg-amber-50"
            >
              Sign In
            </a>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={onPlayAgain}
          className="w-full px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Play Again
        </button>

        <a
          href="/"
          className="block w-full px-6 py-3 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
};