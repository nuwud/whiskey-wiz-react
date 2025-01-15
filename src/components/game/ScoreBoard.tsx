interface ScoreBoardProps {
  score: number;
  lives: number;
  hints: number;
  currentQuestion: number;
  totalQuestions: number;
}

export const ScoreBoard = ({ 
  score, 
  lives, 
  hints,
  currentQuestion,
  totalQuestions
}: ScoreBoardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Score</div>
          <div className="text-2xl font-bold text-amber-600">{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-500">Lives</div>
          <div className="text-2xl font-bold flex justify-center space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < lives ? 'text-red-500' : 'text-gray-300'}>
                ♥
              </span>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-500">Hints</div>
          <div className="text-2xl font-bold flex justify-center space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < hints ? 'text-amber-500' : 'text-gray-300'}>
                💡
              </span>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-500">Progress</div>
          <div className="text-lg font-bold text-gray-700">
            {currentQuestion} / {totalQuestions}
          </div>
        </div>
      </div>
    </div>
  );
};