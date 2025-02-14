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
        <div className={`score-display ${className}`}>
            {/* Total Score with Animation */}
            <div className="total-score">
                <div className="score-value">
                    {totalScore}
                    <span className="max-score">/ {MAX_POSSIBLE}</span>
                </div>
                <div className="points-label">
                    Total Points
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="score-breakdown">
                {/* Age Score */}
                <div className="category">
                    <div className="category-label">
                        <span>Age</span>
                        <span className="category-score">
                            {breakdown.age} / {maxScores.age}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress"
                            style={{ width: `${(breakdown.age / maxScores.age) * 100}%` }}
                        />
                    </div>
                    {showExplanations && (
                        <p className="explanation">{explanations.age}</p>
                    )}
                </div>

                {/* Proof Score */}
                <div className="category">
                    <div className="category-label">
                        <span>Proof</span>
                        <span className="category-score">
                            {breakdown.proof} / {maxScores.proof}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress"
                            style={{ width: `${(breakdown.proof / maxScores.proof) * 100}%` }}
                        />
                    </div>
                    {showExplanations && (
                        <p className="explanation">{explanations.proof}</p>
                    )}
                </div>

                {/* Mashbill Score */}
                <div className="category">
                    <div className="category-label">
                        <span>Mashbill</span>
                        <span className="category-score">
                            {breakdown.mashbill} / {maxScores.mashbill}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress"
                            style={{ width: `${(breakdown.mashbill / maxScores.mashbill) * 100}%` }}
                        />
                    </div>
                    {showExplanations && (
                        <p className="explanation">{explanations.mashbill}</p>
                    )}
                </div>
            </div>

            {/* Rank Display */}
            <div className="rank-display">
                <div className="rank">
                    {getRank(totalScore, MAX_POSSIBLE)}
                </div>
                <div className="rank-label">
                    Your Current Rank
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