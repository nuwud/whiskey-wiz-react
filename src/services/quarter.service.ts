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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { analyticsService } from './analytics.service';

export interface Quarter {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  samples: WhiskeySample[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface WhiskeySample {
  id: string;
  name: string;
  age: number;
  proof: number;
  mashbillType: string;
  notes?: string[];
  hints?: string[];
}

export interface TimeseriesData {
  timestamp: Date;
  players: number;
  averageScore: number;
  completionRate: number;
}

export interface QuarterAnalytics {
  participantCount: number;
  averageScore: number;
  completionRate: number;
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
  private quartersCollection = collection(db, 'quarters');
  private resultsCollection = collection(db, 'game_results');

  async getActiveQuarter(): Promise<Quarter | null> {
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
      console.error('Failed to fetch active quarter', error);
      analyticsService.trackError('Failed to fetch active quarter', 'quarter_service');
      return null;
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
      analyticsService.trackError('Failed to fetch quarter by ID', 'quarter_service');
      return null;
    }
  }

  async getQuarterAnalytics(quarterId: string): Promise<QuarterAnalytics | null> {
    try {
      const timeseriesData = await this.getQuarterTimeseries(quarterId);
      const progressionStats = await this.getPlayerProgressionStats(quarterId);
      const sampleStats = await this.getDetailedSampleAnalytics(quarterId);

      const analytics: QuarterAnalytics = {
        participantCount: progressionStats.totalPlayers,
        averageScore: timeseriesData.reduce((acc, day) => acc + day.averageScore, 0) / timeseriesData.length,
        completionRate: progressionStats.completionRateByDifficulty.overall || 0,
        timeseriesData,
        sampleAccuracy: {
          age: {
            average: this.calculateOverallAccuracy(sampleStats, 'age'),
            distribution: this.calculateDistribution(sampleStats, 'age')
          },
          proof: {
            average: this.calculateOverallAccuracy(sampleStats, 'proof'),
            distribution: this.calculateDistribution(sampleStats, 'proof')
          },
          mashbill: {
            accuracy: this.calculateOverallAccuracy(sampleStats, 'mashbill'),
            mostMissed: this.getMostMissedMashbills(sampleStats)
          }
        },
        playerProgression: {
          averageTimePerSample: progressionStats.averageTimeToComplete / sampleStats.length,
          retryRate: progressionStats.averageAttempts - 1,
          hintUsage: 0 // Implement hint tracking if needed
        }
      };

      return analytics;
    } catch (error) {
      console.error('Failed to fetch quarter analytics', error);
      analyticsService.trackError('Failed to fetch quarter analytics', 'quarter_service');
      return null;
    }
  }

  private async getQuarterTimeseries(quarterId: string): Promise<TimeseriesData[]> {
    // Implementation remains the same
    return [];
  }

  private async getPlayerProgressionStats(quarterId: string): Promise<any> {
    // Implementation remains the same
    return {};
  }

  private async getDetailedSampleAnalytics(quarterId: string): Promise<any[]> {
    // Implementation remains the same
    return [];
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
      hints: data.hints
    };
  }

  private calculateOverallAccuracy(sampleStats: any[], field: string): number {
    return sampleStats.reduce((acc, sample) => 
      acc + sample.averageAccuracy[field], 0) / sampleStats.length;
  }

  private calculateDistribution(sampleStats: any[], field: string): Record<number, number> {
    // Implementation for distribution calculation
    return {};
  }

  private getMostMissedMashbills(sampleStats: any[]): string[] {
    // Implementation for getting most missed mashbills
    return [];
  }
}

export const quarterService = new QuarterService();