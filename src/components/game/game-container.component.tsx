import React, { useState, useEffect, useMemo } from 'react';
import { quarterService } from '../../services/quarterService';
import { Quarter, Sample } from '../../models/quarter.model';
import { useAuth } from '../../contexts/AuthContext';

// Comprehensive scoring interface
interface ScoringRules {
  age: {
    maxPoints: number;
    pointDeductionPerYear: number;
    exactMatchBonus: number;
  };
  proof: {
    maxPoints: number;
    pointDeductionPerProof: number;
    exactMatchBonus: number;
  };
  mashbill: {
    correctGuessPoints: number;
  };
}

// Game state with detailed tracking
interface GameState {
  currentSample: 'A' | 'B' | 'C' | 'D';
  samples: Sample[];
  guesses: {
    [key in 'A' | 'B' | 'C' | 'D']: {
      age: number;
      proof: number;
      mashbill: string;
      score?: number;
    }
  };
  totalScore: number;
  isComplete: boolean;
}

// Scoring calculation utility
const calculateScore = (
  sample: Sample, 
  guess: {age: number, proof: number, mashbill: string}, 
  rules: ScoringRules
) => {
  let score = 0;

  // Age scoring
  const ageDeviation = Math.abs(sample.age - guess.age);
  if (ageDeviation === 0) {
    score += rules.age.maxPoints + rules.age.exactMatchBonus;
  } else {
    score += Math.max(
      rules.age.maxPoints - (ageDeviation * rules.age.pointDeductionPerYear),
      0
    );
  }

  // Proof scoring
  const proofDeviation = Math.abs(sample.proof - guess.proof);
  if (proofDeviation === 0) {
    score += rules.proof.maxPoints + rules.proof.exactMatchBonus;
  } else {
    score += Math.max(
      rules.proof.maxPoints - (proofDeviation * rules.proof.pointDeductionPerProof),
      0
    );
  }

  // Mashbill scoring
  if (sample.mashbill === guess.mashbill) {
    score += rules.mashbill.correctGuessPoints;
  }

  return score;
};

const GameContainer: React.FC = () => {
  const { currentUser } = useAuth();
  const [quarter, setQuarter] = useState<Quarter | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRules | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentSample: 'A',
    samples: [],
    guesses: {
      A: { age: 0, proof: 0, mashbill: '' },
      B: { age: 0, proof: 0, mashbill: '' },
      C: { age: 0, proof: 0, mashbill: '' },
      D: { age: 0, proof: 0, mashbill: '' }
    },
    totalScore: 0,
    isComplete: false
  });

  // Fetch quarter and scoring rules on component mount
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const activeQuarters = await quarterService.getActiveQuarters();
        const currentQuarter = activeQuarters[0]; // Get most recent active quarter
        
        // Fetch scoring configuration
        const config = await quarterService.getGameConfiguration();
        
        setQuarter(currentQuarter);
        setScoringRules(config.scoringRules);
      } catch (error) {
        console.error('Failed to fetch game data', error);
      }
    };

    fetchGameData();
  }, []);

  // Update guess for current sample
  const updateGuess = (field: keyof typeof gameState.guesses[keyof typeof gameState.guesses]) => 
    (value: number | string) => {
      setGameState(prev => ({
        ...prev,
        guesses: {
          ...prev.guesses,
          [prev.currentSample]: {
            ...prev.guesses[prev.currentSample],
            [field]: value
          }
        }
      }));
    };

  // Navigate between samples
  const navigateSample = (direction: 'next' | 'previous') => {
    const sampleOrder: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const currentIndex = sampleOrder.indexOf(gameState.currentSample);
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    // Boundary checks
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= sampleOrder.length) {
      // Complete game
      setGameState(prev => ({
        ...prev,
        isComplete: true
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      currentSample: sampleOrder[newIndex]
    }));
  };

  // Submit game results
  const submitGame = async () => {
    if (!scoringRules || !quarter) return;

    const finalScores = Object.entries(gameState.guesses).map(([sample, guess]) => ({
      sample,
      score: calculateScore(
        quarter.samples.find(s => s.id === sample)!, 
        guess, 
        scoringRules
      )
    }));

    const totalScore = finalScores.reduce((sum, scoreObj) => sum + scoreObj.score, 0);

    // TODO: Implement score submission to Firebase
    // await scoreService.submitScore({
    //   playerId: currentUser?.uid,
    //   quarterId: quarter.id,
    //   totalScore,
    //   guesses: gameState.guesses
    // });
  };

  // Render game interface
  return (
    <div className="game-container">
      {/* Implement game UI based on current state */}
    </div>
  );
};

export default GameContainer;