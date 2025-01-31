import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { FirebaseService } from '../services/firebase.service';
import { ExtendedUser, UserRole } from '../types';
import { analyticsService } from '../services/analytics.service';

interface AuthContextType {
  user: ExtendedUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute isAuthenticated based on user existence
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get user document to include role
          const userDoc = await FirebaseService.getUserDocument(firebaseUser.uid);
          const extendedUser: ExtendedUser = {
            ...firebaseUser,
            role: userDoc?.role || UserRole.USER
          };
          setUser(extendedUser);
          analyticsService.userSignedIn({
            userId: extendedUser.uid,
            role: extendedUser.role
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const extendedUser = await FirebaseService.signIn(email, password);
      setUser(extendedUser);
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const extendedUser = await FirebaseService.signUp(email, password);
      setUser(extendedUser);
      analyticsService.userSignedUp({
        userId: extendedUser.uid,
        role: extendedUser.role
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

  const resetPassword = async (email: string) => {
    try {
      await FirebaseService.resetPassword(email);
    } catch (err) {
      console.error('Password reset error:', err);
      throw err;
    }
  };

  const updateProfile = async (displayName: string) => {
    if (!user) return;
    try {
      await FirebaseService.updateUserProfile(user, displayName);
      setUser(prev => prev ? { ...prev, displayName } : null);
    } catch (err) {
      console.error('Profile update error:', err);
      throw err;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};