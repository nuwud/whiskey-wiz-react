import React, { useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification as sendEmailVerificationAuth,
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FirebaseService } from '../services/firebase.service';
import { AnalyticsService } from '../services/analytics.service';
import { PlayerProfile, UserType, UserRole, GuestProfile } from '../types/auth.types';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';

interface AuthContextValue {
  user: PlayerProfile | GuestProfile | null;
  error: Error | null;
  loading: boolean;
  sendEmailVerification: () => Promise<void>;
  firebaseUser: FirebaseUser | null;
  userId: string;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
}

export interface AuthContextType extends AuthContextValue {
  setUser: React.Dispatch<React.SetStateAction<PlayerProfile | GuestProfile | null>>;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Get user profile from Firestore
const getUserProfile = async (uid: string): Promise<PlayerProfile | null> => {
  try {
    if (!uid) return null;

    const userDocRef = doc(db, 'users', uid);
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
        emailVerified: false,
        registrationType: 'email',
        adminPrivileges: null,
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
          visitCount: 1,
        },
        preferences: {
          favoriteWhiskeys: [],
          preferredDifficulty: 'beginner',
          notifications: true,
        },
        geographicData: null,
        statistics: {
          totalSamplesGuessed: 0,
          correctGuesses: 0,
          hintsUsed: 0,
          averageAccuracy: 0,
          bestScore: 0,
          worstScore: 0,
          lastUpdated: new Date(),
        },
        achievements: [],
      };

      await FirebaseService.createUserDocument(uid, defaultProfile);
      return defaultProfile;
    }

    return userSnap.data() as PlayerProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PlayerProfile | GuestProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const isAuthenticated = Boolean(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const handleAuthStateChange = async (fbUser: FirebaseUser | null) => {
      if (!mounted) return;
      console.log('Auth state change:', fbUser ? 'User exists' : 'No user');
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          let userData = await getUserProfile(fbUser.uid);

          if (!userData) {
            userData = await FirebaseService.createUserDocument(fbUser.uid, {
              userId: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'New Player',
              role: UserRole.PLAYER,
              type: UserType.REGISTERED,
              isAnonymous: fbUser.isAnonymous,
              guest: fbUser.isAnonymous,
              emailVerified: fbUser.emailVerified,
              registrationType: 'email',
              adminPrivileges: null,
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
                visitCount: 1,
              },
              preferences: {
                favoriteWhiskeys: [],
                preferredDifficulty: 'beginner',
                notifications: true,
              },
              geographicData: null,
              statistics: {
                totalSamplesGuessed: 0,
                correctGuesses: 0,
                hintsUsed: 0,
                averageAccuracy: 0,
                bestScore: 0,
                worstScore: 0,
                lastUpdated: new Date(),
              },
              achievements: [],
            });
          }

          if (mounted) setUser(userData);
        } else if (mounted) {
          setUser(null);
          setFirebaseUser(null);
        }
      } catch (error) {
        console.error('Detailed auth state error:', {
          error,
          userExists: !!fbUser,
          userUid: fbUser?.uid || 'No UID'
        });
        if (mounted) setError(error as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const firebaseUser = await FirebaseService.signIn(email, password);
      setUser(await getUserProfile(firebaseUser.uid));
      navigate('/profile');
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const firebaseUser = await FirebaseService.signUp(email, password);
      setUser(await getUserProfile(firebaseUser.uid));
      navigate('/profile');
    } catch (err) {
      console.error('Sign up error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const signInAsGuest = async () => {
    try {
      const result = await signInAnonymously(auth);
      const guestProfile: GuestProfile = {
        userId: result.user.uid,
        email: null,
        displayName: 'Guest',
        role: UserRole.GUEST,
        type: UserType.GUEST,
        registrationType: 'guest',
        isAnonymous: true,
        guest: true,
        createdAt: new Date(),
        guestToken: result.user.uid,
        guestSessionToken: result.user.refreshToken || '',
        guestSessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        metrics: {
          gamesPlayed: 0,
          totalScore: 0,
          bestScore: 0
        }
      };

      setUser(guestProfile);
      AnalyticsService.userSignedIn({
        userId: guestProfile.userId,
        role: UserRole.GUEST,
        type: UserType.GUEST
      });
      navigate('/game'); // Redirect to game page for guests
    } catch (err) {
      console.error('Guest sign in error:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (displayName: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await FirebaseService.updateUserProfile(currentUser, displayName);
      setUser((prev: PlayerProfile | GuestProfile | null) => (prev ? { ...prev, displayName } : null));
    } catch (err) {
      console.error('Profile update error:', err);
      throw err;
    }
  };

  const sendEmailVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerificationAuth(auth.currentUser);
    }
  };

  const value: AuthContextValue = {
    user,
    firebaseUser,
    userId: user?.userId || '',
    isAuthenticated,
    loading,
    error,  // Add error to the context value
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    signInAsGuest,
    sendEmailVerification
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-32 h-32 border-t-2 border-b-2 rounded-full animate-spin border-amber-600"></div>
      </div>
    );
  }

  if (value.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold text-red-600">Authentication Error</h2>
          <p className="mt-2 text-gray-600">{error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 mt-4 text-white rounded bg-amber-600 hover:bg-amber-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...value, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

