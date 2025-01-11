import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebaseConfig';

interface UserRole {
  admin: boolean;
  player: boolean;
  moderator: boolean;
}

interface AuthUser extends User {
  roles?: UserRole;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isAdmin: boolean;
  isModerator: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function getUserRoles(uid: string): Promise<UserRole> {
    const userDoc = await getDoc(doc(firestore, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().roles || { admin: false, player: true, moderator: false };
    }
    return { admin: false, player: true, moderator: false };
  }

  async function signup(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(firestore, 'users', userCredential.user.uid), {
      email,
      displayName,
      roles: { admin: false, player: true, moderator: false },
      createdAt: new Date().toISOString()
    });
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function googleSignIn() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      await setDoc(doc(firestore, 'users', result.user.uid), {
        email: result.user.email,
        displayName: result.user.displayName,
        roles: { admin: false, player: true, moderator: false },
        createdAt: new Date().toISOString()
      });
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const roles = await getUserRoles(user.uid);
        setCurrentUser({ ...user, roles });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin: currentUser?.roles?.admin || false,
    isModerator: currentUser?.roles?.moderator || false,
    login,
    signup,
    logout,
    googleSignIn,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
