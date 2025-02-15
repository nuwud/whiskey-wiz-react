import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { QuarterAnalytics, TimeseriesData, WhiskeySample } from '../../types/game.types';
import { AnalyticsService } from '../analytics.service';
import { QuarterConverters } from './converters';
import { QuarterStats, DailyStats } from './types';

export class QuarterAnalyticsService {
  private static instance: QuarterAnalyticsService;
  private resultsCollection = collection(db, 'game_results'); // Fixed collection name

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): QuarterAnalyticsService {
    if (!QuarterAnalyticsService.instance) {
      QuarterAnalyticsService.instance = new QuarterAnalyticsService();
    }
    return QuarterAnalyticsService.instance;
  }
  async getQuarterAnalytics(quarterId: string): Promise<QuarterAnalytics | null> {
    try {
      const progressionStats = await this.getPlayerProgressionStats(quarterId);
      if (!progressionStats) return null;

      const sampleAnalytics = await this.getDetailedSampleAnalytics(quarterId);
      const resultsSnapshot = await getDocs(query(this.resultsCollection, where('quarterId', '==', quarterId)));
      const timeSpentData = await this.calculateTimeSpentMetrics(quarterId);

      return {
        totalChallengesCompleted: progressionStats.totalChallengesCompleted,
        bestScore: progressionStats.bestScore,
        correctAnswers: progressionStats.correctAnswers,
        hintsUsed: progressionStats.hintsUsed,
        completionTime: { min: 0, max: 0, average: 0 },
        playerRetention: { totalPlayers: 0, newPlayers: 0, returningPlayers: 0 },
        challengeCompletion: {
          progressionRate: 0,
          difficultyRating: {
            totalAttempts: 0,
            totalCorrect: 0,
            accuracy: 0
          },
          playerProgression: 0,
          totalChallenges: 0,
          totalCorrect: 0,
          accuracy: 0
        },
        difficultyRating: {
          beginner: 0,
          intermediate: 0,
          advanced: 0
        },
        sampleAnalytics,
        gameStats: {
          totalGamesPlayed: progressionStats.totalGames,
          uniquePlayers: resultsSnapshot.size,
          averagePlaytime: timeSpentData.totalTimeSpent / (progressionStats.totalGames || 1),
          completionRate: progressionStats.totalChallengesCompleted / (progressionStats.totalGames || 1),
        },
        playerStats: progressionStats,
        totalPlayers: resultsSnapshot.size,
        totalGames: progressionStats.totalGames,
        averageScore: progressionStats.averageScore,
        completionRate: progressionStats.totalChallengesCompleted / (progressionStats.totalGames || 1),
        totalSamples: progressionStats.totalSamples,
        perfectScores: progressionStats.perfectScores,
        lastPlayed: progressionStats.lastPlayed,
        difficultyBreakdown: progressionStats.difficultyBreakdown,
        quarterHistory: progressionStats.quarterHistory,
        accuracy: {
          age: 0,
          proof: 0,
          mashbill: 0,
          sampleAccuracy: {
            age: 0,
            proof: 0,
            mashbill: 0
          },
          totalAttempts: {
            age: 0,
            proof: 0,
            mashbill: 0
          },
          difficulty: {
            beginner: 0,
            intermediate: 0,
            advanced: 0
          },
          averageAttempts: 0,
          averageTimeToComplete: 0,
          completionRateByDifficulty: {
            beginner: 0,
            intermediate: 0,
            advanced: 0,
            overall: 0
          },
          averageCompletionRate: 0,
        },
        difficultyDistribution: {
          beginner: 0,
          intermediate: 0,
          advanced: 0
        },
        averageCompletionRate: 0,
        dailyStats: [],
        engagement: {
          dailyActive: 0,
          monthlyActive: 0,
          totalTimeSpent: timeSpentData.totalTimeSpent,
          averageTimeSpentPerGame: timeSpentData.avgTimePerGame,
        },
        playerFeedback: [],
        retention: { day1: 0, day7: 0, day30: 0 },
        sampleDifficulty: {
          beginner: 0,
          intermediate: 0,
          advanced: 0
        },
        sampleEngagement: 0,
        sampleRetention: 0,
        sampleSuccessRate: 0,
        sampleTimeSpent: 0,
        sampleUsage: 0,
        totalChallenges: 0,
        totalCorrect: 0,
        totalHints: 0,
        totalPlaytime: 0,
        totalRetention: 0,
        totalScore: 0,
        totalTimeSpent: 0,
        totalUsage: 0,
        uniquePlayers: 0,
        userFeedback: [],
        userProgression: [],
        userRetention: 0,
        userSatisfaction: 0,
        userSuccessRate: 0,
        userTimeSpent: 0,
        userUsage: 0,
      };
    } catch (error) {
      console.error('❌ Failed to fetch quarter analytics', error);
      return null;
    }
  }

  async getQuarterStats(quarterId: string): Promise<QuarterStats | null> {
    try {
      const q = query(this.resultsCollection, where('quarterId', '==', quarterId));
      const snapshot = await getDocs(q);

      const stats: QuarterStats = {
        topScore: 0,
        totalPlayers: snapshot.size,
        averageScore: 0,
        completionRate: 0,
        sampleAccuracy: {
          age: 0,
          proof: 0,
          mashbill: 0
        },
        difficultyDistribution: {
          beginner: 0,
          intermediate: 0,
          advanced: 0
        }
      };

      let totalScore = 0;
      let totalCompleted = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalScore += data.score || 0;
        totalCompleted += data.completedChallenges || 0;

        if (data.difficulty) {
          stats.difficultyDistribution[data.difficulty as keyof typeof stats.difficultyDistribution] += 1;
        }

        const completedAt = data.completedAt?.toDate();
        if (completedAt && (!stats.lastPlayed || completedAt > stats.lastPlayed)) {
          stats.lastPlayed = completedAt;
        }
      });

      if (snapshot.size > 0) {
        stats.averageScore = totalScore / snapshot.size;
      }

      return stats;
    } catch (error) {
      console.error('Failed to fetch progression stats:', error);
      return null;
    }
  }

  async getDailyStats(quarterId: string): Promise<any> {
    try {
      const q = query(this.resultsCollection, where('quarterId', '==', quarterId));
      const snapshot = await getDocs(q);

      const dailyStats = snapshot.docs.map(doc => doc.data());
      return dailyStats;
    } catch (error) {
      console.error('Failed to fetch daily stats:', error);
      return null;
    }
  }

  async calculateTimeSpentMetrics(quarterId: string) {
    try {
      const q = query(
        this.resultsCollection,
        where('quarterId', '==', quarterId)
      );

      const snapshot = await getDocs(q);
      const metrics = {
        totalTimeSpent: 0,
        avgTimePerGame: 0,
        avgTimePerChallenge: 0,
        totalGames: snapshot.size,
        totalChallenges: 0
      };

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        metrics.totalTimeSpent += data.timeSpent || 0;
        metrics.totalChallenges += data.challengesCompleted || 0;
      });

      if (metrics.totalGames > 0) {
        metrics.avgTimePerGame = metrics.totalTimeSpent / metrics.totalGames;
      }
      if (metrics.totalChallenges > 0) {
        metrics.avgTimePerChallenge = metrics.totalTimeSpent / metrics.totalChallenges;
      }

      return metrics;
    } catch (error) {
      console.error('Failed to calculate time metrics:', error);
      AnalyticsService.trackEvent('time_metrics_error', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        totalTimeSpent: 0,
        avgTimePerGame: 0,
        avgTimePerChallenge: 0,
        totalGames: 0,
        totalChallenges: 0
      };
    }
  }

  async getPlayerProgressionStats(quarterId: string) {
    try {
      const q = query(this.resultsCollection, where('quarterId', '==', quarterId));
      const snapshot = await getDocs(q);

      const stats = {
        totalGames: snapshot.size,
        averageScore: 0,
        bestScore: 0,
        totalChallengesCompleted: 0,
        correctAnswers: 0,
        hintsUsed: 0,
        totalSamples: 0,
        perfectScores: 0,
        lastPlayed: undefined as Date | undefined,
        quarterHistory: [] as any[],
        difficultyBreakdown: {
          beginner: 0,
          intermediate: 0,
          advanced: 0
        }
      };

      let totalScore = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalScore += data.score || 0;
        stats.bestScore = Math.max(stats.bestScore, data.score || 0);
        stats.totalChallengesCompleted += data.completed ? 1 : 0;
        stats.correctAnswers += data.correctAnswers || 0;
        stats.hintsUsed += data.hintsUsed || 0;
        stats.totalSamples += data.samplesAttempted || 0;
        stats.perfectScores += data.score === 100 ? 1 : 0;
        
        if (data.difficulty) {
          stats.difficultyBreakdown[data.difficulty as keyof typeof stats.difficultyBreakdown]++;
        }
        
        const completedAt = data.completedAt?.toDate();
        if (completedAt && (!stats.lastPlayed || completedAt > stats.lastPlayed)) {
          stats.lastPlayed = completedAt;
        }
      });

      if (snapshot.size > 0) {
        stats.averageScore = totalScore / snapshot.size;
      }

      return stats;
    } catch (error) {
      console.error('Failed to fetch progression stats:', error);
      AnalyticsService.trackEvent('progression_stats_error', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  async getDetailedSampleAnalytics(quarterId: string) {
    try {
      const samplesQuery = collection(db, `quarters/${quarterId}/samples`);
      const samplesSnapshot = await getDocs(samplesQuery);
      const samples = samplesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const resultsQuery = query(this.resultsCollection, where('quarterId', '==', quarterId));
      const resultsSnapshot = await getDocs(resultsQuery);

      return samples.map(sample => {
        const sampleResults = resultsSnapshot.docs
          .map(doc => doc.data())
          .filter(data => data.sampleResults?.[sample.id]);

        const accuracyStats = this.calculateSampleAccuracyStats(sampleResults, sample);

        return {
          sampleId: sample.id,
          totalAttempts: sampleResults.length,
          averageAccuracy: accuracyStats,
          performance: {
            totalCorrect: sampleResults.filter(result => result.sampleResults[sample.id]?.correct).length,
            accuracy: sampleResults.length > 0 ? 
              sampleResults.filter(result => result.sampleResults[sample.id]?.correct).length / sampleResults.length : 0
          },
          averageTimeSpent: sampleResults.reduce((acc, result) => 
            acc + (result.sampleResults[sample.id]?.timeSpent || 0), 0) / (sampleResults.length || 1),
          machineLearningSuggestions: {
            nextBestAction: 'none',
            predictedScore: 0,
            recommendedMerchandise: [],
            potentialSubscriptionTargets: [],
            marketingSegments: [],
            nextSample: [],
            improvementTips: []
          }
        };
      });
    } catch (error) {
      console.error('Failed to fetch sample analytics:', error);
      AnalyticsService.trackEvent('sample_analytics_error', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private calculateSampleAccuracyStats(results: any[], sample: any) {
    const totalResults = results.length;
    if (totalResults === 0) return { age: 0, proof: 0, mashbill: 0 };

    const stats = {
      age: 0,
      proof: 0,
      mashbill: 0
    };

    results.forEach(result => {
      const sampleResult = result.sampleResults?.[sample.id];
      if (sampleResult) {
        if (sampleResult.age === sample.age) stats.age++;
        if (sampleResult.proof === sample.proof) stats.proof++;
        if (sampleResult.mashbillType === sample.mashbill) stats.mashbill++;
      }
    });

    return {
      age: stats.age / totalResults,
      proof: stats.proof / totalResults,
      mashbill: stats.mashbill / totalResults
    };
  }
}

export const quarterAnalyticsService = QuarterAnalyticsService.getInstance();