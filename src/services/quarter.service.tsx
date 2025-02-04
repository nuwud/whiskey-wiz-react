import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  DocumentData,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AnalyticsService } from './analytics.service';
import { TimeseriesData } from '../types/game.types';
import { LeaderboardEntry } from './leaderboard.service';
import { PlayerProfile } from '../types/auth.types';
import { Quarter, QuarterAnalytics, WhiskeySample } from '../types/game.types';

class QuarterService {
  private quartersCollection = collection(db, 'quarters');
  private resultsCollection = collection(db, 'game_results');

  // Renamed from getActiveQuarter to getCurrentQuarter for consistency
  async getCurrentQuarter(): Promise<Quarter | null> {
    try {
      const q = query(
        this.quartersCollection,
        where('active', '==', true),
        orderBy('startDate', 'desc')
        // Removed endDate check to allow historical quarters
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const quarterDoc = snapshot.docs[0];
      return this.convertToQuarter(quarterDoc.data(), quarterDoc.id);
    } catch (error) {
      console.error('Failed to fetch current quarter', error);
      AnalyticsService.trackError('Failed to fetch current quarter', 'quarter_service');
      return null;
    }
  }

  async getActiveQuarters(): Promise<Quarter[]> {
    try {
      const q = query(
        this.quartersCollection,
        where('isActive', '==', true),
        orderBy('startDate', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertToQuarter(doc.data(), doc.id));
    } catch (error) {
      console.error('Failed to fetch active quarters', error);
      AnalyticsService.trackError('Failed to fetch active quarters', 'quarter_service');
      return [];
    }
  }

  async getGameConfiguration(quarterId: string): Promise<Quarter | null> {
    try {
      const quarterDoc = await getDoc(doc(this.quartersCollection, quarterId));
      if (!quarterDoc.exists()) {
        return null;
      }

      return this.convertToQuarter(quarterDoc.data(), quarterDoc.id);
    } catch (error) {
      console.error('Failed to fetch game configuration', error);
      AnalyticsService.trackError('Failed to fetch game configuration', 'quarter_service');
      return null;
    }
  }

  async getQuarterLeaderboard(quarterId: string, top: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(db, 'game_results'),
        where('quarterId', '==', quarterId),
        orderBy('score', 'desc'),
        limit(top)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          username: data.displayName,
          displayName: data.displayName,
          score: data.score,
          totalScore: data.score,
          quarterId: data.quarterId,
          timestamp: data.completedAt.toDate(),
          completedAt: data.completedAt.toDate(),
          totalChallengesCompleted: data.totalChallengesCompleted || 0,
          accuracy: {
            age: data.accuracy?.age || 0,
            proof: data.accuracy?.proof || 0,
            mashbill: data.accuracy?.mashbill || 0
          }
        };
      });
    } catch (error) {
      console.error('Failed to fetch quarter leaderboard', error);
      AnalyticsService.trackError('Failed to fetch quarter leaderboard', 'quarter_service');
      return [];
    }
  }


  async getQuarterAnalytics(quarterId: string): Promise<QuarterAnalytics | null> {
    try {
      const progressionStats = await this.getPlayerProgressionStats(quarterId);
      const sampleAnalytics = await this.getDetailedSampleAnalytics(quarterId);
      const resultsSnapshot = await getDocs(query(this.resultsCollection, where('quarterId', '==', quarterId)));

      if (!progressionStats) return null;

      // Calculate engagement metrics
      const timeSpentData = await this.calculateTimeSpentMetrics(quarterId);

      return {
        sampleAnalytics: [...sampleAnalytics],
        totalPlayers: progressionStats.totalGames,
        totalGames: progressionStats.totalGames,
        averageScore: progressionStats.averageScore,
        completionRate: progressionStats.totalChallengesCompleted / progressionStats.totalGames,
        averageCompletionRate: progressionStats.totalChallengesCompleted / progressionStats.totalGames,
        dailyStats: [],
        weeklyStats: [],
        monthlyStats: [],
        yearlyStats: [],
        quarterlyStats: [],
        playerActivity: [],
        gameStats: {
          totalGamesPlayed: progressionStats.totalGames,
          uniquePlayers: resultsSnapshot.size,
          averagePlaytime: timeSpentData.totalTimeSpent / progressionStats.totalGames || 0,
          completionRate: progressionStats.totalChallengesCompleted / progressionStats.totalGames
        },
        challengeStats: {
          totalAttempted: progressionStats.totalChallengesCompleted,
          totalCompleted: progressionStats.correctAnswers,
          averageTimePerChallenge: timeSpentData.totalTimeSpent / progressionStats.totalChallengesCompleted || 0,
          successRate: progressionStats.correctAnswers / progressionStats.totalChallengesCompleted || 0
        },
        rewardStats: {
          totalRewarded: 0,
          rewardTypes: {},
          claimRate: 0
        },
        sessionStats: {
          averageLength: timeSpentData.totalTimeSpent / progressionStats.totalGames || 0,
          totalSessions: progressionStats.totalGames,
          bounceRate: 0,
          returnRate: 0
        },
        totalChallengesCompleted: progressionStats.totalChallengesCompleted,
        bestScore: progressionStats.bestScore,
        correctAnswers: progressionStats.correctAnswers,
        hintsUsed: progressionStats.hintsUsed,
        favoriteWhiskey: progressionStats.favoriteWhiskey,
        totalSamples: progressionStats.totalSamples,
        perfectScores: progressionStats.perfectScores,
        lastPlayed: progressionStats.lastPlayed,
        quarterHistory: progressionStats.quarterHistory,
        timeseriesData: [],
        leaderboard: [],
        accuracy: { age: 0, proof: 0, mashbill: 0, sampleAccuracy: { age: 0, proof: 0, mashbill: 0 }, totalAttempts: { age: 0, proof: 0, mashbill: 0 }, difficulty: { beginner: 0, intermediate: 0, advanced: 0 }, averageAttempts: 0, averageTimeToComplete: 0, completionRateByDifficulty: { beginner: 0, intermediate: 0, advanced: 0, overall: 0 }, averageCompletionRate: 0 },
        difficultyDistribution: { beginner: 0, intermediate: 0, advanced: 0 },
        hintUsageStats: { total: 0, averagePerGame: 0 },
        engagement: {
          dailyActive: 0,
          monthlyActive: 0,
          totalTimeSpent: timeSpentData.totalTimeSpent || 0,
          averageTimeSpentPerGame: timeSpentData.totalTimeSpent / progressionStats.totalGames || 0
        },
        progression: { averageLevel: 0, levelDistribution: {} },
        achievements: { total: 0, distribution: {} },
        feedback: { averageRating: 0, comments: [] },
        monetization: { revenue: 0, transactions: 0 },
        retention: { day1: 0, day7: 0, day30: 0 },
        socialMetrics: { shares: 0, invites: 0 },
        technicalMetrics: { errors: 0, loadTime: 0 },
        marketingMetrics: { acquisition: {}, conversion: 0 },
        customEvents: [],
        abTestResults: {},
        seasonalTrends: { quarterly: [], monthly: [] },
        geographicData: { regions: {}, countries: {} },
        samplingAccuracy: {
          age: 0,
          proof: 0,
          mashbill: 0,
          ageAccuracy: 0,
          proofAccuracy: 0,
          mashbillAccuracy: 0
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
          progressionRate: progressionStats.totalChallengesCompleted / progressionStats.totalGames,
          difficultyRating: { beginner: 0, intermediate: 0, advanced: 0 },
          playerProgression: 0,
          totalChallenges: progressionStats.totalChallengesCompleted,
          totalCorrect: progressionStats.correctAnswers,
          accuracy: progressionStats.correctAnswers / progressionStats.totalChallengesCompleted
        },
        difficultyRating: {
          beginner: 0,
          intermediate: 0,
          advanced: 0
        },
        quarterPerformance: [{
          quarterId,
          averageScore: progressionStats.averageScore,
          totalPlayers: progressionStats.totalGames,
        }],
        machineLearningSuggestions: {
          recommendedMerchandise: [],
          potentialSubscriptionTargets: [],
          marketingSegments: []
        },
        playerDemographics: {
          authMethodBreakdown: {},
          ageBreakdown: {},
          regionDistribution: {},
          countryDistribution: {},
          favoriteWhiskey: progressionStats.favoriteWhiskey
        },
        playerEngagement: {
          totalTimeSpent: timeSpentData.totalTimeSpent || 0,
          averageTimeSpentPerGame: timeSpentData.totalTimeSpent / progressionStats.totalGames || 0,
          totalHintsUsed: progressionStats.hintsUsed,
          averageHintsUsedPerGame: progressionStats.hintsUsed / progressionStats.totalGames,
          averageHintsUsedPerPlayer: progressionStats.hintsUsed / progressionStats.totalGames,
          averageHintsUsedPerChallenge: progressionStats.hintsUsed / progressionStats.totalChallengesCompleted
        },
        flavorProfile: {
          preferredFlavors: [],
          mostPopularFlavors: [],
          flavorDensity: 0
        },
        samplePerformance: [],
        challengePerformance: {
          challengeId: '',
          totalAttempts: progressionStats.totalChallengesCompleted,
          totalCorrect: progressionStats.correctAnswers,
          accuracy: progressionStats.correctAnswers / progressionStats.totalChallengesCompleted || 0
        },
        playerChallenges: {
          challengeId: '',
          totalAttempts: progressionStats.totalChallengesCompleted,
          totalCorrect: progressionStats.correctAnswers,
          accuracy: progressionStats.correctAnswers / progressionStats.totalChallengesCompleted || 0
        },
        playerProfile: {
          userId: '',
          username: '',
          totalChallengesCompleted: progressionStats.totalChallengesCompleted,
          totalScore: progressionStats.totalGames * progressionStats.averageScore,
          favoriteWhiskey: progressionStats.favoriteWhiskey,
          totalSamples: progressionStats.totalSamples,
          perfectScores: progressionStats.perfectScores,
          lastPlayed: progressionStats.lastPlayed
        },
        playerLeaderboard: {
          global: [] as PlayerProfile[],
          quarterly: [] as PlayerProfile[]
        },
        playerStats: {
          totalGames: progressionStats.totalGames,
          averageScore: progressionStats.averageScore,
          bestScore: progressionStats.bestScore,
          totalChallengesCompleted: progressionStats.totalChallengesCompleted,
          correctAnswers: progressionStats.correctAnswers,
          hintsUsed: progressionStats.hintsUsed,
          favoriteWhiskey: progressionStats.favoriteWhiskey,
          totalSamples: progressionStats.totalSamples,
          perfectScores: progressionStats.perfectScores,
          lastPlayed: progressionStats.lastPlayed,
          quarterHistory: progressionStats.quarterHistory
        },
        machineLearning: {
          recommendations: {},
          predictions: {}
        },

      };
    } catch (error) {
      console.error('Failed to fetch quarter analytics', error);
      AnalyticsService.trackError('Failed to fetch quarter analytics', 'quarter_service');
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
      let totalTimeSpent = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalTimeSpent += data.timeSpent || 0;
      });

      return {
        totalTimeSpent
      };
    } catch (error) {
      console.error('Failed to calculate time spent metrics', error);
      return { totalTimeSpent: 0 };
    }
  }

  async getQuarterStats(quarterId: string): Promise<QuarterAnalytics | null> {
    return this.getQuarterAnalytics(quarterId);
  }

  async getDailyStats(quarterId: string): Promise<TimeseriesData[]> {
    return this.getQuarterTimeseries(quarterId);
  }

  async getAllQuarters(): Promise<Quarter[]> {
    try {
      const snapshot = await getDocs(this.quartersCollection);
      return snapshot.docs.map(doc => this.convertToQuarter(doc.data(), doc.id));
    } catch (error) {
      console.error('Failed to fetch all quarters', error);
      AnalyticsService.trackError('Failed to fetch all quarters', 'quarter_service');
      return [];
    }
  }

  async getQuarterTimeseries(quarterId: string): Promise<TimeseriesData[]> {
    try {
      const q = query(
        this.resultsCollection,
        where('quarterId', '==', quarterId),
        orderBy('completedAt', 'asc')
      );

      const snapshot = await getDocs(q);
      const resultsByDay = new Map<string, TimeseriesData>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = new Date(data.completedAt.toDate()).toDateString();

        if (!resultsByDay.has(date)) {
          resultsByDay.set(date, {
            date: date,
            timestamp: new Date(date),
            players: 0,
            averageScore: 0,
            completionRate: 0
          });
        }

        const dayStats = resultsByDay.get(date)!;
        dayStats.players++;
        dayStats.averageScore = (dayStats.averageScore * (dayStats.players - 1) + data.score) / dayStats.players;
        dayStats.completionRate = dayStats.players / snapshot.size;
      });

      return Array.from(resultsByDay.values());
    } catch (error) {
      console.error('Failed to fetch quarter timeseries', error);
      AnalyticsService.trackError('Failed to fetch quarter timeseries', 'quarter_service');
      return [];
    }
  }

  async updateQuarter(quarterId: string, data: Partial<Quarter>): Promise<void> {
    const docRef = doc(this.quartersCollection, quarterId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  async createQuarter(data: Omit<Quarter, 'id'>): Promise<string> {
    const docRef = await addDoc(this.quartersCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
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
        favoriteWhiskey: undefined,
        totalSamples: 0,
        perfectScores: 0,
        lastPlayed: undefined,
        quarterHistory: []
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
        if (!stats.lastPlayed || data.completedAt.toDate() > stats.lastPlayed) {
          stats.lastPlayed = data.completedAt.toDate();
        }
      });

      stats.averageScore = totalScore / snapshot.size;

      return stats;
    } catch (error) {
      console.error('Failed to fetch player progression stats', error);
      AnalyticsService.trackError('Failed to fetch player progression stats', 'quarter_service');
      return null;
    }
  }

  async getDetailedSampleAnalytics(quarterId: string) {
    try {
      const quarter = await this.getQuarterById(quarterId);
      if (!quarter) return [];

      const q = query(this.resultsCollection, where('quarterId', '==', quarterId));
      const snapshot = await getDocs(q);

      return quarter.samples.map(sample => {
        const sampleResults = snapshot.docs
          .map(doc => doc.data())
          .filter(data => data.sampleResults?.[sample.id]);

        const accuracyStats = this.calculateSampleAccuracyStats(sampleResults, sample);

        return {
          sampleId: sample.id,
          totalAttempts: sampleResults.length,
          averageAccuracy: accuracyStats,
          performance: {
            totalCorrect: sampleResults.filter(result => result.correct).length,
            accuracy: sampleResults.length > 0 ? sampleResults.filter(result => result.correct).length / sampleResults.length : 0
          },
          machineLearningSuggestions: {
            recommendedMerchandise: [''] as string[],
            potentialSubscriptionTargets: [''] as string[],
            marketingSegments: [''] as string[],
            sampleAnalytics: {
              sampleId: '',
              totalAttempts: sampleResults.length,
              averageAccuracy: {
                age: accuracyStats.age,
                proof: accuracyStats.proof,
                mashbill: accuracyStats.mashbill
              },
              performance: {
                totalCorrect: sampleResults.filter(result => result.correct).length,
                accuracy: sampleResults.length > 0 ? sampleResults.filter(result => result.correct).length / sampleResults.length : 0
              },
              machineLearningSuggestions: {
                recommendedMerchandise: [] as string[],
                potentialSubscriptionTargets: [] as string[],
                marketingSegments: [] as string[],
              }
            },
            playerDemographics: { age: 0, region: '', experience: '' },
            playerEngagement: { timeSpent: 0, retryRate: 0 },
            flavorProfile: { primary: [], secondary: [] },
            seasonalTrends: { popularity: 0, seasonalIndex: 0 },
            competitorAnalysis: { ranking: 0, marketShare: 0 },
            costAnalysis: { productionCost: 0, retailPrice: 0 },
            qualityMetrics: { satisfaction: 0, retention: 0 },
            supplierRelations: { reliability: 0, leadTime: 0 },
            playerStats: { attempts: 0, successRate: 0 },
            samplePerformance: { accuracy: 0, completion: 0 },
            challengePerformance: { score: 0, time: 0 },
            playerChallenges: [],
            playerProfile: { level: 0, rank: '' },
            playerLeaderboard: { position: 0, score: 0 }
          }
        };
      }
      );

    }
    catch (error) {
      console.error('Failed to fetch detailed sample analytics', error);
      AnalyticsService.trackError('Failed to fetch detailed sample analytics', 'quarter_service');
      return [];
    }
  }

  async getQuarterById(quarterId: string): Promise<Quarter | null> {
    try {
      const quarterDoc = await getDoc(doc(this.quartersCollection, quarterId));
      if (!quarterDoc.exists()) {
        return null;
      }
      return this.convertToQuarter(quarterDoc.data(), quarterDoc.id);
    } catch (error) {
      console.error('Failed to fetch quarter by ID', error);
      AnalyticsService.trackError('Failed to fetch quarter by ID', 'quarter_service');
      return null;
    }
  }

  calculateSampleAccuracyStats(results: any[], sample: WhiskeySample) {
    const totalResults = results.length;
    if (totalResults === 0) return { age: 0, proof: 0, mashbill: 0 };

    return {
      age: results.reduce((acc, result) =>
        acc + (result.age === sample.age ? 1 : 0), 0) / totalResults,
      proof: results.reduce((acc, result) =>
        acc + (result.proof === sample.proof ? 1 : 0), 0) / totalResults,
      mashbill: results.reduce((acc, result) =>
        acc + (result.mashbillType === sample.mashbill ? 1 : 0), 0) / totalResults
    };
  }

  convertTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === 'number') return new Date(timestamp);
    return new Date(timestamp);
  }

  convertToQuarter(data: DocumentData, id: string): Quarter {
    console.log('Converting quarter data:', data);
    
    return {
      id,
      name: data.name,
      description: data.description,
      startDate: data.startDate || Timestamp.now(),
      endDate: data.endDate || Timestamp.now(),
      startTime: data.startTime || Timestamp.now(),
      endTime: data.endTime || Timestamp.now(),
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now(),
      duration: data.duration || 0,
      minimumScore: data.minimumScore || 0,
      maximumScore: data.maximumScore || 100,
      minimumChallengesCompleted: data.minimumChallengesCompleted || 0,
      isActive: data.active || false,
      samples: data.samples || [],
      difficulty: data.difficulty || 'beginner',
      scoringRules: data.scoringRules || {
        age: { maxPoints: 0, pointDeductionPerYear: 0, exactMatchBonus: 0 },
        proof: { maxPoints: 0, pointDeductionPerProof: 0, exactMatchBonus: 0 },
        mashbill: { maxPoints: 0, pointDeductionPerType: 0, exactMatchBonus: 0 }
      },
      challenges: data.challenges || [],
    };
  }

  convertToWhiskeySample(data: DocumentData): WhiskeySample {
    console.log('Converting sample data:', data);
    const getMashbillType = (mashbill: { corn: number, rye: number, wheat: number, barley: number }): WhiskeySample['mashbill'] => {
      if (mashbill.corn >= 51) return 'bourbon';
      if (mashbill.rye >= 51) return 'rye';
      if (mashbill.wheat >= 51) return 'wheat';
      if (mashbill.corn >= 80) return 'corn';
      if (mashbill.barley >= 51) return 'malted barley';
      return 'bourbon'; // default fallback
    };

    return {
      id: data.id,
      name: data.name || 'Unknown Sample',
      age: data.age || 0,
      proof: data.proof || 0,
      mashbill: getMashbillType(data.mashbill || { corn: 51, rye: 0, wheat: 0, barley: 0 }),
      mashbillComposition: {
        corn: data.mashbill?.corn || 0,
        rye: data.mashbill?.rye || 0,
        wheat: data.mashbill?.wheat || 0,
        barley: data.mashbill?.barley || 0
      },
      notes: data.notes || [],
      hints: data.hints || [],
      distillery: data.distillery || 'Unknown',
      description: data.description || '',
      difficulty: data.difficulty || 'beginner',
      score: data.score || 'score',
      challengeQuestions: data.challengeQuestions || [],
      image: data.image || ''
    };
  }
}

// Helper functions
export const formatTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
  return date.toLocaleTimeString('en-US', options);
}

export const parseTimeString = (timeStr: string): Date | null => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export const isValidTimeString = (timeStr: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

// Service instances
export const quarterService = new QuarterService();