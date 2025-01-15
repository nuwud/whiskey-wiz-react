"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface GameResultsProps {
  results: {
    sampleId: string;
    actualAge: number;
    guessedAge: number;
    actualProof: number;
    guessedProof: number;
    actualMashbill: string;
    guessedMashbill: string;
    scoreBreakdown: {
      agePoints: number;
      proofPoints: number;
      mashbillPoints: number;
      total: number;
    };
  }[];
  totalScore: number;
  averageScore: number;
  personalBest: number;
}

export function GameResults({
  results,
  totalScore,
  averageScore,
  personalBest,
}: GameResultsProps) {
  const chartData = results.map((result) => ({
    name: `Sample ${result.sampleId}`,
    Age: result.scoreBreakdown.agePoints,
    Proof: result.scoreBreakdown.proofPoints,
    Mashbill: result.scoreBreakdown.mashbillPoints,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Score</p>
              <p className="text-2xl font-bold">{totalScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold">{averageScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Personal Best</p>
              <p className="text-2xl font-bold">{personalBest}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Score Breakdown</h3>
            <div className="w-full h-64">
              <BarChart
                width={600}
                height={250}
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Age" fill="#8884d8" />
                <Bar dataKey="Proof" fill="#82ca9d" />
                <Bar dataKey="Mashbill" fill="#ffc658" />
              </BarChart>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Detailed Results</h3>
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.sampleId}>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Sample {result.sampleId}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Age</p>
                        <p>Actual: {result.actualAge} years</p>
                        <p>Guessed: {result.guessedAge} years</p>
                        <p className="text-sm text-blue-500">
                          Points: {result.scoreBreakdown.agePoints}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Proof</p>
                        <p>Actual: {result.actualProof}</p>
                        <p>Guessed: {result.guessedProof}</p>
                        <p className="text-sm text-blue-500">
                          Points: {result.scoreBreakdown.proofPoints}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Mashbill</p>
                        <p>Actual: {result.actualMashbill}</p>
                        <p>Guessed: {result.guessedMashbill}</p>
                        <p className="text-sm text-blue-500">
                          Points: {result.scoreBreakdown.mashbillPoints}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}