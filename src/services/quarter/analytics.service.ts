import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { QuarterAnalytics } from '../../types/game.types';
import { AnalyticsService } from '../analytics.service';
import { QuarterStats, DailyStats } from './types';
import { PlayerStats } from '../../components/player/player-stats.component';

export class QuarterAnalyticsService {
  private static instance: QuarterAnalyticsService;
  private resultsCollection = collection(db, 'game_results'); // Fixed collection name
  private quartersCollection = collection(db, 'quarters');

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): QuarterAnalyticsService {
    if (!QuarterAnalyticsService.instance) {
      QuarterAnalyticsService.instance = new QuarterAnalyticsService();
    }
    return QuarterAnalyticsService.instance;
  }

  async getQuarterAnalytics(quarterId: string): Promise<QuarterAnalytics | null | undefined> {
    if (!quarterId) {
      console.error('Quarter ID is required');
      return null;
    }
    try {

      const samplesQuery = collection(db, `quarters/${quarterId}/samples`);
      const samplesSnapshot = await getDocs(samplesQuery);
      const samples = samplesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const resultsQuery = query(
        this.resultsCollection,
        where('quarterId', '==', quarterId)
      );
      const resultsSnapshot = await getDocs(resultsQuery);

      const totalPlayers = resultsSnapshot.size;
      let totalScore = 0;
      let totalChallenges = 0;

      resultsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalScore += data.score || 0;
        totalChallenges += data.challengesCompleted || 0;
      });

      const analytics: QuarterAnalytics = {

          totalGames: 0,
          averageScore: 0,
          bestScore: 0,
          totalChallengesCompleted: 0,
          correctAnswers: 0,
          hintsUsed: 0,
          favoriteWhiskey: '',
          totalSamples: 0,
          perfectScores: 0,
          lastPlayed: undefined,
          quarterHistory: {
            quarterId: '',
            totalGames: 0,
            averageScore: 0,
            bestScore: 0,
            totalChallengesCompleted: 0,
            correctAnswers: 0,
            hintsUsed: 0,
            favoriteWhiskey: '',
            totalSamples: 0,
            perfectScores: 0,
            lastPlayed: undefined
          },
          totalAttempts: 0,
          averageAttempts: 0,
          averageTimeToComplete: 0,
          completionRateByDifficulty: {
            beginner: 0,
            intermediate: 0,
            advanced: 0,
            overall: 0
          },
          averageCompletionRate: 0,

          difficultyDistribution: {
            beginner: 0,
            intermediate: 0,
            advanced: 0
          },
          dailyStats: [],
          weeklyStats: [],
          monthlyStats: [],
          quarterlyStats: [],
          yearlyStats: [],
          playerRetentionStats: [],
          playerEngagementStats: [],
          playerProgressionStats: [],
          playerFeedbackStats: [],
          playerAchievementStats: [],
          playerChallengeStats: [],
          playerHintStats: [],
          playerTimeStats: [],
          playerScoreStats: [],
          playerAccuracyStats: [],
          playerCompletionStats: [],
          playerLeaderboardStats: [],
          playerSocialStats: [],
          playerTechnicalStats: [],
          playerMarketingStats: [],
          playerCustomEventStats: [],
          playerABTestStats: [],
          playerSeasonalTrendStats: [],
          playerGeographicStats: [],
          playerMachineLearningStats: [],
          playerHintUsageStats: [],
          playerTimeseriesStats: [],
          playerLeaderboard: {
            global: [],
            quarterly: []
          },
          playerSamplingAccuracyStats: [],
          playerAccuracy: {
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
            difficulty: { beginner: 0, intermediate: 0, advanced: 0 },
            averageAttempts: 0,
            averageTimeToComplete: 0,
            completionRateByDifficulty: {
              beginner: 0,
              intermediate: 0,
              advanced: 0,
              overall: 0
            },
            averageCompletionRate: 0
          },
          totalPlayers,
          completionRate: 0,
          difficultyBreakdown: {
            beginner: 0,
            intermediate: 0,
            advanced: 0
          },
          sampleAnalytics: samples.map(sample => ({
            sampleId: sample.id,
            totalAttempts: 0,
            averageAccuracy: {
              age: 0,
              proof: 0,
              mashbill: 0
            },
            performance: {
              totalCorrect: 0,
              accuracy: 0
            },
            machineLearningSuggestions: {
              recommendedMerchandise: [],
              potentialSubscriptionTargets: [],
              marketingSegments: [],
              nextSample: [],
              improvementTips: []
            }
          })),
          gameStats: {
            totalGamesPlayed: resultsSnapshot.size,
            uniquePlayers: totalPlayers,
            averagePlaytime: 0,
            completionRate: 0
          },
          playerEngagement: {
            totalTimeSpent: 0,
            averageTimeSpentPerGame: 0,
            totalHintsUsed: 0,
            averageHintsUsedPerGame: 0,
            averageHintsUsedPerPlayer: 0,
            averageHintsUsedPerChallenge: 0
          },
          completionTime: {
            min: 0,
            max: 0,
            average: 0
          },
          playerRetention: {
            totalPlayers: 0,
            newPlayers: 0,
            returningPlayers: 0
          },
          challengeCompletion: {
            progressionRate: 0,
            difficultyRating: {
              beginner: 0,
              intermediate: 0,
              advanced: 0
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
          engagement: {
            dailyActive: 0,
            monthlyActive: 0,
            totalTimeSpent: 0,
            averageTimeSpentPerGame: 0
          },
          retention: {
            day1: 0,
            day7: 0,
            day30: 0
          },
          socialMetrics: {
            shares: 0,
            invites: 0
          },
          technicalMetrics: {
            errors: 0,
            loadTime: 0
          },
          marketingMetrics: {
            acquisition: {},
            conversion: 0
          },
          customEvents: [],
          abTestResults: {},
          seasonalTrends: {
            quarterly: [],
            monthly: []
          },
          geographicData: {
            regions: {},
            countries: {}
          },
          machineLearning: {
            recommendations: {},
            predictions: {},
            modelVersion: '',
            accuracy: 0
          },
          hintUsageStats: {
            totalHintsUsed: 0,
            hintsUsedPerSample: []
          },
          timeseriesData: [],
          leaderboard: [],
          samplingAccuracy: {
            age: 0,
            proof: 0,
            mashbill: 0,
            ageAccuracy: 0,
            proofAccuracy: 0,
            mashbillAccuracy: 0
          },
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
            difficulty: { beginner: 0, intermediate: 0, advanced: 0 },
            averageAttempts: 0,
            averageTimeToComplete: 0,
            completionRateByDifficulty: {
              beginner: 0,
              intermediate: 0,
              advanced: 0,
              overall: 0
            },
            averageCompletionRate: 0
          },
          playerFeedback: []
          
        };




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

  async getDailyStats(quarterId: string): Promise<DailyStats[]> {
    try {
      const q = query(
        this.resultsCollection,
        where('quarterId', '==', quarterId)
      );
      const snapshot = await getDocs(q);

      const dailyStats = new Map<string, DailyStats>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = data.completedAt?.toDate().toDateString() || new Date().toDateString();

        if (!dailyStats.has(date)) {
          dailyStats.set(date, {
            date,
            players: 0,
            averageScore: 0,
            completionRate: 0
          });
        }

        const stats = dailyStats.get(date)!;
        stats.players++;
        stats.averageScore = ((stats.averageScore * (stats.players - 1)) + (data.score || 0)) / stats.players;
        stats.completionRate = stats.players / snapshot.size;
      });

      return Array.from(dailyStats.values());
    } catch (error) {
      console.error('Failed to fetch daily stats:', error);
      return [];
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