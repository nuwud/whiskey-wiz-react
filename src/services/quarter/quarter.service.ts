import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  setDoc,
  orderBy,
  limit,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Quarter, WhiskeySample } from '../../types/game.types';
import { AnalyticsService } from '../analytics.service';
import { QuarterConverters } from './converters';
import { QuarterAnalyticsService } from './analytics.service';
import { QuarterServiceInterface, LeaderboardEntry } from './types';

export class QuarterService implements QuarterServiceInterface {
  private static instance: QuarterService;
  private quartersCollection = collection(db, 'quarters');
  private resultsCollection = collection(db, 'game_results');

  private constructor() {}

  public static getInstance(): QuarterService {
    if (!QuarterService.instance) {
      QuarterService.instance = new QuarterService();
    }
    return QuarterService.instance;
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
      AnalyticsService.trackEvent('quarter_fetch_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private async enrichQuarterWithSamples(quarterDoc: DocumentSnapshot): Promise<Quarter> {
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
      AnalyticsService.trackEvent('active_quarters_fetch_error', {
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
      AnalyticsService.trackEvent('game_config_fetch_error', {
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
      AnalyticsService.trackEvent('leaderboard_fetch_error', {
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

      AnalyticsService.trackEvent('quarter_updated', {
        quarterId,
        updatedFields: Object.keys(data)
      });
    } catch (error) {
      console.error('Failed to update quarter:', error);
      AnalyticsService.trackEvent('quarter_update_error', {
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
      };

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
  
      AnalyticsService.trackEvent('quarter_created', {
        quarterId: docRef.id,
        sampleCount: data.samples?.length || 0
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to create quarter:', error);
      AnalyticsService.trackEvent('quarter_creation_error', {
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

      AnalyticsService.trackEvent('quarters_fetched', {
        totalCount: validQuarters.length,
        failedCount: quarters.length - validQuarters.length
      });

      return validQuarters;
    } catch (error) {
      console.error('Failed to fetch quarters:', error);
      AnalyticsService.trackEvent('quarters_fetch_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async getQuarterById(quarterId: string): Promise<Quarter | null> {
    try {
      if (!quarterId) throw new Error("Quarter ID is required");
  
      const quarterRef = doc(this.quartersCollection, quarterId);
      const quarterSnap = await getDoc(quarterRef);
      
      if (!quarterSnap.exists()) {
        console.warn(`No quarter found with ID: ${quarterId}`);
        return null;
      }
  
      const quarter = await this.enrichQuarterWithSamples(quarterSnap);
      
      AnalyticsService.trackEvent('quarter_fetched', {
        quarterId,
        sampleCount: quarter.samples.length
      });

      return quarter;
    } catch (error) {
      console.error(`Error fetching quarter ${quarterId}:`, error);
      AnalyticsService.trackEvent('quarter_fetch_error', {
        quarterId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  async getQuarterAnalytics(quarterId: string) {
    return QuarterAnalyticsService.getInstance().getQuarterAnalytics(quarterId);
  }

  async getQuarterStats(quarterId: string) {
    return QuarterAnalyticsService.getInstance().getQuarterStats(quarterId);
  }

  async getDailyStats(quarterId: string) {
    return QuarterAnalyticsService.getInstance().getDailyStats(quarterId);
  }

  async validateQuarter(data: Partial<Quarter>): Promise<string[]> {
    const errors: string[] = [];
    if (!data.name) errors.push('Name is required');
    if (!data.startDate) errors.push('Start date is required');
    if (!data.endDate) errors.push('End date is required');
    if (!data.isActive) errors.push('Active status is required');
    return errors;
  }
}

export const quarterService = QuarterService.getInstance();