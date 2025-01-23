import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, Timestamp, DocumentData, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Quarter, WhiskeySample, GameMetrics } from '../types/game.types';
import { shopifyService } from 'src/services/quarter.service.ts';

interface TimeseriesData {
  timestamp: Date;
  players: number;
  averageScore: number;
  completionRate: number;
}

interface QuarterAnalytics extends GameMetrics {
  timeseriesData: TimeseriesData[];
  sampleAccuracy: {
    age: {
      average: number;
      distribution: Record<number, number>;
    };
    proof: {
      average: number;
      distribution: Record<number, number>;
    };
    mashbill: {
      accuracy: number;
      mostMissed: string[];
    };
  };
  playerProgression: {
    averageTimePerSample: number;
    retryRate: number;
    hintUsage: number;
  };
}

class QuarterService {
  // Keep existing methods...

  async getQuarterTimeseries(quarterId: string): Promise<TimeseriesData[]> {
    const resultsRef = collection(db, 'game_results');
    const q = query(
      resultsRef,
      where('quarterId', '==', quarterId),
      orderBy('timestamp')
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => doc.data());

    // Group by day
    const dailyData = new Map<string, {
      players: number;
      scores: number[];
      completed: number;
    }>();

    results.forEach(result => {
      const date = result.completedAt.toDate().toISOString().split('T')[0];
      const day = dailyData.get(date) || {
        players: 0,
        scores: [],
        completed: 0
      };

      day.players++;
      if (result.isComplete) {
        day.completed++;
        day.scores.push(result.finalScore);
      }

      dailyData.set(date, day);
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      timestamp: new Date(date),
      players: data.players,
      averageScore: data.scores.length > 0
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : 0,
      completionRate: (data.completed / data.players) * 100
    }));
  }

  async getPlayerProgressionStats(quarterId: string): Promise<{
    totalPlayers: number;
    averageAttempts: number;
    averageTimeToComplete: number;
    completionRateByDifficulty: Record<string, number>;
  }> {
    const resultsRef = collection(db, 'game_results');
    const q = query(
      resultsRef,
      where('quarterId', '==', quarterId),
      where('isComplete', '==', true)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => doc.data());

    // Calculate average attempts
    const attemptsPerPlayer = new Map<string, number>();
    results.forEach(result => {
      const current = attemptsPerPlayer.get(result.userId) || 0;
      attemptsPerPlayer.set(result.userId, current + 1);
    });

    const averageAttempts = Array.from(attemptsPerPlayer.values())
      .reduce((a, b) => a + b, 0) / attemptsPerPlayer.size;

    // Calculate completion times
    const completionTimes = results.map(result => {
      const start = result.startedAt.toDate();
      const end = result.completedAt.toDate();
      return (end.getTime() - start.getTime()) / 1000; // seconds
    });

    const averageTimeToComplete = completionTimes.length
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    // Get completion rates by difficulty
    const totalByDifficulty = { beginner: 0, intermediate: 0, advanced: 0 };
    const completedByDifficulty = { beginner: 0, intermediate: 0, advanced: 0 };

    await Promise.all(results.map(async result => {
      const prefDoc = await getDoc(doc(db, 'user_preferences', result.userId));
      const difficulty = prefDoc.data()?.difficulty || 'beginner';
      totalByDifficulty[difficulty]++;
      if (result.isComplete) {
        completedByDifficulty[difficulty]++;
      }
    }));

    const completionRateByDifficulty = Object.keys(totalByDifficulty).reduce((acc, difficulty) => ({
      ...acc,
      [difficulty]: totalByDifficulty[difficulty]
        ? (completedByDifficulty[difficulty] / totalByDifficulty[difficulty]) * 100
        : 0
    }), {});

    return {
      totalPlayers: attemptsPerPlayer.size,
      averageAttempts,
      averageTimeToComplete,
      completionRateByDifficulty
    };
  }

  async getDetailedSampleAnalytics(quarterId: string): Promise<{
    sampleId: string;
    totalAttempts: number;
    averageAccuracy: {
      age: number;
      proof: number;
      mashbill: number;
    };
    commonMistakes: {
      category: string;
      value: string | number;
      frequency: number;
    }[];
  }[]> {
    const resultsRef = collection(db, 'game_results');
    const q = query(
      resultsRef,
      where('quarterId', '==', quarterId),
      where('isComplete', '==', true)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => doc.data());

    const sampleStats = new Map<string, {
      attempts: number;
      ageGuesses: number[];
      proofGuesses: number[];
      mashbillGuesses: string[];
      actualValues: {
        age: number;
        proof: number;
        mashbill: string;
      };
    }>();

    // Collect stats
    results.forEach(result => {
      Object.entries(result.sampleResults).forEach(([sampleId, data]: [string, any]) => {
        const stats = sampleStats.get(sampleId) || {
          attempts: 0,
          ageGuesses: [],
          proofGuesses: [],
          mashbillGuesses: [],
          actualValues: {
            age: data.actualAge,
            proof: data.actualProof,
            mashbill: data.actualMashbill
          }
        };

        stats.attempts++;
        stats.ageGuesses.push(data.age);
        stats.proofGuesses.push(data.proof);
        stats.mashbillGuesses.push(data.mashbill);

        sampleStats.set(sampleId, stats);
      });
    });

    // Calculate analytics
    return Array.from(sampleStats.entries()).map(([sampleId, stats]) => {
      const ageDeviations = stats.ageGuesses.map(g => Math.abs(g - stats.actualValues.age));
      const proofDeviations = stats.proofGuesses.map(g => Math.abs(g - stats.actualValues.proof));
      const mashbillAccuracy = stats.mashbillGuesses.filter(g => g === stats.actualValues.mashbill).length;

      // Find common mistakes
      const mistakes = [];
      if (ageDeviations.some(d => d > 2)) {
        const ageGroups = ageDeviations.reduce((acc, dev) => {
          const group = Math.floor(dev);
          acc[group] = (acc[group] || 0) + 1;
          return acc;
        }, {});
        const mostCommonAgeDev = Object.entries(ageGroups)
          .sort(([, a], [, b]) => b - a)[0];
        mistakes.push({
          category: 'age',
          value: parseInt(mostCommonAgeDev[0]),
          frequency: (mostCommonAgeDev[1] / stats.attempts) * 100
        });
      }

      return {
        sampleId,
        totalAttempts: stats.attempts,
        averageAccuracy: {
          age: 100 - (ageDeviations.reduce((a, b) => a + b, 0) / stats.attempts * 10),
          proof: 100 - (proofDeviations.reduce((a, b) => a + b, 0) / stats.attempts * 2),
          mashbill: (mashbillAccuracy / stats.attempts) * 100
        },
        commonMistakes: mistakes
      };
    });
  }

  // ... keep other existing methods
}

export const quarterService = new QuarterService();