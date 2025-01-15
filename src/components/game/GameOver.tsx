import { useAuthStore } from '../../store/authStore';

interface GameOverProps {
  score: number;
  totalChallenges: number;
  onPlayAgain: () => void;
}

export const GameOver = ({ score, totalChallenges, onPlayAgain }: GameOverProps) => {
  const { user } = useAuthStore();
  const percentage = Math.round((score / (totalChallenges * 100)) * 100);
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <h2 className="text-3xl font-bold mb-6">Game Over!</h2>
      
      <div className="mb-8">
        <div className="text-5xl font-bold text-amber-600 mb-2">{score}</div>
        <div className="text-gray-600">Final Score ({percentage}%)</div>
      </div>

      {user?.isAnonymous && (
        <div className="mb-8 p-4 bg-amber-50 rounded-lg">
          <p className="text-amber-800">
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

      <div className="space-y-4">
        <button
          onClick={onPlayAgain}
          className="w-full px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Play Again
        </button>
        
        <a
          href="/"
          className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
};