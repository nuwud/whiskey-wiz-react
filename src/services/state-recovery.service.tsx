import { db } from '../config/firebase';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { debounce } from 'lodash';
import { addToRetryQueue } from '../utils/retry.utils';

interface SavedState {
  userId: string;
  quarterId: string;
  lastSavedState: any;
  timestamp: Date;
  version: number;
  lastModified: any;
}

export class StateRecoveryService {
  readonly COLLECTION = 'game_states';
  readonly DEBOUNCE_MS = 1000;
  version = 1;

  // Debounced save to prevent too frequent writes
  debouncedSave = debounce(async (userId: string, quarterId: string, state: any) => {
    try {
        // First get the current state
        const docRef = doc(db, this.COLLECTION, userId);
        const docSnap = await getDoc(docRef);
        const currentState = docSnap.exists() ? docSnap.data() : null;

        // Only update if our state is newer
        if (!currentState || 
            new Date(state.timestamp) > new Date(currentState.timestamp)) {
            
            const timestamp = new Date();
            const savedState: SavedState = {
                userId,
                quarterId,
                lastSavedState: state,
                timestamp,
                version: this.version,
                lastModified: serverTimestamp()
            };
            await setDoc(docRef, savedState, { merge: true });
            console.log('State saved successfully', { timestamp });
        }
    } catch (error) {
        console.error('Failed to save state:', error);
        addToRetryQueue(userId, quarterId, state);
    }
}, this.DEBOUNCE_MS);

  async savePartialState(
    userId: string,
    quarterId: string,
    partialState: any
  ): Promise<void> {
    return Promise.resolve(this.debouncedSave(userId, quarterId, partialState));
  }

  async getRecoveryState(userId: string) {
    try {
      const docRef = doc(db, this.COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Failed to get recovery state:', error);
      return null;
    }
  }

  async clearRecoveryState(userId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, userId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Failed to clear recovery state:', error);
    }
  }
}

export default StateRecoveryService;