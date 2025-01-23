import { db, auth } from 'src/config/firebase';
import { collection, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  User,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';

export const FirebaseService = {
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in failed', error);
      throw error;
    }
  },

  async signUp(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Sign up failed', error);
      throw error;
    }
  },

  async updateUserProfile(user: User, displayName: string): Promise<void> {
    try {
      await updateProfile(user, { displayName });
    } catch (error) {
      console.error('Profile update failed', error);
      throw error;
    }
  },

  async getQuarterData(quarterId: string) {
    try {
      const quarterRef = doc(db, 'quarters', quarterId);
      const quarterSnap = await getDoc(quarterRef);
      return quarterSnap.exists() ? quarterSnap.data() : null;
    } catch (error) {
      console.error('Error fetching quarter data', error);
      throw error;
    }
  },

  async validateGuess(quarterId: string, guess: any) {
    try {
      const quarterData = await this.getQuarterData(quarterId);
      const points = this.calculatePoints(quarterData, guess);
      return { points, correct: points > 0 };
    } catch (error) {
      console.error('Guess validation failed', error);
      throw error;
    }
  },

  calculatePoints(quarterData: any, guess: any): number {
    let points = 0;
    if (Math.abs(quarterData.age - guess.age) <= 2) points += 25;
    if (Math.abs(quarterData.proof - guess.proof) <= 5) points += 25;
    if (quarterData.mashbillType === guess.mashbillType) points += 50;
    return points;
  },

  async submitScore(userId: string, quarterId: string, score: number) {
    try {
      const scoresRef = collection(db, 'scores');
      await addDoc(scoresRef, {
        userId,
        quarterId,
        score,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Score submission failed', error);
      throw error;
    }
  },

  async resetPassword(email: string): Promise<void> {
    try {
      await auth.sendPasswordResetEmail(email);
    } catch (error) {
      throw error;
    }
  }
};