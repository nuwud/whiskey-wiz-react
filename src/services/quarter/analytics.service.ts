import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { QuarterAnalytics, WhiskeySample } from '../../types/game.types';
import { AnalyticsService } from '../analytics.service';
import { QuarterStats, DailyStats } from './types';

// const sampleAnalytics = await this.getDetailedSampleAnalytics(quarterId);

export class QuarterAnalyticsService {
  static instance: QuarterAnalyticsService;
  resultsCollection = collection(db, 'game_results'); // Fixed collection name
  quartersCollection = collection(db, 'quarters');

  private constructor() {
    // Private constructor to prevent direct instantiation
  }
  async getSamplePerformance(quarterId: string): Promise<any[]> {
    const sampleAnalytics = await this.getDetailedSampleAnalytics(quarterId);
    return sampleAnalytics || [];
  }

  public static getInstance(): QuarterAnalyticsService {
    if (!QuarterAnalyticsService.instance) {
      QuarterAnalyticsService.instance = new QuarterAnalyticsService();
    }
    return QuarterAnalyticsService.instance;
  }

  static trackEvent(eventName: string, data: Record<string, any>): void {
    AnalyticsService.trackEvent(eventName, data);
  }

  async getQuarterAnalytics(quarterId: string): Promise<QuarterAnalytics | null> {
      const sampleAnalytics = await this.getDetailedSampleAnalytics(quarterId);
    if (!quarterId) {
      console.error('Quarter ID is required');
      return Promise.resolve(null);
    }
    let quarterAnalytics: QuarterAnalytics = {
      totalScore: 0,
      totalPlayers: 0,
      totalGames: 0,
      averageScore: 0,
      totalCompleted: 0,
      completionRate: 0,
      totalHintsUsed: 0,
      totalChallenges: 0,
      totalChallengesCompleted: 0,
      bestScore: 0,
      correctAnswers: 0,
      hintsUsed: 0,
      favoriteWhiskey: undefined,
      totalSamples: 0,
      perfectScores: 0,
      lastPlayed: undefined,
      difficultyBreakdown: {
        beginner: 0,
        intermediate: 0,
        advanced: 0
      },
      quarterHistory: [],
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
        averageCompletionRate: 0
      },
      playerFeedback: [],
      playerStats: {
        totalScore: 0,
        totalGames: 0,
        averageScore: 0,
        recentResults: [],
        bestScore: 0,
        totalChallengesCompleted: 0,
        correctAnswers: 0,
        hintsUsed: 0,
        bestQuarterScore: 0,
        totalQuartersCompleted: 0,
        averageScorePerQuarter: 0
      },
      difficultyDistribution: {
        beginner: 0,
        intermediate: 0,
        advanced: 0
      },
      averageCompletionRate: 0,
      dailyStats: [],
      weeklyStats: [],
      monthlyStats: [],
      yearlyStats: [],
      quarterlyStats: [],
      playerActivity: [],
      gameStats: {
        totalGamesPlayed: 0,
        uniquePlayers: 0,
        averagePlaytime: 0,
        completionRate: 0
      },
      challengeStats: {
        totalAttempted: 0,
        totalCompleted: 0,
        averageTimePerChallenge: 0,
        successRate: 0
      },
      rewardStats: {
        totalRewarded: 0,
        rewardTypes: {},
        claimRate: 0
      },
      sessionStats: {
        averageLength: 0,
        totalSessions: 0,
        bounceRate: 0,
        returnRate: 0
      },
      quarterPerformance: [],
      playerDemographics: {
        authMethodBreakdown: {},
        ageBreakdown: {},
        regionDistribution: {},
        countryDistribution: {},
        favoriteWhiskey: undefined
      },
      playerEngagement: {
        totalTimeSpent: 0,
        averageTimeSpentPerGame: 0,
        totalHintsUsed: 0,
        averageHintsUsedPerGame: 0,
        averageHintsUsedPerPlayer: 0,
        averageHintsUsedPerChallenge: 0
      },
      flavorProfile: {
        preferredFlavors: [],
        mostPopularFlavors: [],
        flavorDensity: 0
      },
      sampleDifficulty: {
        difficultyId: '',
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0
      },
      sampleAnalytics: [],
      samplePerformance: [],
      challengePerformance: {
        challengeId: '',
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0
      },
      playerChallenges: {
        challengeId: '',
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0
      },
      playerProfile: {
        userId: '',
        username: '',
        totalChallengesCompleted: 0,
        totalScore: 0,
        favoriteWhiskey: undefined,
        totalSamples: 0,
        perfectScores: 0,
        lastPlayed: undefined,
        totalGames: 0
      },
      playerLeaderboard: {
        global: [],
        quarterly: []
      },
      engagement: {
        dailyActive: 0,
        monthlyActive: 0,
        totalTimeSpent: 0,
        averageTimeSpentPerGame: 0
      },
      progression: {
        averageLevel: 0,
        levelDistribution: {}
      },
      achievements: {
        total: 0,
        distribution: {}
      },
      feedback: {
        averageRating: 0,
        comments: []
      },
      monetization: {
        revenue: 0,
        transactions: 0
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
      }
    };
    try {
      const samplesQuery = collection(db, `quarters/${quarterId}/samples`);
      const samplesSnapshot = await getDocs(samplesQuery);
      const samples = samplesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() 
      } as WhiskeySample));

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
      if (data.completed) {
        totalCompleted++;
      }
      });

      let totalCompleted = 0;
      let totalHintsUsed = 0;
      let correctAnswers = 0;
      let perfectScores = 0;
      let totalSamples = samples.length;

    const dailyStats: DailyStats[] = []; // Define dailyStats

    const quarterAnalytics: QuarterAnalytics = {
      // Basic metrics
      totalScore: totalScore,
      totalPlayers: totalPlayers,
      totalGames: totalPlayers,
      averageScore: totalPlayers > 0 ? totalScore / totalPlayers : 0,
      totalCompleted: totalCompleted,
      completionRate: totalPlayers > 0 ? totalCompleted / totalPlayers : 0,
      totalHintsUsed: totalHintsUsed,
      totalChallenges: totalChallenges,
      totalChallengesCompleted: totalChallenges,
      bestScore: Math.max(...resultsSnapshot.docs.map(doc => doc.data().score || 0)),
      correctAnswers: correctAnswers,
      hintsUsed: totalHintsUsed,
      favoriteWhiskey: undefined,
      totalSamples: totalSamples,
      perfectScores: perfectScores,
      lastPlayed: resultsSnapshot.docs.length > 0 ? resultsSnapshot.docs[0].data().lastPlayed : undefined,
      difficultyBreakdown: {
        beginner: 0,
        intermediate: 0,
        advanced: 0
      },
      quarterHistory: [],
      completionTime: {
        min: 0,
        max: 0,
        average: 0
      },
      playerRetention: {
        totalPlayers: totalPlayers,
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
        totalChallenges: totalChallenges,
        totalCorrect: correctAnswers,
        accuracy: totalChallenges > 0 ? correctAnswers / totalChallenges : 0
      },
      difficultyRating: {
        beginner: 0,
        intermediate: 0,
        advanced: 0
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
        averageCompletionRate: 0
      },
      playerFeedback: [],
      playerStats: {
        totalScore: 0,
        totalGames: 0,
        averageScore: 0,
        recentResults: [],
        bestScore: 0,
        totalChallengesCompleted: 0,
        correctAnswers: 0,
        hintsUsed: 0,
        bestQuarterScore: 0,
        totalQuartersCompleted: 0,
        averageScorePerQuarter: 0
      },
      difficultyDistribution: {
        beginner: 0,
        intermediate: 0,
        advanced: 0
      },
      averageCompletionRate: 0,
      dailyStats: dailyStats,
      weeklyStats: [],
      monthlyStats: [],
      yearlyStats: [],
      quarterlyStats: [],
      playerActivity: [],
      gameStats: {
        totalGamesPlayed: totalPlayers,
        uniquePlayers: totalPlayers,
        averagePlaytime: 0,
        completionRate: totalPlayers > 0 ? totalCompleted / totalPlayers : 0
      },
      challengeStats: {
        totalAttempted: totalChallenges,
        totalCompleted: totalCompleted,
        averageTimePerChallenge: 0,
        successRate: totalChallenges > 0 ? totalCompleted / totalChallenges : 0
      },
      rewardStats: {
        totalRewarded: 0,
        rewardTypes: {},
        claimRate: 0
      },
      sessionStats: {
        averageLength: 0,
        totalSessions: totalPlayers,
        bounceRate: 0,
        returnRate: 0
      },
      quarterPerformance: [],
      playerDemographics: {
        authMethodBreakdown: {},
        ageBreakdown: {},
        regionDistribution: {},
        countryDistribution: {},
        favoriteWhiskey: undefined
      },
      playerEngagement: {
        totalTimeSpent: 0,
        averageTimeSpentPerGame: 0,
        totalHintsUsed: totalHintsUsed,
        averageHintsUsedPerGame: totalPlayers > 0 ? totalHintsUsed / totalPlayers : 0,
        averageHintsUsedPerPlayer: totalPlayers > 0 ? totalHintsUsed / totalPlayers : 0,
        averageHintsUsedPerChallenge: totalChallenges > 0 ? totalHintsUsed / totalChallenges : 0
      },
      flavorProfile: {
        preferredFlavors: [],
        mostPopularFlavors: [],
        flavorDensity: 0
      },
      sampleDifficulty: {
        difficultyId: '',
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0
      },
      sampleAnalytics: [{
        sampleId: '',
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
      }],
      samplePerformance: [{
        sampleId: '',
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0
      }],
      challengePerformance: {
        challengeId: '',
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0
      },
      playerChallenges: {
        challengeId: '',
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0
      },
      playerProfile: {
        userId: '',
        username: '',
        totalChallengesCompleted: totalChallenges,
        totalScore: totalScore,
        favoriteWhiskey: undefined,
        totalSamples: totalSamples,
        perfectScores: perfectScores,
        lastPlayed: resultsSnapshot.docs.length > 0 ? resultsSnapshot.docs[0].data().lastPlayed : undefined,
        totalGames: totalPlayers
      },
      playerLeaderboard: {
        global: [],
        quarterly: []
      },
      engagement: {
        dailyActive: 0,
        monthlyActive: 0,
        totalTimeSpent: 0,
        averageTimeSpentPerGame: 0
      },
      progression: {
        averageLevel: 0,
        levelDistribution: {}
      },
      achievements: {
        total: 0,
        distribution: {}
      },
      feedback: {
        averageRating: 0,
        comments: []
      },
      monetization: {
        revenue: 0,
        transactions: 0
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
        totalHintsUsed: totalHintsUsed,
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
      }
    };
      return Promise.resolve(quarterAnalytics);
    } catch (error) {
      if (quarterAnalytics) {
        quarterAnalytics.sampleAnalytics = sampleAnalytics;
        return Promise.resolve(quarterAnalytics);
      }
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
  
            if(snapshot.size > 0) {
          stats.averageScore = totalScore / snapshot.size;
        }
  
        return Promise.resolve(stats);
      } catch (error) {
        console.error('Failed to fetch progression stats:', error);
        return Promise.resolve(null);
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
        quarterId: quarterId,
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

      let totalScore = 0;

      const stats = {
        totalGames: snapshot.size,
        averageScore: snapshot.size > 0 ? totalScore / snapshot.size : 0,
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

  async getDetailedSampleAnalytics(quarterId: string): Promise<any[]> {
    try {
      const samplesQuery = collection(db, `quarters/${quarterId}/samples`);
      const samplesSnapshot = await getDocs(samplesQuery);
      const samples = samplesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const resultsQuery = query(this.resultsCollection, where('quarterId', '==', quarterId));
      const resultsSnapshot = await getDocs(resultsQuery);

      return samples.map((sample): any => {
        const sampleResults = resultsSnapshot.docs
          .map(doc => doc.data())
          .filter(data => data.sampleResults?.[sample.id]);

        const accuracyStats = this.calculateSampleAccuracyStats(sampleResults, sample);

        return {
          sampleId: sample.id,
          totalAttempts: sampleResults.length,
          averageAccuracy: accuracyStats,
          samplePerformance: [],
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