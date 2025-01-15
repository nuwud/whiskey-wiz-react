import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import { Challenge as ChallengeComponent } from './Challenge';
import { ScoreBoard } from './ScoreBoard';
import { GameOver } from './GameOver';
import { Spinner } from '../ui/Spinner';

export const GameBoard = () => {
  const { user } = useAuthStore();
  const { 
    isPlaying, 
    currentChallengeIndex, 
    challenges, 
    score, 
    lives,
    hints,
    startGame, 
    resetGame 
  } = useGameStore();

  useEffect(() => {
    // Reset game when component unmounts
    return () => {
      resetGame();
    };
  }, [resetGame]);

  if (!challenges.length && isPlaying) {
    return <Spinner />;
  }

  const currentChallenge = challenges[currentChallengeIndex];
  const isGameOver = !lives || currentChallengeIndex >= challenges.length;

  return (
    <div className="max-w-4xl mx-auto">
      {!isPlaying ? (
        <div className="text-center space-y-6 p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to WhiskeyWiz!</h1>
          <p className="text-lg text-gray-600">
            Test your whiskey knowledge and compete with other enthusiasts
          </p>
          
          {user?.isAnonymous && (
            <div className="bg-amber-50 p-4 rounded-lg text-amber-800">
              Playing as guest. Sign up to save your progress and compete on the leaderboard!
            </div>
          )}
          
          <button
            onClick={() => startGame()}
            className="px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transform transition hover:scale-105"
          >
            Start Game
          </button>
        </div>
      ) : isGameOver ? (
        <GameOver
          score={score}
          totalChallenges={challenges.length}
          onPlayAgain={() => {
            resetGame();
            startGame();
          }}
        />
      ) : (
        <div className="space-y-6">
          <ScoreBoard 
            score={score}
            lives={lives}
            hints={hints}
            currentQuestion={currentChallengeIndex + 1}
            totalQuestions={challenges.length}
          />
          
          <ChallengeComponent 
            challenge={currentChallenge}
            onAnswer={answer => {/* implement submitAnswer */}}
            onUseHint={() => {/* implement useHint */}}
          />
        </div>
      )}
    </div>
  );
};