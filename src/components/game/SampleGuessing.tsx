"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface GuessData {
  age: number;
  proof: number;
  mashbill: string;
}

interface SampleGuessingProps {
  currentSample: string;
  onSubmitGuess: (guess: GuessData) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
  isFirstSample: boolean;
  isLastSample: boolean;
  progress: number;
}

const MASHBILL_OPTIONS = [
  { value: 'bourbon', label: 'Bourbon' },
  { value: 'rye', label: 'Rye' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'single-malt', label: 'Single Malt' },
  { value: 'corn', label: 'Corn' },
];

export function SampleGuessing({
  currentSample,
  onSubmitGuess,
  onNavigate,
  isFirstSample,
  isLastSample,
  progress,
}: SampleGuessingProps) {
  const [guess, setGuess] = useState<GuessData>({
    age: 0,
    proof: 0,
    mashbill: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitGuess(guess);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sample {currentSample}</CardTitle>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Age (Years)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={guess.age}
                  onChange={(e) => 
                    setGuess((prev) => ({ ...prev, age: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Proof</label>
                <Input
                  type="number"
                  min={80}
                  max={160}
                  value={guess.proof}
                  onChange={(e) =>
                    setGuess((prev) => ({ ...prev, proof: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Mashbill Type
                </label>
                <Select
                  value={guess.mashbill}
                  onValueChange={(value) =>
                    setGuess((prev) => ({ ...prev, mashbill: value }))
                  }
                >
                  <option value="">Select Mashbill Type</option>
                  {MASHBILL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('previous')}
                disabled={isFirstSample}
              >
                Previous Sample
              </Button>
              <Button
                type="button"
                onClick={() => onNavigate('next')}
                disabled={isLastSample}
              >
                Next Sample
              </Button>
            </div>

            {isLastSample && (
              <Button type="submit" className="w-full mt-4">
                Submit Final Guesses
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}