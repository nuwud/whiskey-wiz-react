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
  addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase'; // Ensure db is an instance of Firestore
import { AnalyticsService } from './analytics.service';
import { TimeseriesData } from '../types/game.types';
import { LeaderboardEntry } from './leaderboard.service';
import { PlayerProfile } from '../types/auth.types';
import { Quarter, QuarterAnalytics, WhiskeySample, MashbillType, MASHBILL_TYPES } from '../types/game.types';

export const getSamplesForQuarter = async (quarterId: string) => {
  const quarterRef = doc(db, 'quarters', quarterId);
  const quarterSnap = await getDoc(quarterRef);

  if (!quarterSnap.exists()) {
    console.error(`Quarter ${quarterId} does not exist.`);
    return [];
  }

  const quarterData = quarterSnap.data();
  let samples = quarterData.samples || [];

  // If no samples are in the main document, check the subcollection
  if (samples.length === 0) {
    const sampleQuery = collection(db, 'quarters', quarterId, 'samples');
    const sampleSnap = await getDocs(sampleQuery);
    samples = sampleSnap.docs.map(doc => doc.data());
  }

  if (samples.length === 0) {
    console.error("No samples found in quarter!");
  }

  return samples;
};

export class QuarterService {
  private static instance: QuarterService;

  private constructor() { }

  public static getInstance(): QuarterService {
    if (!QuarterService.instance) {
      QuarterService.instance = new QuarterService();
    }
    return QuarterService.instance;
  }

  private quartersCollection = collection(db, 'quarters');
  private resultsCollection = collection(db, 'game_results');

