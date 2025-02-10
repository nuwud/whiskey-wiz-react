// src/components/game/sample-result.component.tsx
import React from 'react';
import { Star } from 'lucide-react';
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '../ui/accordion-ui.component';
import { WhiskeySample } from '../../types/game.types';
import { getAgeExplanation, getProofExplanation, getMashbillExplanation } from '../../utils/scoring.utils';

interface SampleResultProps {
    sampleId: string;
    sample: WhiskeySample;
    guess: {
        age: number;
        proof: number;
        mashbill: string;
        score?: number;
        breakdown?: {
            age: number;
            proof: number;
            mashbill: number;
        };
        explanations?: {
            age: string;
            proof: string;
            mashbill: string;
        };
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
            <span className="text-sm font-medium text-amber-600">
                {points} / {maxPoints} points
            </span>
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

    return (
        <AccordionItem value={`sample-${sampleId}`} className="bg-white rounded-lg shadow mb-4">
            <AccordionTrigger className="px-6 py-4 w-full">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">Sample {sampleId}</span>
                        <span className="text-sm text-gray-600">({sample.name})</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xl font-bold text-amber-600">{guess.score ?? 0} points</div>
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
                            points={guess.breakdown?.age ?? 0}
                            maxPoints={50}
                            explanation={guess.explanations?.age ?? getAgeExplanation(sample.age, guess.age)}
                            />
                            <ScoringDetail
                            label="Proof"
                            guess={`${guess.proof}°`}
                            actual={`${sample.proof}°`}
                            points={guess.breakdown?.proof ?? 0}
                            maxPoints={50}
                            explanation={guess.explanations?.proof ?? getProofExplanation(sample.proof, guess.proof)}
                            />
                            <ScoringDetail
                            label="Mashbill"
                            guess={guess.mashbill}
                            actual={sample.mashbill}
                            points={guess.breakdown?.mashbill ?? 0}
                            maxPoints={50}
                            explanation={guess.explanations?.mashbill ?? getMashbillExplanation(sample.mashbill, guess.mashbill)}
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

export default SampleResult;