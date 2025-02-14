import React from 'react';
import { ScoringResult } from '../../utils/scoring/scoring-types';
import { ScoringCalculator } from '../../utils/scoring/scoring-calculation.utils';

const calculator = new ScoringCalculator();
const MAX_POSSIBLE = calculator.getMaxPossibleScore();

interface ScoreDisplayProps {
    result: ScoringResult;
    showExplanations?: boolean;
    className?: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
    result,
    showExplanations = true,
    className = ''
}) => {
    const { totalScore, breakdown, explanations } = result;
    const config = calculator.getCurrentConfig();

    // Calculate max possible for each category
    const maxScores = {
        age: config.age.points + config.age.exactMatchBonus,
        proof: config.proof.points + config.proof.exactMatchBonus,
        mashbill: config.mashbill.points + config.mashbill.exactMatchBonus
    };

    return (
        <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
            {/* Total Score with Animation */}
            <div className="text-center mb-6">
                <div className="text-3xl font-bold text-amber-600 animate-scoreReveal">
                    {totalScore}
                    <span className="text-gray-500 text-xl ml-2">/ {MAX_POSSIBLE}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                    Total Points
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-4">
                {/* Age Score */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="font-medium">Age</span>
                        <span className="text-amber-600">
                            {breakdown.age} / {maxScores.age}
                        </span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-amber-500 transition-all duration-1000 ease-out"
                            style={{ width: `${(breakdown.age / maxScores.age) * 100}%` }}
                        />
                    </div>
                    {showExplanations && (
                        <p className="text-sm text-gray-600 mt-1">{explanations.age}</p>
                    )}
                </div>

                {/* Proof Score */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="font-medium">Proof</span>
                        <span className="text-amber-600">
                            {breakdown.proof} / {maxScores.proof}
                        </span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-amber-500 transition-all duration-1000 ease-out"
                            style={{ width: `${(breakdown.proof / maxScores.proof) * 100}%` }}
                        />
                    </div>
                    {showExplanations && (
                        <p className="text-sm text-gray-600 mt-1">{explanations.proof}</p>
                    )}
                </div>

                {/* Mashbill Score */}
                <div>
                    <div className="flex justify-between mb-1">
                        <span className="font-medium">Mashbill</span>
                        <span className="text-amber-600">
                            {breakdown.mashbill} / {maxScores.mashbill}
                        </span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-amber-500 transition-all duration-1000 ease-out"
                            style={{ width: `${(breakdown.mashbill / maxScores.mashbill) * 100}%` }}
                        />
                    </div>
                    {showExplanations && (
                        <p className="text-sm text-gray-600 mt-1">{explanations.mashbill}</p>
                    )}
                </div>
            </div>

            {/* Rank Display */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">
                        {getRank(totalScore, MAX_POSSIBLE)}
                    </div>
                    <div className="text-sm text-gray-500">
                        Your Current Rank
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to determine rank
function getRank(score: number, maxPossible: number): string {
    const percentage = (score / maxPossible) * 100;

    if (percentage >= 90) return '🎩 Whiskey Wizard';
    if (percentage >= 80) return '👑 Oak Overlord';
    if (percentage >= 60) return '⚔️ Cask Commander';
    if (percentage >= 40) return '🔍 Whiskey Explorer';
    if (percentage >= 20) return '🌱 Whiskey Rookie';
    return '🥃 Barrel Beginner';
}