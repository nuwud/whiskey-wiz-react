import { db, auth } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { ExtendedUser, UserRole, UserType } from '../types/auth.types';
import { signInAnonymously as firebaseSignInAnonymously } from 'firebase/auth';

export class FirebaseService {
  // Authentication methods
  static async signUp(email: string, password: string): Promise<ExtendedUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.createUserDocument(userCredential.user.uid, {
        email,
        role: UserRole.PLAYER,
        type: UserType.REGISTERED,
        createdAt: new Date()
      });
      await sendEmailVerification(userCredential.user);
      return {
        ...userCredential.user,
        role: UserRole.PLAYER,
        type: UserType.REGISTERED
      } as ExtendedUser;
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  }

  static async signIn(email: string, password: string): Promise<ExtendedUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await this.getUserDocument(userCredential.user.uid);
      return {
        ...userCredential.user,
        role: userDoc?.role || UserRole.PLAYER,
        type: userDoc?.type || UserType.REGISTERED
      } as ExtendedUser;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  static async signInAnonymously(): Promise<ExtendedUser> {
    try {
      const userCredential = await firebaseSignInAnonymously(auth);
      const guestUser: ExtendedUser = {
        ...userCredential.user,
        userId: userCredential.user.uid,
        role: UserRole.GUEST,
        type: UserType.GUEST,
        registrationType: UserType.GUEST,
        guest: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        displayName: 'Guest',
        email: null,
        photoURL: null,
        metrics: {
          gamesPlayed: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          badges: [],
          achievements: [],
          lastVisit: new Date(),
          visitCount: 0
        },
        preferences: {
          favoriteWhiskeys: [],
          preferredDifficulty: "beginner",
          notifications: false
        }
      };
      await this.createUserDocument(userCredential.user.uid, {
        role: UserRole.GUEST,
        type: UserType.GUEST,
        createdAt: new Date()
      });
      return guestUser;
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      throw error;
    }
  }

  static async updateUserProfile(user: User, displayName: string): Promise<void> {
    try {
      await updateProfile(user, { displayName });
      await this.updateUserDocument(user.uid, { displayName });
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }
  
  static async submitScore(userId: string, quarterId: string, score: number): Promise<void> {
    try {
      await addDoc(collection(db, 'scores'), {
        userId,
        quarterId,
        score,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error submitting score:', error);
      throw error;
    }
  }

  static async createUserDocument(uid: string, data: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), data);
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  static async getUserDocument(uid: string): Promise<any> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.data();
    } catch (error) {
      console.error('Error getting user document:', error);
      throw error;
    }
  }

  static async updateUserDocument(uid: string, data: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), data);
    } catch (error) {
      console.error('Error updating user document:', error);
      throw error;
    }
  }

  static async getQuarterData(quarterId: string) {
    // Implement the logic to fetch quarter data from Firebase
    const quarterRef = doc(db, 'quarters', quarterId);
    const quarterSnap = await getDoc(quarterRef);
    return quarterSnap.exists() ? quarterSnap.data() : null;
  }
}