  // Renamed from getActiveQuarter to getCurrentQuarter for consistency
  async getCurrentQuarter(): Promise<Quarter | null> {
    try {
      const q = query(
        this.quartersCollection,
        where('isActive', '==', true),  // Changed to consistently use isActive
        orderBy('startDate', 'desc')
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const quarterDoc = snapshot.docs[0];
      return this.convertToQuarter(quarterDoc.data(), quarterDoc.id);
    } catch (error) {
      console.error('Failed to fetch current quarter', error);
      AnalyticsService.trackEvent('Failed to fetch current quarter', { service: 'quarter_service' });
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
      AnalyticsService.trackEvent('Failed to fetch active quarters', { service: 'quarter_service' });
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
      AnalyticsService.trackEvent('Failed to fetch game configuration', { service: 'quarter_service' });
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
      AnalyticsService.trackEvent('Failed to fetch quarter leaderboard', { service: 'quarter_service' });
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
      AnalyticsService.trackEvent('Failed to fetch quarter analytics', { service: 'quarter_service' });
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
      // Get all active quarters
      const q = query(
        this.quartersCollection,
        where("isActive", "==", true),
        orderBy("startDate", "desc")
      );

      console.log('Fetching quarters...');
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('No active quarters found');
        return [];
      }

      const quarters: Quarter[] = [];

      // Process each quarter
      for (const doc of snapshot.docs) {
        try {
          const quarterData = doc.data();
          console.log(`Processing quarter ${doc.id}:`, quarterData);

          // Fetch samples for this quarter
          const samplesRef = collection(db, `quarters/${doc.id}/samples`);
          const samplesSnapshot = await getDocs(samplesRef);

          console.log(`Found ${samplesSnapshot.size} samples for quarter ${doc.id}`);

          // Convert samples
          const samples = samplesSnapshot.docs.map(sampleDoc => {
            const sampleData = sampleDoc.data();
            console.log(`Converting sample ${sampleDoc.id}:`, sampleData);

            return this.convertToWhiskeySample({
              id: sampleDoc.id,
              ...sampleData
            });
          });

          // Convert and validate quarter
          const quarter = this.convertToQuarter({
            ...quarterData,
            samples: samples
          }, doc.id);

          if (!this.validateQuarter(quarter)) {
            console.warn(`Skipping invalid quarter ${doc.id}`);
            continue;
          }

          quarters.push(quarter);

        } catch (quarterError) {
          console.error(`Error processing quarter ${doc.id}:`, quarterError);
          AnalyticsService.trackEvent('quarter_processing_failed', {
            quarterId: doc.id,
            error: quarterError instanceof Error ? quarterError.message : 'Unknown error'
          });
          // Continue processing other quarters
          continue;
        }
      }

      // Track successful retrieval
      AnalyticsService.trackEvent('quarters_retrieved', {
        count: quarters.length,
        quartersWithSamples: quarters.filter(q => q.samples?.length > 0).length
      });

      return quarters;

    } catch (error) {
      console.error('Failed to fetch quarters:', error);
      AnalyticsService.trackEvent('quarters_retrieval_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
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
      AnalyticsService.trackEvent('Failed to fetch quarter timeseries', { service: 'quarter_service' });
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
      AnalyticsService.trackEvent('Failed to fetch player progression stats', { service: 'quarter_service' });
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
      AnalyticsService.trackEvent('Failed to fetch detailed sample analytics', { service: 'quarter_service' });
      return [];
    }
  }

  // In QuarterService class

  async getQuarterById(quarterId: string): Promise<Quarter | null> {
    try {
      if (!quarterId) {
        throw new Error("Quarter ID is required");
      }

      // Get main quarter document
      const quarterDoc = await getDoc(doc(db, 'quarters', quarterId));
      if (!quarterDoc.exists()) {
        console.error('Quarter not found:', quarterId);
        return null;
      }

      let samples: WhiskeySample[] = [];

      // First try to get samples from the main document
      const quarterData = quarterDoc.data();
      if (quarterData.samples) {
        console.log('Found samples in main document:', quarterData.samples);
        if (Array.isArray(quarterData.samples)) {
          samples = quarterData.samples;
        } else if (typeof quarterData.samples === 'object') {
          samples = Object.values(quarterData.samples);
        }
      }

      // If no samples in main document, try the subcollection
      if (samples.length === 0) {
        console.log('No samples in main document, checking subcollection...');
        const samplesRef = collection(db, 'quarters', quarterId, 'samples');
        const samplesSnapshot = await getDocs(samplesRef);

        if (!samplesSnapshot.empty) {
          samples = samplesSnapshot.docs.map(doc => this.convertToWhiskeySample({
            id: doc.id,
            ...doc.data()
          }));
          console.log('Found samples in subcollection:', samples);
        }
      }

      // If still no samples, check for individual sample documents
      if (samples.length === 0) {
        console.log('Checking for individual sample documents...');
        const samplePromises = ['A', 'B', 'C', 'D'].map(async (sampleId) => {
          const sampleRef = doc(db, `quarters/${quarterId}/samples/${sampleId}`);
          const sampleDoc = await getDoc(sampleRef);
          if (sampleDoc.exists()) {
            return {
              id: sampleId,
              ...sampleDoc.data()
            };
          }
          return null;
        });

        const sampleResults = await Promise.all(samplePromises);
        samples = sampleResults.filter((sample): sample is WhiskeySample => sample !== null);
        console.log('Found individual samples:', samples);
      }

      // Merge quarter data with samples
      const quarterWithSamples = {
        ...quarterDoc.data(),
        id: quarterId,
        samples
      };

      console.log('Final quarter data with samples:', quarterWithSamples);
      return this.convertToQuarter(quarterWithSamples, quarterId);

    } catch (error) {
      console.error('Error fetching quarter:', error);
      AnalyticsService.trackEvent('quarter_fetch_failed', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
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

    // Ensure samples are properly formatted
    const samples = this.ensureSamples(data);
    console.log('Normalized samples:', samples);

    return {
      id,
      name: data.name || '',
      description: data.description || '',
      startDate: this.convertTimestamp(data.startDate),
      endDate: this.convertTimestamp(data.endDate),
      startTime: this.convertTimestamp(data.startTime),
      endTime: this.convertTimestamp(data.endTime),
      createdAt: this.convertTimestamp(data.createdAt),
      updatedAt: this.convertTimestamp(data.updatedAt),
      duration: typeof data.duration === 'number' ? data.duration : 90,
      minimumScore: typeof data.minimumScore === 'number' ? data.minimumScore : 0,
      maximumScore: typeof data.maximumScore === 'number' ? data.maximumScore : 100,
      minimumChallengesCompleted: typeof data.minimumChallengesCompleted === 'number'
        ? data.minimumChallengesCompleted
        : 0,
      isActive: Boolean(data.isActive || data.active),
      samples,
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(data.difficulty)
        ? data.difficulty
        : 'beginner',
      scoringRules: data.scoringRules || {
        age: {
          maxPoints: 100,
          pointDeductionPerYear: 10,
          exactMatchBonus: 50,
          points: 0,
          penaltyPerYear: 10,
          minValue: 0,
          maxValue: 0,
          hasLowerLimit: false,
          hasUpperLimit: false,
          gracePeriod: 0
        },
        proof: {
          maxPoints: 100,
          pointDeductionPerProof: 5,
          exactMatchBonus: 50,
          points: 0,
          penaltyPerPoint: 5,
          minValue: 0,
          maxValue: 0,
          hasLowerLimit: false,
          hasUpperLimit: false,
          gracePeriod: 0
        },
        mashbill: {
          maxPoints: 100,
          pointDeductionPerType: 25,
          exactMatchBonus: 50,
          points: 0
        }
      },
      challenges: Array.isArray(data.challenges) ? data.challenges : []
    };
  }

  // In QuarterService class

  convertToWhiskeySample(data: DocumentData): WhiskeySample {
    console.log('Converting sample data:', data);

    // Handle different mashbill formats
    let mashbillType: MashbillType;
    let mashbillComposition = {
      corn: 0,
      rye: 0,
      wheat: 0,
      barley: 0
    };

    if (typeof data.mashbill === 'string') {
      // If mashbill is a string, use it directly
      mashbillType = data.mashbill as MashbillType;
    } else if (typeof data.mashbill === 'object' && data.mashbill !== null) {
      // If mashbill is an object with percentages
      mashbillComposition = {
        corn: data.mashbill.corn || 0,
        rye: data.mashbill.rye || 0,
        wheat: data.mashbill.wheat || 0,
        barley: data.mashbill.barley || 0
      };

      // Determine type based on highest percentage
      if (mashbillComposition.corn >= 51) mashbillType = MASHBILL_TYPES.BOURBON;
      else if (mashbillComposition.rye >= 51) mashbillType = MASHBILL_TYPES.RYE;
      else if (mashbillComposition.wheat >= 51) mashbillType = MASHBILL_TYPES.WHEAT;
      else if (mashbillComposition.barley >= 51) mashbillType = MASHBILL_TYPES.SINGLE_MALT;
      else mashbillType = MASHBILL_TYPES.BOURBON;
    } else {
      // Default to bourbon if no valid mashbill data
      mashbillType = MASHBILL_TYPES.BOURBON;
    }

    // Handle numeric fields with proper type conversion
    const age = parseInt(data.age) || 0;
    const proof = parseFloat(data.proof) || 0;
    const rating = parseFloat(data.rating) || 0;
    const price = parseFloat(data.price) || 0;

    // Ensure arrays are properly initialized
    const notes = Array.isArray(data.notes) ? data.notes :
      typeof data.notes === 'string' ? [data.notes] : [];

    const hints = Array.isArray(data.hints) ? data.hints :
      typeof data.hints === 'string' ? [data.hints] : [];

    const challengeQuestions = Array.isArray(data.challengeQuestions) ?
      data.challengeQuestions : [];

    // Create the sample object with all required fields
    const sample: WhiskeySample = {
      id: data.id || '',
      name: data.name || `Sample ${data.id || ''}`,
      age,
      proof,
      mashbill: mashbillType,
      mashbillComposition,
      notes,
      hints,
      distillery: data.distillery || 'Unknown',
      description: data.description || '',
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(data.difficulty)
        ? data.difficulty
        : 'beginner',
      score: data.score || 0,
      challengeQuestions,
      image: data.image || '',
      rating,
      type: data.type || 'bourbon',
      region: data.region || 'unknown',
      imageUrl: data.imageUrl || '',
      price
    };

    console.log('Converted sample:', sample);
    return sample;
  }

  private ensureSamples(data: any): WhiskeySample[] {
    const samples: WhiskeySample[] = [];
    
    if (!data.samples) {
      console.warn('No samples found in quarter data');
      return this.createDefaultSamples();
    }
  
    if (Array.isArray(data.samples)) {

      samples.push(...(data.samples as any[]).map((sample: any, index: number) => 
        this.convertToWhiskeySample({
          ...sample,
          id: String.fromCharCode(65 + index)
        })
      ));
    } else if (typeof data.samples === 'object') {
      const sampleEntries = Object.entries(data.samples);
      sampleEntries.forEach(([, value], index) => {
        const sampleData = typeof value === 'object' && value !== null ? value : {};
        samples.push(this.convertToWhiskeySample({
          ...sampleData,
          id: String.fromCharCode(65 + index)
        }));
      });
    }
  
    // Ensure exactly 4 samples
    while (samples.length < 4) {
      samples.push(this.createDefaultSample(String.fromCharCode(65 + samples.length)));
    }
  
    return samples.slice(0, 4).map((sample, index) => ({
      ...sample,
      id: String.fromCharCode(65 + index)
    }));
  }

  private validateQuarter(quarter: Quarter): boolean {
    if (!quarter.id || !quarter.name) {
      console.warn('Quarter missing required fields:', quarter);
      return false;
    }

    if (!quarter.startDate || !quarter.endDate) {
      console.warn('Quarter missing date fields:', quarter);
      return false;
    }

    if (!Array.isArray(quarter.samples)) {
      console.warn('Quarter samples not in correct format:', quarter);
      return false;
    }

    // Validate each sample
    const invalidSamples = quarter.samples.filter(sample =>
      !sample.id ||
      typeof sample.age !== 'number' ||
      typeof sample.proof !== 'number' ||
      !sample.mashbill
    );

    if (invalidSamples.length > 0) {
      console.warn('Quarter contains invalid samples:', invalidSamples);
      return false;
    }

    return true;
  }

  private createDefaultSample(id: string): WhiskeySample {
    return {
      id,
      name: `Sample ${id}`,
      age: 0,
      proof: 0,
      mashbill: MASHBILL_TYPES.BOURBON,
      mashbillComposition: {
        corn: 51,
        rye: 0,
        wheat: 0,
        barley: 0
      },
      rating: 0,
      hints: [],
      distillery: 'Unknown',
      description: '',
      notes: [],
      type: 'bourbon',
      region: 'unknown',
      imageUrl: '',
      price: 0,
      difficulty: 'beginner',
      score: 0,
      challengeQuestions: [],
      image: ''
    };
  }

  private createDefaultSamples(): WhiskeySample[] {
    return ['A', 'B', 'C', 'D'].map(id => this.createDefaultSample(id));
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
export const quarterService = QuarterService.getInstance();