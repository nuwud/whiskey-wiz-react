"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Quarter {
  id: string;
  name: string;
  active: boolean;
  startDate: string;
  endDate: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completedBy: number;
  averageScore: number;
}

interface QuarterSelectionProps {
  quarters: Quarter[];
  onSelectQuarter: (quarterId: string) => void;
  userProgress: Record<string, {
    completed: boolean;
    score?: number;
    attempts: number;
  }>;
}

export function QuarterSelection({
  quarters,
  onSelectQuarter,
  userProgress,
}: QuarterSelectionProps) {
  const getDifficultyColor = (difficulty: Quarter['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Quarters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quarters.map((quarter) => {
              const progress = userProgress[quarter.id];
              return (
                <Card key={quarter.id} className="relative">
                  {!quarter.active && (
                    <div className="absolute inset-0 bg-gray-500/50 flex items-center justify-center rounded-lg">
                      <p className="text-white font-medium">Coming Soon</p>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium">{quarter.name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(quarter.startDate).toLocaleDateString()} -
                          {new Date(quarter.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getDifficultyColor(quarter.difficulty)}>
                        {quarter.difficulty}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Times Played:</span>
                        <span>{progress?.attempts || 0}</span>
                      </div>
                      {progress?.completed && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Your Score:</span>
                          <span>{progress.score}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Global Average:</span>
                        <span>{quarter.averageScore}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => onSelectQuarter(quarter.id)}
                      disabled={!quarter.active}
                    >
                      {progress?.completed ? 'Play Again' : 'Start Quarter'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}