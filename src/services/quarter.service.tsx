import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  DocumentData,
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { analyticsService } from './analytics.service';
import { Quarter, WhiskeySample, QuarterAnalytics, TimeseriesData } from '@/types/game.types';

class QuarterService {
  private quartersCollection = collection(db, 'quarters');
  private resultsCollection = collection(db, 'game_results');

  // Renamed from getActiveQuarter to getCurrentQuarter for consistency
  async getCurrentQuarter(): Promise<Quarter | null> {
    try {
      const q = query(
        this.quartersCollection,
        where('isActive', '==', true),
        orderBy('startDate', 'desc'),
        where('endDate', '>', Timestamp.now())
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const quarterDoc = snapshot.docs[0];
      return this.convertToQuarter(quarterDoc.data(), quarterDoc.id);
    } catch (error) {
      console.error('Failed to fetch current quarter', error);
      analyticsService.trackError('Failed to fetch current quarter', 'quarter_service');
      return null;
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
      analyticsService.trackError('Failed to fetch game configuration', 'quarter_service');
      return null;
    }
  }

  async getQuarterLeaderboard(quarterId: string, top: number = 10) {
    try {
      const q = query(
        collection(db, 'game_results'),
        where('quarterId', '==', quarterId),
        orderBy('score', 'desc'),
        limit(top)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
    } catch (error) {
      console.error('Failed to fetch quarter leaderboard', error);
      analyticsService.trackError('Failed to fetch quarter leaderboard', 'quarter_service');
      return [];
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
      analyticsService.trackError('Failed to fetch all quarters', 'quarter_service');
      return [];
    }
  }

  private async getQuarterTimeseries(quarterId: string): Promise<TimeseriesData[]> {
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
      analyticsService.trackError('Failed to fetch quarter timeseries', 'quarter_service');
      return [];
    }
  }

  private async getPlayerProgressionStats(quarterId: string) {
    try {
      const q = query(this.resultsCollection, where('quarterId', '==', quarterId));
      const snapshot = await getDocs(q);
      
      const stats = {
        totalPlayers: snapshot.size,
        averageTimeToComplete: 0,
        averageAttempts: 0,
        completionRateByDifficulty: {
          beginner: 0,
          intermediate: 0,
          advanced: 0,
          overall: 0
        }
      };

      let totalTime = 0;
      let totalAttempts = 0;
      let completedGames = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalTime += data.timeSpent || 0;
        totalAttempts += data.attempts || 1;
        if (data.completed) completedGames++;
      });

      stats.averageTimeToComplete = totalTime / snapshot.size;
      stats.averageAttempts = totalAttempts / snapshot.size;
      stats.completionRateByDifficulty.overall = completedGames / snapshot.size;

      return stats;
    } catch (error) {
      console.error('Failed to fetch player progression stats', error);
      analyticsService.trackError('Failed to fetch player progression stats', 'quarter_service');
      return null;
    }
  }

  private async getDetailedSampleAnalytics(quarterId: string) {
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
          averageAccuracy: accuracyStats
        };
      });
    } catch (error) {
      console.error('Failed to fetch detailed sample analytics', error);
      analyticsService.trackError('Failed to fetch detailed sample analytics', 'quarter_service');
      return [];
    }
  }

  private calculateSampleAccuracyStats(results: any[], sample: WhiskeySample) {
    const totalResults = results.length;
    if (totalResults === 0) return { age: 0, proof: 0, mashbill: 0 };

    return {
      age: results.reduce((acc, result) => 
        acc + (result.age === sample.age ? 1 : 0), 0) / totalResults,
      proof: results.reduce((acc, result) => 
        acc + (result.proof === sample.proof ? 1 : 0), 0) / totalResults,
      mashbill: results.reduce((acc, result) => 
        acc + (result.mashbillType === sample.mashbillType ? 1 : 0), 0) / totalResults
    };
  }

  private convertToQuarter(data: DocumentData, id: string): Quarter {
    return {
      id,
      name: data.name,
      description: data.description,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      isActive: data.isActive,
      samples: data.samples.map(this.convertToWhiskeySample),
      difficulty: data.difficulty
    };
  }

  private convertToWhiskeySample(data: DocumentData): WhiskeySample {
    return {
      id: data.id,
      name: data.name,
      age: data.age,
      proof: data.proof,
      mashbillType: data.mashbillType,
      notes: data.notes,
      hints: data.hints,
      distillery: data.distillery || 'Unknown' // Added distillery field with default
    };
  }
}

export const quarterService = new QuarterService();