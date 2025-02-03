// src/components/game/sample-result.component.tsx
import React from 'react';
import { Star } from 'lucide-react';
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '../ui/accordion-ui.component';
import { WhiskeySample } from '../../types/game.types';

interface SampleResultProps {
    sampleId: string;
    sample: WhiskeySample;
    guess: {
        age: number;
        proof: number;
        mashbill: string;
        score?: number;
        rating: number;
        notes: string;
    };
}

// Scoring detail component
const ScoringDetail: React.FC<{
    label: string;
    guess: number | string;
    actual: number | string;
    points: number;
    maxPoints: number;
    explanation: string;
}> = ({ label, guess, actual, points, maxPoints, explanation }) => (
    <div className="py-2">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{label}</span>
            <span className="text-sm font-medium text-amber-600">{points} / {maxPoints} points</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
                <span className="text-xs text-gray-500">Your Guess</span>
                <div className="text-sm font-medium">{guess}</div>
            </div>
            <div>
                <span className="text-xs text-gray-500">Actual</span>
                <div className="text-sm font-medium">{actual}</div>
            </div>
        </div>
        <p className="text-xs text-gray-600">{explanation}</p>
    </div>
);

export const SampleResult: React.FC<SampleResultProps> = ({
    sampleId,
    sample,
    guess
}) => {
    // Calculate detailed scores
    const ageAccuracy = Math.max(0, 100 - (Math.abs(sample.age - guess.age) * 10));
    const proofAccuracy = Math.max(0, 100 - (Math.abs(sample.proof - guess.proof) * 2));
    const mashbillAccuracy = sample.mashbill === guess.mashbill ? 100 : 0;

    // Calculate explanations
    const getAgeExplanation = () => {
        const diff = Math.abs(sample.age - guess.age);
        if (diff === 0) return "Perfect guess! Full points awarded.";
        if (diff <= 2) return "Very close! Small deduction for minor difference.";
        return `Off by ${diff} years. Points deducted based on difference.`;
    };

    const getProofExplanation = () => {
        const diff = Math.abs(sample.proof - guess.proof);
        if (diff === 0) return "Perfect proof guess! Full points awarded.";
        if (diff <= 5) return "Very close! Small deduction for minor difference.";
        return `Off by ${diff} proof points. Points deducted proportionally.`;
    };

    const getMashbillExplanation = () => {
        return sample.mashbill === guess.mashbill
            ? "Correct mashbill type! Full points awarded."
            : "Incorrect mashbill type. No points awarded for this category.";
    };

    return (
        <AccordionItem value={`sample-${sampleId}`} className="bg-white rounded-lg shadow mb-4">
            <AccordionTrigger className="px-6 py-4 w-full">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">Sample {sampleId}</span>
                        <span className="text-sm text-gray-600">({sample.name})</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xl font-bold text-amber-600">{guess.score} points</div>
                    </div>
                </div>
            </AccordionTrigger>

            <AccordionContent className="px-6 pb-4">
                {/* Detailed Scoring Breakdown */}
                <div className="space-y-4">
                    <div className="border-b pb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Scoring Breakdown</h4>
                        <ScoringDetail
                            label="Age"
                            guess={`${guess.age} years`}
                            actual={`${sample.age} years`}
                            points={Math.round(ageAccuracy / 2)}
                            maxPoints={50}
                            explanation={getAgeExplanation()}
                        />
                        <ScoringDetail
                            label="Proof"
                            guess={`${guess.proof}°`}
                            actual={`${sample.proof}°`}
                            points={Math.round(proofAccuracy / 2)}
                            maxPoints={50}
                            explanation={getProofExplanation()}
                        />
                        <ScoringDetail
                            label="Mashbill"
                            guess={guess.mashbill}
                            actual={sample.mashbill}
                            points={Math.round(mashbillAccuracy / 2)}
                            maxPoints={50}
                            explanation={getMashbillExplanation()}
                        />
                    </div>

                    {/* Rating and Notes */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Your Rating</h4>
                        <div className="flex items-center gap-1 mb-2 flex-wrap">
                            {[...Array(10)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 shrink-0 ${i < guess.rating
                                            ? "text-amber-500 fill-amber-500"
                                            : "text-gray-300"
                                        }`}
                                />
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                                {guess.rating}/10
                            </span>
                        </div>
                    </div>

                    {/* Tasting Notes */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Your Notes</h4>
                        <p className="text-sm text-gray-600">{guess.notes || "No notes provided"}</p>
                    </div>

                    {/* Whiskey Details */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">About {sample.name}</h4>
                        <p className="text-sm text-gray-600">{sample.description}</p>
                        {sample.notes && sample.notes.length > 0 && (
                            <div className="mt-2">
                                <h5 className="text-sm font-medium text-gray-900 mb-1">Official Tasting Notes</h5>
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    {sample.notes.map((note, index) => (
                                        <li key={index}>{note}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};