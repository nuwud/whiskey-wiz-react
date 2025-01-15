import React, { useState, useEffect } from 'react';
import { Quarter, Sample } from '../../models/Quarter';
import { ScoreSubmission } from '../../services/scoreService';
import { useAuth } from '../../contexts/AuthContext';

interface ResultsViewProps {
  quarter: Quarter;
  gameResults: ScoreSubmission;
}

const ResultsView: React.FC<ResultsViewProps> = ({ quarter, gameResults }) => {
  const { currentUser } = useAuth();
  const [shareText, setShareText] = useState('');
  const [shareImage, setShareImage] = useState<string | null>(null);

  // Detailed result calculation similar to Angular implementation
  const calculateDetailedResults = () => {
    return Object.entries(gameResults.guesses).map(([sampleKey, guess]) => ({
      sample: quarter.samples.find(s => s.id === sampleKey)!,
      guess,
      accuracy: {
        age: Math.abs(guess.age - quarter.samples.find(s => s.id === sampleKey)!.age),
        proof: Math.abs(guess.proof - quarter.samples.find(s => s.id === sampleKey)!.proof),
        mashbill: guess.mashbill === quarter.samples.find(s => s.id === sampleKey)!.mashbill
      }
    }));
  };

  // Generate shareable content (Wordle-style)
  const generateShareContent = () => {
    const results = calculateDetailedResults();
    const blocks = results.map(result => {
      if (result.accuracy.age === 0 && result.accuracy.proof === 0 && result.accuracy.mashbill) {
        return '🟩'; // Perfect guess
      } else if (result.accuracy.mashbill) {
        return '🟨'; // Partial correct
      } else {
        return '🟥'; // Incorrect
      }
    });

    const shareText = `Whiskey Wiz Challenge 🥃
${blocks.join('')}
Total Score: ${gameResults.totalScore}/70
#WhiskeyWiz`;

    setShareText(shareText);
  };

  // Share functionality
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      alert('Results copied to clipboard!');
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  useEffect(() => {
    generateShareContent();
  }, [gameResults]);

  return (
    <div className="results-container">
      <h1>Whiskey Wiz Results</h1>
      <div className="score-summary">
        <h2>Total Score: {gameResults.totalScore}/70</h2>
        {gameResults.totalScore === 70 && <p>🏆 Whiskey God Status Achieved! 🏆</p>}
      </div>

      <div className="detailed-results">
        {calculateDetailedResults().map((result, index) => (
          <div key={`sample-${index}`} className="sample-result">
            <h3>Sample {['A', 'B', 'C', 'D'][index]}</h3>
            <div className="result-details">
              <p>Actual Age: {result.sample.age}</p>
              <p>Your Guess: {result.guess.age}</p>
              <p>Actual Proof: {result.sample.proof}</p>
              <p>Your Guess: {result.guess.proof}</p>
              <p>Mashbill: {result.sample.mashbill}</p>
              <p>Your Guess: {result.guess.mashbill}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="share-section">
        <button onClick={handleShare}>Share Results</button>
        <textarea readOnly value={shareText} />
      </div>
    </div>
  );
};

export default ResultsView;