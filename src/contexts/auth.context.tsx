import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, sendPasswordResetEmail, User } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { FirebaseService } from '../services/firebase.service';
import { AnalyticsService } from '../services/analytics.service';
import { PlayerProfile, UserType, UserRole } from '../types/auth.types';
import { Timestamp, getDoc, doc } from 'firebase/firestore';

interface AuthContextValue {
  user: PlayerProfile | null;
  firebaseUser: User | null;
  userId: string;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Add getUserProfile function
const getUserProfile = async (uid: string): Promise<PlayerProfile | null> => {
  try {
    if (!uid) {
      throw new Error('User ID is required');
    }

    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      console.warn(`Creating new profile for user: ${uid}`);
      
      const defaultProfile: PlayerProfile = {
        userId: uid,
        email: '',
        displayName: 'New Player',
        role: UserRole.PLAYER,
        type: UserType.REGISTERED,
        isAnonymous: false,
        guest: false,
        registrationType: UserType.REGISTERED,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        lastActive: new Date(),
        version: 1,
        totalGames: 0,
        averageScore: 0,
        winRate: 0,
        level: 1,
        experience: 0,
        lifetimeScore: 0,
        totalQuartersCompleted: 0,
        quarterPerformance: {},
        metrics: {
          gamesPlayed: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          badges: [],
          achievements: [],
          lastVisit: new Date(),
          visitCount: 1
        },
        preferences: {
          favoriteWhiskeys: [],
          preferredDifficulty: 'beginner',
          notifications: true
        },
        geographicData: null,
        statistics: {
          totalSamplesGuessed: 0,
          correctGuesses: 0,
          hintsUsed: 0,
          averageAccuracy: 0,
          bestScore: 0,
          worstScore: 0,
          lastUpdated: new Date()
        },
        achievements: []
      };

      await FirebaseService.createUserDocument(uid, defaultProfile);
      return defaultProfile;
    }

    const userData = userSnap.data();
    
    // Validate and convert timestamps
    return {
      ...userData,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
      lastLoginAt: userData.lastLoginAt?.toDate() || new Date(),
      lastActive: userData.lastActive?.toDate() || new Date(),
      role: userData.role || UserRole.PLAYER,
      type: userData.type || UserType.REGISTERED,
      metrics: {
        ...userData.metrics,
        lastVisit: userData.metrics?.lastVisit?.toDate() || new Date()
      },
      statistics: {
        ...userData.statistics,
        lastUpdated: userData.statistics?.lastUpdated?.toDate() || new Date()
      }
    } as PlayerProfile;

  } catch (error) {
    console.error('Error fetching user profile:', error);
    AnalyticsService.trackEvent('profile_fetch_failed', {
      userId: uid,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }): JSX.Element => {
  const [user, setUser] = useState<PlayerProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Compute isAuthenticated based on user existence
  const isAuthenticated = Boolean(user);

  const createPlayerProfile = (firebaseUser: User, userDoc: any): PlayerProfile => {
    const baseProfile: PlayerProfile = {
      userId: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Guest',
      role: userDoc?.role || UserRole.PLAYER,
      type: firebaseUser.isAnonymous ? UserType.GUEST : UserType.REGISTERED,
      isAnonymous: firebaseUser.isAnonymous,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      updatedAt: new Date(),
      lastActive: new Date(),
      lastLoginAt: new Date(),
      guest: firebaseUser.isAnonymous,
      registrationType: firebaseUser.isAnonymous ? UserType.GUEST : UserType.REGISTERED,
      version: 1,
      totalGames: userDoc?.totalGames || 0,
      averageScore: userDoc?.averageScore || 0,
      winRate: userDoc?.winRate || 0,
      level: userDoc?.level || 1,
      experience: userDoc?.experience || 0,
      lifetimeScore: userDoc?.lifetimeScore || 0,
      totalQuartersCompleted: userDoc?.totalQuartersCompleted || 0,
      quarterPerformance: userDoc?.quarterPerformance || {},
      metrics: {
        gamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        badges: [],
        achievements: [],
        lastVisit: new Date(),
        visitCount: 1,
        ...userDoc?.metrics
      },
      preferences: {
        favoriteWhiskeys: [],
        preferredDifficulty: 'beginner',
        notifications: true,
        ...userDoc?.preferences
      },
      geographicData: userDoc?.geographicData || null,
      statistics: {
        totalSamplesGuessed: 0,
        correctGuesses: 0,
        hintsUsed: 0,
        averageAccuracy: 0,
        bestScore: 0,
        worstScore: 0,
        lastUpdated: Timestamp.now(),
        ...userDoc?.statistics
      },
      achievements: userDoc?.achievements || []
    };
  
    return baseProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        let userData = await getUserProfile(fbUser.uid);
        
        if (!userData) {
          console.warn('No profile found, creating new one...');
          userData = {
            userId: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'New Player',
            role: UserRole.PLAYER,
            type: fbUser.isAnonymous ? UserType.GUEST : UserType.REGISTERED,
            guest: fbUser.isAnonymous,
            isAnonymous: fbUser.isAnonymous,
            registrationType: fbUser.isAnonymous ? UserType.GUEST : UserType.REGISTERED,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            lastActive: new Date(),
            version: 1,
            totalGames: 0,
            averageScore: 0,
            winRate: 0,
            level: 1,
            experience: 0,
            lifetimeScore: 0,
            totalQuartersCompleted: 0,
            quarterPerformance: {},
            metrics: { gamesPlayed: 0, totalScore: 0, averageScore: 0, bestScore: 0, badges: [], achievements: [], lastVisit: new Date(), visitCount: 1 },
            preferences: { favoriteWhiskeys: [], preferredDifficulty: 'beginner', notifications: true },
            geographicData: null,
            statistics: {
              totalSamplesGuessed: 0,
              correctGuesses: 0,
              hintsUsed: 0,
              averageAccuracy: 0,
              bestScore: 0,
              worstScore: 0,
              lastUpdated: new Date()
            },
            achievements: []
          };
          await FirebaseService.createUserDocument(fbUser.uid, userData);
        }
  
        setUser(userData);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  

  // In signIn function:
  const signIn = async (email: string, password: string) => {
    try {
      const firebaseUser = await FirebaseService.signIn(email, password);
      const userDoc = await FirebaseService.getUserDocument(firebaseUser.uid);
      const playerProfile = createPlayerProfile(firebaseUser, userDoc);
      setUser(playerProfile);
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  // In signUp function:
  const signUp = async (email: string, password: string) => {
    try {
      const firebaseUser = await FirebaseService.signUp(email, password);
      const userDoc = await FirebaseService.getUserDocument(firebaseUser.uid);
      const playerProfile = createPlayerProfile(firebaseUser, userDoc);
      setUser(playerProfile);
      AnalyticsService.userSignedUp({
        userId: playerProfile.userId,
        role: playerProfile.role
      });
    } catch (err) {
      console.error('Sign up error:', err);
      throw err;
    }
  };
  
  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const signInAsGuest = async () => {
    try {
      const { signInAnonymously } = await import('firebase/auth');
      const result = await signInAnonymously(auth);
      const guestProfile: PlayerProfile = {
        userId: result.user.uid,
        email: '',
        displayName: 'Guest',
        role: UserRole.PLAYER, // Using enum
        type: UserType.GUEST, // Using enum
        isAnonymous: true,
        guest: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        lastActive: new Date(),
        registrationType: UserType.GUEST,
        metrics: {
          gamesPlayed: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          badges: [],
          achievements: [],
          lastVisit: new Date(),
          visitCount: 1
        },
        preferences: {
          favoriteWhiskeys: [],
          preferredDifficulty: 'beginner',
          notifications: true
        },
        geographicData: { country: undefined, region: undefined },
        lifetimeScore: 0,
        totalQuartersCompleted: 0,
        quarterPerformance: {},
        statistics: {
          totalSamplesGuessed: 0,
          correctGuesses: 0,
          hintsUsed: 0,
          averageAccuracy: 0,
          bestScore: 0,
          worstScore: 0,
          lastUpdated: new Date()
        },
        achievements: []
      };
      
      setUser(guestProfile);
      AnalyticsService.userSignedIn({
        userId: guestProfile.userId,
        role: guestProfile.role,
        type: guestProfile.type ?? UserType.GUEST
      });
    } catch (err) {
      console.error('Guest sign in error:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/login',
        handleCodeInApp: true
      });
    } catch (err) {
      console.error('Password reset error:', err);
      const error = err as Error;
      throw new Error(error.message || 'Failed to send password reset email');
    }
  };

  const updateProfile = async (displayName: string) => {
    if (!user) return;
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No authenticated user found');
      await FirebaseService.updateUserProfile(currentUser, displayName);
      setUser(prev => prev ? { ...prev, displayName } : null);
    } catch (err) {
      console.error('Profile update error:', err);
      throw err;
    }
  };

  const value = {
    user,
    firebaseUser,
    userId: user?.userId || '',
    isAuthenticated,
    loading,
    error: null,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    signInAsGuest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

