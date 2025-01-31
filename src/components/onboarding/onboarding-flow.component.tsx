"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card-ui.component';
import { Button } from '../../components/ui/button-ui.component';
import { Progress } from '../../components/ui/progress-ui.component';

interface Step {
  title: string;
  content: React.ReactNode;
}

const onboardingSteps: Step[] = [
  {
    title: "Welcome to WhiskeyWiz",
    content: (
      <div className="space-y-4">
        <p>Welcome to your journey into the world of whiskey tasting!</p>
        <p>In this game, you'll test your skills at identifying:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Whiskey age</li>
          <li>Proof (alcohol content)</li>
          <li>Mashbill composition</li>
        </ul>
      </div>
    )
  },
  {
    title: "How It Works",
    content: (
      <div className="space-y-4">
        <p>Each quarter, you'll receive:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>4 mystery whiskey samples</li>
          <li>Detailed tasting notes</li>
          <li>Score tracking and analytics</li>
        </ul>
        <p>Make your best guesses and earn points for accuracy!</p>
      </div>
    )
  },
  {
    title: "Scoring System",
    content: (
      <div className="space-y-4">
        <p>Points are awarded based on how close your guesses are:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Age: Within 1 year = max points</li>
          <li>Proof: Within 5 proof = max points</li>
          <li>Mashbill: Correct type = bonus points</li>
        </ul>
      </div>
    )
  }
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const goToNextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(current => current + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(current => current - 1);
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm">
            {currentStepData.content}
          </div>
          <div className="flex justify-between pt-4">
            <Button
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={goToNextStep}
              disabled={currentStep === onboardingSteps.length - 1}
            >
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}