import { create } from 'zustand';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserRole, PlayerProfile, AdminProfile } from '../types/auth';

interface AuthState {
  user: User | null;
  profile: PlayerProfile | AdminProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Profile actions
  updateProfile: (data: Partial<PlayerProfile | AdminProfile>) => Promise<void>;
  
  // Internal actions
  setUser: (user: User | null) => void;
  setProfile: (profile: PlayerProfile | AdminProfile | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const auth = getAuth();
      const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const profile = userDoc.data() as PlayerProfile | AdminProfile;
      set({ profile });
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, role: UserRole) => {
    try {
      set({ isLoading: true, error: null });
      const auth = getAuth();
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      const newUser: User = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        role,
        isAnonymous: false,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      // Create initial profile based on role
      const profile = role === 'admin' 
        ? {
            ...newUser,
            permissions: {
              canManageUsers: true,
              canManageContent: true,
              canViewAnalytics: true,
              canModifyGameSettings: true
            }
          } as AdminProfile
        : {
            ...newUser,
            metrics: {
              gamesPlayed: 0,
              totalScore: 0,
              averageScore: 0,
              bestScore: 0,
              badges: [],
              achievements: []
            },
            preferences: {
              favoriteWhiskeys: [],
              preferredDifficulty: 'beginner',
              notifications: true
            }
          } as PlayerProfile;

      await setDoc(doc(db, 'users', fbUser.uid), profile);
      set({ user: newUser, profile });
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signInAsGuest: async () => {
    try {
      set({ isLoading: true, error: null });
      const auth = getAuth();
      const { user: fbUser } = await signInAnonymously(auth);
      
      const guestUser: User = {
        uid: fbUser.uid,
        email: null,
        displayName: `Guest_${fbUser.uid.slice(0, 6)}`,
        role: 'guest',
        isAnonymous: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      set({ user: guestUser, profile: null });
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      const auth = getAuth();
      await firebaseSignOut(auth);
      set({ user: null, profile: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data: Partial<PlayerProfile | AdminProfile>) => {
    const { user } = get();
    if (!user) throw new Error('No user logged in');

    try {
      set({ isLoading: true, error: null });
      await updateDoc(doc(db, 'users', user.uid), data);
      set(state => ({
        profile: state.profile ? { ...state.profile, ...data } : null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Internal actions
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading })
}));

// Set up auth state listener
const auth = getAuth();
onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
  const { setUser, setProfile, setLoading, setError } = useAuthStore.getState();
  
  try {
    setLoading(true);
    
    if (!fbUser) {
      setUser(null);
      setProfile(null);
      return;
    }

    if (fbUser.isAnonymous) {
      setUser({
        uid: fbUser.uid,
        email: null,
        displayName: `Guest_${fbUser.uid.slice(0, 6)}`,
        role: 'guest',
        isAnonymous: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
      setProfile(null);
      return;
    }

    // Fetch user profile
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (!userDoc.exists()) {
      setError('User profile not found');
      return;
    }

    const profile = userDoc.data() as PlayerProfile | AdminProfile;
    setUser(profile);
    setProfile(profile);
    
  } catch (error) {
    setError((error as Error).message);
  } finally {
    setLoading(false);
  }
});