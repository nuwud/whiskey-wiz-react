import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc, setDoc, orderBy, limit, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Quarter, QuarterAnalytics } from '../../types/game.types';
import { QuarterConverters } from './converters';
import { QuarterAnalyticsService } from './analytics.service';
import { analyticsService as AnalyticsService } from '../analytics.service'
import { QuarterServiceInterface, LeaderboardEntry } from './types';

class QuarterService implements QuarterServiceInterface {
  private static instance: QuarterService;
  private quartersCollection = collection(db, 'quarters');
  private resultsCollection = collection(db, 'game_results');

  private constructor() {}
  async getQuarterAnalytics(quarterId: string): Promise<QuarterAnalytics | null> {
    try {
      const progressionStats = await this.getPlayerProgressionStats(quarterId);
      if (!progressionStats) return null;
  
      const sampleAnalytics = await this.getDetailedSampleAnalytics(quarterId);
      const resultsSnapshot = await getDocs(query(this.resultsCollection, where('quarterId', '==', quarterId)));
      const timeSpentData = await this.calculateTimeSpentMetrics(quarterId);
      
      return {
        totalScore: progressionStats.bestScore,
        totalCompleted: progressionStats.totalChallengesCompleted,
        totalHintsUsed: progressionStats.hintsUsed,
        totalChallenges: timeSpentData.totalChallenges,
        playerStats: {
          totalGames: progressionStats.totalGames,
          averageScore: progressionStats.averageScore,
          bestScore: progressionStats.bestScore,
          totalChallengesCompleted: progressionStats.totalChallengesCompleted,
          correctAnswers: progressionStats.correctAnswers,
          hintsUsed: progressionStats.hintsUsed,
          totalSamples: progressionStats.totalSamples,
          perfectScores: progressionStats.perfectScores,
          lastPlayed: progressionStats.lastPlayed,
          quarterHistory: progressionStats.quarterHistory || [],
          totalScore: progressionStats.bestScore,
          recentResults: [],
          bestQuarterScore: progressionStats.bestScore,
          totalQuartersCompleted: 0,
          averageScorePerQuarter: progressionStats.averageScore
        },
        totalPlayers: resultsSnapshot.size,
        totalGames: resultsSnapshot.size,
        averageScore: progressionStats.averageScore,
        completionRate: (progressionStats.totalChallengesCompleted / resultsSnapshot.size) * 100,
        totalChallengesCompleted: progressionStats.totalChallengesCompleted,
        bestScore: progressionStats.bestScore,
        correctAnswers: progressionStats.correctAnswers,
        hintsUsed: progressionStats.hintsUsed,
        favoriteWhiskey: undefined,
        totalSamples: progressionStats.totalSamples,
        perfectScores: progressionStats.perfectScores,
        lastPlayed: progressionStats.lastPlayed,
        difficultyBreakdown: progressionStats.difficultyBreakdown,
        quarterHistory: progressionStats.quarterHistory || [],
        completionTime: {
          min: 0,
          max: timeSpentData.totalTimeSpent,
          average: timeSpentData.avgTimePerGame
        },
        playerRetention: {
          totalPlayers: resultsSnapshot.size,
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
          totalChallenges: timeSpentData.totalChallenges,
          totalCorrect: progressionStats.correctAnswers,
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
          averageTimeToComplete: timeSpentData.avgTimePerGame,
          completionRateByDifficulty: {
            beginner: 0,
            intermediate: 0,
            advanced: 0,
            overall: 0
          },
          averageCompletionRate: 0
        },
        playerFeedback: [],
        difficultyDistribution: progressionStats.difficultyBreakdown,
        averageCompletionRate: 0,
        dailyStats: [],
        weeklyStats: [],
        monthlyStats: [],
        yearlyStats: [],
        quarterlyStats: [],
        playerActivity: [],
        gameStats: {
          totalGamesPlayed: resultsSnapshot.size,
          uniquePlayers: resultsSnapshot.size,
          averagePlaytime: timeSpentData.avgTimePerGame,
          completionRate: 0
        },
        challengeStats: {
          totalAttempted: timeSpentData.totalChallenges,
          totalCompleted: progressionStats.totalChallengesCompleted,
          averageTimePerChallenge: timeSpentData.avgTimePerChallenge,
          successRate: 0
        },
        rewardStats: {
          totalRewarded: 0,
          rewardTypes: {},
          claimRate: 0
        },
        sessionStats: {
          averageLength: timeSpentData.avgTimePerGame,
          totalSessions: resultsSnapshot.size,
          bounceRate: 0,
          returnRate: 0
        },
        quarterPerformance: [],
        playerDemographics: {
          authMethodBreakdown: {},
          ageBreakdown: {},
          regionDistribution: {},
          countryDistribution: {}
        },
        playerEngagement: {
          totalTimeSpent: timeSpentData.totalTimeSpent,
          averageTimeSpentPerGame: timeSpentData.avgTimePerGame,
          totalHintsUsed: progressionStats.hintsUsed,
          averageHintsUsedPerGame: progressionStats.hintsUsed / progressionStats.totalGames,
          averageHintsUsedPerPlayer: progressionStats.hintsUsed / resultsSnapshot.size,
          averageHintsUsedPerChallenge: progressionStats.hintsUsed / timeSpentData.totalChallenges
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
          totalChallengesCompleted: progressionStats.totalChallengesCompleted,
          totalScore: progressionStats.bestScore,
          totalSamples: progressionStats.totalSamples,
          perfectScores: progressionStats.perfectScores,
          lastPlayed: progressionStats.lastPlayed,
          totalGames: progressionStats.totalGames
        },
        playerLeaderboard: {
          global: [],
          quarterly: []
        },
        engagement: {
          dailyActive: 0,
          monthlyActive: 0,
          totalTimeSpent: timeSpentData.totalTimeSpent,
          averageTimeSpentPerGame: timeSpentData.avgTimePerGame
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
        sampleAnalytics: sampleAnalytics.map(sample => ({
          ...sample,
          machineLearningSuggestions: {
            recommendedActions: [],
            confidenceScores: {},
            recommendedMerchandise: [],
            potentialSubscriptionTargets: [],
            marketingSegments: [],
            nextSample: [],
            improvementTips: []
          }
        })),
        hintUsageStats: {
          totalHintsUsed: progressionStats.hintsUsed,
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
          
    } catch (error) {
      console.error('❌ Failed to fetch quarter analytics', error);
      return null;
    }
  }

  public static getInstance(): QuarterService {
    if (!QuarterService.instance) {
      QuarterService.instance = new QuarterService();
    }
    return QuarterService.instance;
  }

  static trackEvent(eventName: string, data: Record<string, any>): void {
    AnalyticsService.trackEvent(eventName, data);
    AnalyticsService.trackEvent(eventName, data);
  }

  async getCurrentQuarter(): Promise<Quarter | null> {
    try {
      const q = query(
        this.quartersCollection,
        where('isActive', '==', true),
        orderBy('startDate', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.warn('No active quarter found');
        return null;
      }

      const quarterDoc = snapshot.docs[0];
      const quarter = await this.enrichQuarterWithSamples(quarterDoc);
      return quarter;
    } catch (error) {
      console.error('Failed to fetch current quarter:', error);
      QuarterAnalyticsService.trackEvent('quarter_fetch_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  async enrichQuarterWithSamples(quarterDoc: DocumentSnapshot): Promise<Quarter> {
    const quarterData = quarterDoc.data();
    if (!quarterData) throw new Error('Quarter document exists but has no data');

    const samplesSnapshot = await getDocs(collection(db, `quarters/${quarterDoc.id}/samples`));
    const samples = samplesSnapshot.docs.map(sampleDoc => ({
      id: sampleDoc.id,
      ...sampleDoc.data()
    }));

    return QuarterConverters.convertToQuarter({
      ...quarterData,
      samples
    }, quarterDoc.id);
  }

  async getActiveQuarters(): Promise<Quarter[]> {
    try {
      const q = query(
        this.quartersCollection,
        where('isActive', '==', true),
        orderBy('startDate', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const quarters = await Promise.all(
        snapshot.docs.map(doc => this.enrichQuarterWithSamples(doc))
      );

      return quarters;
    } catch (error) {
      console.error('Failed to fetch active quarters:', error);
      QuarterAnalyticsService.trackEvent('active_quarters_fetch_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async getGameConfiguration(quarterId: string): Promise<Quarter | null> {
    try {
      if (!quarterId) throw new Error('Quarter ID is required');
      
      const quarterDoc = await getDoc(doc(this.quartersCollection, quarterId));
      if (!quarterDoc.exists()) {
        console.warn(`No quarter found with ID: ${quarterId}`);
        return null;
      }

      return this.enrichQuarterWithSamples(quarterDoc);
    } catch (error) {
      console.error('Failed to fetch game configuration:', error);
      QuarterAnalyticsService.trackEvent('game_config_fetch_error', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  async getQuarterLeaderboard(quarterId: string, top: number = 10): Promise<LeaderboardEntry[]> {
    try {
      if (!quarterId) throw new Error('Quarter ID is required');
      
      const q = query(
        this.resultsCollection,
        where('quarterId', '==', quarterId),
        orderBy('score', 'desc'),
        limit(top)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          username: data.displayName || 'Anonymous',
          displayName: data.displayName || 'Anonymous',
          totalScore: data.score || 0,
          quarterId: data.quarterId,
          timestamp: data.completedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate() || new Date(),
          totalChallengesCompleted: data.totalChallengesCompleted || 0,
          accuracy: {
            age: data.accuracy?.age || 0,
            proof: data.accuracy?.proof || 0,
            mashbill: data.accuracy?.mashbill || 0
          },
          score: data.score || 0,
          hintUsageStats: data.hintUsageStats || {},
          timeseriesData: [],
          leaderboard: [],
          samplingAccuracy: data.samplingAccuracy || {},
          imageUrl: data.imageUrl || '',
          image: data.image || '',
          challengeQuestions: Array.isArray(data.challengeQuestions) ? data.challengeQuestions : []
        };
      });
    } catch (error) {
      console.error('Failed to fetch quarter leaderboard:', error);
      QuarterAnalyticsService.trackEvent('leaderboard_fetch_error', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async updateQuarter(quarterId: string, data: Partial<Quarter>): Promise<void> {
    const validationErrors = await this.validateQuarter(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    try {
      if (!quarterId) throw new Error('Quarter ID is required');

      const quarterRef = doc(this.quartersCollection, quarterId);
      const samplesRef = collection(db, `quarters/${quarterId}/samples`);
  
      // First update the main quarter document
      await updateDoc(quarterRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
  
      // Then update samples if provided
      if (data.samples && Array.isArray(data.samples)) {
        await Promise.all(data.samples.map(sample => {
          const sampleRef = doc(samplesRef, sample.id);
          return setDoc(sampleRef, QuarterConverters.convertToWhiskeySample(sample), { merge: true });
        }));
      }

      QuarterAnalyticsService.trackEvent('quarter_updated', {
        quarterId,
        updatedFields: Object.keys(data)
      });
    } catch (error) {
      console.error('Failed to update quarter:', error);
      QuarterAnalyticsService.trackEvent('quarter_update_error', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error; // Re-throw to allow caller to handle
    }
  }

  async createQuarter(data: Omit<Quarter, 'id'>): Promise<string> {
    const validationErrors = await this.validateQuarter(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    try {
      const quarterData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Create the main quarter document
      const docRef = await addDoc(this.quartersCollection, quarterData);
  
      // If samples are provided, create them in the subcollection
      if (data.samples && Array.isArray(data.samples)) {
        const samplesCollectionRef = collection(db, `quarters/${docRef.id}/samples`);
        await Promise.all(data.samples.map(sample => 
          setDoc(
            doc(samplesCollectionRef, sample.id), 
            QuarterConverters.convertToWhiskeySample(sample)
          )
        ));
      }
  
      QuarterAnalyticsService.trackEvent('quarter_created', {
        quarterId: docRef.id,
        sampleCount: data.samples?.length || 0
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to create quarter:', error);
      QuarterAnalyticsService.trackEvent('quarter_creation_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getAllQuarters(): Promise<Quarter[]> {
    try {
      const quartersSnapshot = await getDocs(this.quartersCollection);
  
      const quarters = await Promise.all(
        quartersSnapshot.docs.map(async (doc) => {
          try {
            return await this.enrichQuarterWithSamples(doc);
          } catch (error) {
            console.error(`Failed to process quarter ${doc.id}:`, error);
            // Return null for failed quarters
            return null;
          }
        })
      );
  
      // Filter out any nulls from failed quarter processing
      const validQuarters = quarters.filter((q): q is Quarter => q !== null);

      QuarterAnalyticsService.trackEvent('quarters_fetched', {
        totalCount: validQuarters.length,
        failedCount: quarters.length - validQuarters.length
      });

      return validQuarters;
    } catch (error) {
      console.error('Failed to fetch quarters:', error);
      QuarterAnalyticsService.trackEvent('quarters_fetch_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async getQuarterById(quarterId: string) {
    try {
      // Check cache first
      const cachedData = localStorage.getItem(`quarter_${quarterId}`);
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch (e) {
          console.warn('Failed to parse cached quarter data');
        }
      }
  
      // Get quarter document with retry
      const quarterRef = doc(db, 'quarters', quarterId);
      let attempts = 0;
      let quarterSnap;
      
      while (attempts < 3) {
        try {
          quarterSnap = await getDoc(quarterRef);
          if (quarterSnap.exists()) break;
          attempts++;
        } catch (error) {
          if (attempts >= 2) throw error;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500 * attempts));
        }
      }
      
      if (!quarterSnap || !quarterSnap.exists()) {
        throw new Error('Quarter not found');
      }
  
      // Get samples with optimized query
      const samplesQuery = query(
        collection(db, 'samples'),
        where('quarterId', '==', quarterId)
      )
  
      const samplesSnap = await getDocs(samplesQuery);
      const samples = samplesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      // Structure and cache result
      const result = {
        ...quarterSnap.data(),
        id: quarterSnap.id,
        samples
      };
  
      try {
        localStorage.setItem(`quarter_${quarterId}`, JSON.stringify(result));
      } catch (e) {
        console.warn('Failed to cache quarter data');
      }
  
      return result;
    } catch (error) {
      console.error('Error fetching quarter:', error);
      // Check if cached data available as fallback
      const cachedData = localStorage.getItem(`quarter_${quarterId}`);
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch (e) {
          // If cache parsing fails, throw the original error
        }
      }
      throw error;
    }
  };

  async getQuarterAnalyticsService(quarterId: string): Promise<QuarterAnalytics | null> {
    try {
      const progressionStats = await this.getPlayerProgressionStats(quarterId);
      if (!progressionStats) return null;
  
      const sampleAnalytics = await this.getDetailedSampleAnalytics(quarterId);
      const resultsSnapshot = await getDocs(query(this.resultsCollection, where('quarterId', '==', quarterId)));
      const timeSpentData = await this.calculateTimeSpentMetrics(quarterId);
      
      return {
        totalPlayers: resultsSnapshot.size,
        totalGames: resultsSnapshot.size,
        averageScore: progressionStats.averageScore,
        completionRate: 0,
        totalChallengesCompleted: progressionStats.totalChallengesCompleted,
        bestScore: progressionStats.bestScore,
        correctAnswers: progressionStats.correctAnswers,
        hintsUsed: progressionStats.hintsUsed,
        favoriteWhiskey: undefined,
        totalSamples: progressionStats.totalSamples,
        perfectScores: progressionStats.perfectScores,
        lastPlayed: progressionStats.lastPlayed,
        difficultyBreakdown: progressionStats.difficultyBreakdown,
        totalScore: progressionStats.bestScore,
        totalCompleted: progressionStats.totalChallengesCompleted,
        totalHintsUsed: progressionStats.hintsUsed,
        totalChallenges: timeSpentData.totalChallenges,
        quarterHistory: progressionStats.quarterHistory || [],
        completionTime: {
          min: 0,
          max: timeSpentData.totalTimeSpent,
          average: timeSpentData.avgTimePerGame
        },
        playerRetention: {
          totalPlayers: resultsSnapshot.size,
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
          totalChallenges: timeSpentData.totalChallenges,
          totalCorrect: progressionStats.correctAnswers,
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
          averageTimeToComplete: timeSpentData.avgTimePerGame,
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
          totalGames: progressionStats.totalGames,
          averageScore: progressionStats.averageScore,
          bestScore: progressionStats.bestScore,
          totalChallengesCompleted: progressionStats.totalChallengesCompleted,
          correctAnswers: progressionStats.correctAnswers,
          hintsUsed: progressionStats.hintsUsed,
          totalSamples: progressionStats.totalSamples,
          perfectScores: progressionStats.perfectScores,
          lastPlayed: progressionStats.lastPlayed,
          quarterHistory: progressionStats.quarterHistory || [],
          totalScore: progressionStats.bestScore,
          recentResults: [],
          bestQuarterScore: progressionStats.bestScore,
          totalQuartersCompleted: 0,
          averageScorePerQuarter: progressionStats.averageScore
        },
        difficultyDistribution: progressionStats.difficultyBreakdown,
        averageCompletionRate: 0,
        dailyStats: [],
        weeklyStats: [],
        monthlyStats: [],
        yearlyStats: [],
        quarterlyStats: [],
        playerActivity: [],
        gameStats: {
          totalGamesPlayed: resultsSnapshot.size,
          uniquePlayers: resultsSnapshot.size,
          averagePlaytime: timeSpentData.avgTimePerGame,
          completionRate: 0
        },
        challengeStats: {
          totalAttempted: timeSpentData.totalChallenges,
          totalCompleted: progressionStats.totalChallengesCompleted,
          averageTimePerChallenge: timeSpentData.avgTimePerChallenge,
          successRate: 0
        },
        rewardStats: {
          totalRewarded: 0,
          rewardTypes: {},
          claimRate: 0
        },
        sessionStats: {
          averageLength: timeSpentData.avgTimePerGame,
          totalSessions: resultsSnapshot.size,
          bounceRate: 0,
          returnRate: 0
        },
        quarterPerformance: [],
        playerDemographics: {
          authMethodBreakdown: {},
          ageBreakdown: {},
          regionDistribution: {},
          countryDistribution: {}
        },
        playerEngagement: {
          totalTimeSpent: timeSpentData.totalTimeSpent,
          averageTimeSpentPerGame: timeSpentData.avgTimePerGame,
          totalHintsUsed: progressionStats.hintsUsed,
          averageHintsUsedPerGame: progressionStats.hintsUsed / progressionStats.totalGames,
          averageHintsUsedPerPlayer: progressionStats.hintsUsed / resultsSnapshot.size,
          averageHintsUsedPerChallenge: progressionStats.hintsUsed / timeSpentData.totalChallenges
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
          totalChallengesCompleted: progressionStats.totalChallengesCompleted,
          totalScore: progressionStats.bestScore,
          totalSamples: progressionStats.totalSamples,
          perfectScores: progressionStats.perfectScores,
          lastPlayed: progressionStats.lastPlayed,
          totalGames: progressionStats.totalGames
        },
        playerLeaderboard: {
          global: [],
          quarterly: []
        },
        engagement: {
          dailyActive: 0,
          monthlyActive: 0,
          totalTimeSpent: timeSpentData.totalTimeSpent,
          averageTimeSpentPerGame: timeSpentData.avgTimePerGame
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
        sampleAnalytics: sampleAnalytics.map(sample => ({
          ...sample,
          machineLearningSuggestions: {
            recommendedActions: [],
            confidenceScores: {},
            recommendedMerchandise: [],
            potentialSubscriptionTargets: [],
            marketingSegments: [],
            nextSample: [],
            improvementTips: []
          }
        })),
        hintUsageStats: {
          totalHintsUsed: progressionStats.hintsUsed,
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
          
    } catch (error) {
      console.error('❌ Failed to fetch quarter analytics', error);
      return null;
    }
  }

  async getQuarterStats(quarterId: string) {
    try {
      if (!quarterId) throw new Error('Quarter ID is required');
  
      const resultsQuery = query(
        this.resultsCollection,
        where('quarterId', '==', quarterId)
      );
      const snapshot = await getDocs(resultsQuery);
  
      const stats = {
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
        stats.topScore = Math.max(stats.topScore, data.score || 0);
        totalCompleted += data.completed ? 1 : 0;
        
        if (data.accuracy) {
          stats.sampleAccuracy.age += data.accuracy.age || 0;
          stats.sampleAccuracy.proof += data.accuracy.proof || 0;
          stats.sampleAccuracy.mashbill += data.accuracy.mashbill || 0;
        }
  
        if (data.difficulty) {
          stats.difficultyDistribution[data.difficulty as keyof typeof stats.difficultyDistribution]++;
        }
      });
  
      if (snapshot.size > 0) {
        stats.averageScore = totalScore / snapshot.size;
        stats.completionRate = (totalCompleted / snapshot.size) * 100;
        
        stats.sampleAccuracy.age /= snapshot.size;
        stats.sampleAccuracy.proof /= snapshot.size;
        stats.sampleAccuracy.mashbill /= snapshot.size;
      }
  
      return stats;
    } catch (error) {
      console.error('Failed to fetch quarter stats:', error);
      QuarterAnalyticsService.trackEvent('quarter_stats_error', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null
    }
  }

  async getDailyStats(quarterId: string) {
    try {
      if (!quarterId) throw new Error('Quarter ID is required');
  
      const q = query(
        this.resultsCollection,
        where('quarterId', '==', quarterId),
        orderBy('completedAt', 'asc')
      );
  
      const snapshot = await getDocs(q);
      const resultsByDay = new Map<string, {
        date: string;
        players: number;
        averageScore: number;
        completionRate: number;
      }>();
  
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = data.completedAt.toDate().toDateString();
  
        if (!resultsByDay.has(date)) {
          resultsByDay.set(date, {
            date,
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
      console.error('Failed to fetch daily stats:', error);
      AnalyticsService.trackEvent('daily_stats_error', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async validateQuarter(data: Partial<Quarter>): Promise<string[]> {
    const errors: string[] = [];
    if (!data.name) errors.push('Name is required');
    if (!data.startDate) errors.push('Start date is required');
    if (!data.endDate) errors.push('End date is required');
    if (!data.isActive) errors.push('Active status is required');
    return errors;
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
      return null;
    }
  }

  async getDetailedSampleAnalytics(quarterId: string) {
    try {
      const samplesQuery = query(
        collection(db, 'samples'),
        where('quarterId', '==', quarterId)
      );
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

        return {
          sampleId: sample.id,
          totalAttempts: sampleResults.length,
          averageAccuracy: {
            age: 0,
            proof: 0,
            mashbill: 0
          },
          performance: {
            totalCorrect: sampleResults.filter(result => result.sampleResults[sample.id]?.correct).length,
            accuracy: sampleResults.length > 0 ? 
              sampleResults.filter(result => result.sampleResults[sample.id]?.correct).length / sampleResults.length : 0
          }
        };
      });
    } catch (error) {
      console.error('Failed to fetch sample analytics:', error);
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
      return {
        totalTimeSpent: 0,
        avgTimePerGame: 0,
        avgTimePerChallenge: 0,
        totalGames: 0,
        totalChallenges: 0
      };
    }
  }

}

export const quarterService = QuarterService.getInstance();