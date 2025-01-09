import { db, auth } from '../firebaseConfig';
import { collection, doc, setDoc, updateDoc, getDoc, addDoc, query, where, getDocs } from 'firebase/firestore';
import { AnalyticsService } from './AnalyticsService';

export interface PlayerProfile {
  userId: string;
  email?: string;
  displayName?: string;
  totalQuartersPlayed: number;
  lifetimeScore: number;
  quarterPerformance: Record<string, QuarterPerformance>;
  registrationType: 'guest' | 'email' | 'gmail' | 'shopify';
  geographicData?: {
    country?: string;
    region?: string;
  };
  preferences?: {
    favoriteWhiskeyTypes?: string[];
    preferredChallengeDifficulty?: 'easy' | 'medium' | 'hard';
  };
}

export interface QuarterPerformance {
  quarterId: string;
  quarterName: string;
  totalScore: number;
  samplesAttempted: number;
  accuracyPercentage: number;
  timestamp: Date;
}

export interface SampleAttempt {
  sampleId: string;
  quarterId: string;
  userId: string;
  score: number;
  guesses: {
    age: { guess: number; accuracy: number },
    proof: { guess: number; accuracy: number },
    mashbillType: { guess: string; correct: boolean }
  };
  timestamp: Date;
}

export class PlayerTrackingService {
  private playerProfileCollection = collection(db, 'player_profiles');
  private sampleAttemptsCollection = collection(db, 'sample_attempts');

  async createOrUpdatePlayerProfile(profileData: Partial<PlayerProfile>): Promise<PlayerProfile> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No authenticated user');

    try {
      const profileRef = doc(this.playerProfileCollection, currentUser.uid);
      
      // Fetch existing profile
      const existingProfile = await getDoc(profileRef);
      
      const updatedProfile: PlayerProfile = existingProfile.exists() 
        ? { 
            ...existingProfile.data() as PlayerProfile,
            ...profileData 
          }
        : {
            userId: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || '',
            totalQuartersPlayed: 0,
            lifetimeScore: 0,
            quarterPerformance: {},
            registrationType: 'email',
            ...profileData
          };

      // Update profile
      await setDoc(profileRef, updatedProfile, { merge: true });

      // Track profile update
      AnalyticsService.trackUserEngagement('player_profile_updated', {
        userId: currentUser.uid,
        registrationType: updatedProfile.registrationType
      });

      return updatedProfile;
    } catch (error) {
      console.error('Failed to create/update player profile', error);
      throw error;
    }
  }

  async recordSampleAttempt(attempt: SampleAttempt): Promise<void> {
    try {
      await addDoc(this.sampleAttemptsCollection, attempt);

      // Update player profile with performance
      const profileRef = doc(this.playerProfileCollection, attempt.userId);
      await updateDoc(profileRef, {
        [`quarterPerformance.${attempt.quarterId}`]: {
          quarterId: attempt.quarterId,
          totalScore: attempt.score,
          samplesAttempted: 1,
          accuracyPercentage: this.calculateAccuracy(attempt),
          timestamp: new Date()
        }
      });

      AnalyticsService.trackUserEngagement('sample_attempt_recorded', {
        quarterId: attempt.quarterId,
        score: attempt.score
      });
    } catch (error) {
      console.error('Failed to record sample attempt', error);
      throw error;
    }
  }

  private calculateAccuracy(attempt: SampleAttempt): number {
    const { age, proof, mashbillType } = attempt.guesses;
    
    const ageAccuracy = 100 - Math.abs(age.accuracy);
    const proofAccuracy = 100 - Math.abs(proof.accuracy);
    const mashbillAccuracy = mashbillType.correct ? 100 : 0;

    return (ageAccuracy + proofAccuracy + mashbillAccuracy) / 3;
  }

  async getPlayerPerformanceByQuarter(quarterId: string): Promise<PlayerProfile[]> {
    try {
      const q = query(
        this.playerProfileCollection,
        where(`quarterPerformance.${quarterId}`, '!=', null)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as PlayerProfile);
    } catch (error) {
      console.error('Failed to fetch quarter performance', error);
      return [];
    }
  }
}