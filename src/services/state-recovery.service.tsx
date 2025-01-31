import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AnalyticsService } from '../services/analytics.service';

export interface GameStateRecovery {
  userId: string;
  quarterId: string;
  lastSavedState: any;
  timestamp: Date;
  recoveryAttempts: number;
}

export class StateRecoveryService {
  private recoveryCollection = 'state_recovery';

  async savePartialState(userId: string, quarterId: string, partialState: any): Promise<void> {
    try {
      const recoveryRef = doc(db, this.recoveryCollection, userId);

      await setDoc(recoveryRef, {
        userId,
        quarterId,
        lastSavedState: partialState,
        timestamp: new Date(),
        recoveryAttempts: 0
      }, { merge: true });

      AnalyticsService.trackUserEngagement('state_partially_saved', {
        userId,
        quarterId
      });
    } catch (error) {
      console.error('Failed to save partial state', error);
    }
  }

  async recoverGameState(userId: string): Promise<GameStateRecovery | null> {
    try {
      const recoveryRef = doc(db, this.recoveryCollection, userId);
      const recoveryDoc = await getDoc(recoveryRef);

      if (!recoveryDoc.exists()) return null;

      const recoveryData = recoveryDoc.data() as GameStateRecovery;

      // Check if state is recent (within last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      if (recoveryData.timestamp < twentyFourHoursAgo) {
        // Delete stale recovery state
        await deleteDoc(recoveryRef);
        return null;
      }

      // Increment recovery attempts
      await updateDoc(recoveryRef, {
        recoveryAttempts: (recoveryData.recoveryAttempts || 0) + 1
      });

      AnalyticsService.trackUserEngagement('state_recovery_attempted', {
        userId,
        quarterId: recoveryData.quarterId,
        recoveryAttempts: recoveryData.recoveryAttempts + 1
      });

      return recoveryData;
    } catch (error) {
      console.error('Failed to recover game state', error);
      return null;
    }
  }

  async clearRecoveryState(userId: string): Promise<void> {
    try {
      const recoveryRef = doc(db, this.recoveryCollection, userId);
      await deleteDoc(recoveryRef);

      AnalyticsService.trackUserEngagement('state_recovery_cleared', { userId });
    } catch (error) {
      console.error('Failed to clear recovery state', error);
    }
  }
}