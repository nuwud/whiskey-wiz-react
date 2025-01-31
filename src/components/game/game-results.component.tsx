import { useGameStore } from '../../store/game.store';
import { WhiskeySample} from '../../types/game.types';

const GuessComparison = ({
  label,
  guess,
  actual,
  unit = '',
  exactPoints = 50,
  bonusPoints = 20,
  deduction = 5
}: {
  label: string;
  guess: number | string;
  actual: number | string;
  unit?: string;
  exactPoints?: number;
  bonusPoints?: number;
  deduction?: number;
}) => {
  const isExact = guess === actual;
  const difference = typeof guess === 'number' && typeof actual === 'number'
    ? Math.abs(guess - actual)
    : null;

  const points = isExact
    ? exactPoints + bonusPoints
    : difference !== null
      ? Math.max(exactPoints - (difference * deduction), 0)
      : 0;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <span className="text-gray-600">{label}</span>
      </div>
      <div className="flex-1 text-center">
        <span className={isExact ? "text-green-600 font-bold" : "text-gray-900"}>
          {guess}{unit}
        </span>
      </div>
      <div className="flex-1 text-center">
        <span className="text-gray-900">
          {actual}{unit}
        </span>
      </div>
      <div className="flex-1 text-right">
        <span className={isExact ? "text-green-600 font-bold" : "text-amber-600"}>
          +{points}
        </span>
      </div>
    </div>
  );
};

const SampleResult = ({
  sampleId,
  sample,
  guess
}: {
  sampleId: string;
  sample: WhiskeySample;
  guess: {
    age: number;
    proof: number;
    mashbill: string;
    score?: number;
  };
}) => {
  return (
    <div className="p-6 mb-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Sample {sampleId}</h3>
        <div className="text-xl font-bold text-amber-600">
          {guess.score} points
        </div>
      </div>

      <div className="grid grid-cols-4 mb-4 text-sm font-medium text-gray-500">
        <div>Attribute</div>
        <div className="text-center">Your Guess</div>
        <div className="text-center">Actual</div>
        <div className="text-right">Points</div>
      </div>

      <GuessComparison
        label="Age"
        guess={guess.age}
        actual={sample.age}
        unit=" years"
        exactPoints={50}
        bonusPoints={20}
        deduction={5}
      />

      <GuessComparison
        label="Proof"
        guess={guess.proof}
        actual={sample.proof}
        unit="°"
        exactPoints={50}
        bonusPoints={20}
        deduction={2}
      />

      <GuessComparison
        label="Mashbill"
        guess={guess.mashbill}
        actual={sample.mashbill}
        exactPoints={50}
        bonusPoints={0}
        deduction={50}
      />

      <div className="pt-4 mt-4 border-t">
        <h4 className="mb-2 font-medium text-gray-900">{sample.name}</h4>
        <p className="text-sm text-gray-600">{sample.description}</p>
      </div>
    </div>
  );
};

export const GameResults = () => {
  const { samples, guesses, totalScore } = useGameStore();

  // Calculate final score from totalScore object
  const finalScore = Object.values(totalScore).reduce((sum, score) => sum + score, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Results Analysis</h2>
        <p className="text-xl text-gray-600">Total Score: {finalScore}</p>
      </div>

      <div className="space-y-6">
        {Object.entries(guesses).map(([sampleId, guess]) => {
          const sample = samples.find(s => s.id === sampleId);
          if (!sample) return null;
          
          return (
            <SampleResult
              key={sampleId}
              sampleId={sampleId}
              sample={sample}
              guess={guess}
            />
          );
        })}
      </div>
    </div>
  );
};
