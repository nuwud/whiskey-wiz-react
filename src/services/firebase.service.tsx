import { db, auth } from '../config/firebase';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { ExtendedUser, UserRole } from '../types/auth.types';
import { signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';


export const FirebaseService = {
  // Authentication methods
  async signIn(email: string, password: string): Promise<ExtendedUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await this.getUserDocument(userCredential.user.uid);
      return {
        ...userCredential.user,
        role: userDoc?.role || UserRole.USER
      } as ExtendedUser;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  },

  async signUp(email: string, password: string): Promise<ExtendedUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.createUserDocument(userCredential.user.uid, {
        email,
        role: UserRole.USER,
        createdAt: new Date()
      });
      await sendEmailVerification(userCredential.user);
      return {
        ...userCredential.user,
        role: UserRole.USER
      } as ExtendedUser;
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  },

  async signInAnonymously(): Promise<ExtendedUser> {
    try {
      const userCredential = await firebaseSignInAnonymously(auth);
      const guestUser: ExtendedUser = {
        ...userCredential.user,
        role: UserRole.GUEST
      };
      await this.createUserDocument(userCredential.user.uid, {
        role: UserRole.GUEST,
        createdAt: new Date()
      });
      return guestUser;
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      throw error;
    }
  },

  async updateUserProfile(user: User, displayName: string): Promise<void> {
    try {
      await updateProfile(user, { displayName });
      await this.updateUserDocument(user.uid, { displayName });
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  },

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  },

  // User document methods
  async createUserDocument(uid: string, data: any): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async updateUserDocument(uid: string, data: Partial<any>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  async getUserDocument(uid: string): Promise<any | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() : null;
  },

  // Game related methods
  async getQuarterData(quarterId: string) {
    try {
      const quarterRef = doc(db, 'quarters', quarterId);
      const quarterSnap = await getDoc(quarterRef);
      return quarterSnap.exists() ? quarterSnap.data() : null;
    } catch (error) {
      console.error('Error fetching quarter data:', error);
      throw error;
    }
  },

  async validateGuess(quarterId: string, guess: any) {
    try {
      const quarterData = await this.getQuarterData(quarterId);
      const points = await this.calculatePoints(quarterData, guess);
      return { points, correct: points > 0 };
    } catch (error) {
      console.error('Guess validation failed:', error);
      throw error;
    }
  },

  async calculatePoints(quarterData: any, guess: any): Promise<number> {
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
      console.error('Score submission failed:', error);
      throw error;
    }
  }
};