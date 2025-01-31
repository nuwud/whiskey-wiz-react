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
import { UserRole, PlayerProfile, AdminProfile } from '../types/auth.types';
import { WhiskeyNode } from '../services/whiskey-knowledge.service';


interface AuthState {
  user: PlayerProfile | null;
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
  setUser: (user: PlayerProfile | null) => void;
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

      const baseProfile = {
        userId: fbUser.uid,
        email: fbUser.email ?? '',
        displayName: fbUser.displayName ?? '',
        role,
        createdAt: new Date(),
        updatedAt: new Date(),  // Add this line
        lastLoginAt: new Date()
      };

      const profile = role === UserRole.ADMIN
        ? {
          ...baseProfile,
          adminPrivileges: ['basic'],
          permissions: {
            canManageUsers: true,
            canManageContent: true,
            canViewAnalytics: true,
            canModifyGameSettings: true
          }
        } as AdminProfile
        : {
          ...baseProfile,
          isAnonymous: false,
          guest: false,
          registrationType: 'email',
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
      set({ user: profile as PlayerProfile, profile });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fix guest user creation
  signInAsGuest: async () => {
    try {
      set({ isLoading: true, error: null });
      const auth = getAuth();
      const { user: fbUser } = await signInAnonymously(auth);

      const guestProfile: PlayerProfile = {
        userId: fbUser.uid,
        displayName: `Guest_${fbUser.uid.slice(0, 6)}`,
        email: '', // Add the missing email property
        role: UserRole.USER,
        isAnonymous: true,
        guest: true,
        registrationType: 'guest',
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
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };

      // Fix: Use guestProfile instead of undefined variable
      set({ user: guestProfile, profile: guestProfile });
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
      await updateDoc(doc(db, 'users', user.userId), data);
      // Fix: Ensure type safety when updating profile
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

export const validateProfile = (profile: PlayerProfile): boolean => {
  const requiredFields = ['userId', 'email', 'displayName', 'role'];
  return requiredFields.every(field => field in profile);
};

export const createGuestProfile = (fbUser: FirebaseUser): PlayerProfile => ({
  userId: fbUser.uid,
  displayName: `Guest_${fbUser.uid.slice(0, 6)}`,
  email: '',
  role: UserRole.USER,
  guest: true,
  isAnonymous: true,
  registrationType: 'guest',
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
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date()
});

// Set up auth state listener
const auth = getAuth();
// Fix auth state listener
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
      const guestProfile: PlayerProfile = {
        userId: fbUser.uid,
        displayName: `Guest_${fbUser.uid.slice(0, 6)}`,
        email: '',
        role: UserRole.USER,
        isAnonymous: true,
        guest: true,
        registrationType: 'guest',
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
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };

      setUser(guestProfile);
      setProfile(guestProfile);
      return;
    }

    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (!userDoc.exists()) {
      setError('User profile not found');
      return;
    }

    const fetchedProfile = userDoc.data();
    if (fetchedProfile.role === UserRole.ADMIN) {
      // Format admin whiskeys to match PlayerProfile structure
      const formattedProfile = {
        ...fetchedProfile,
        whiskeys: fetchedProfile.whiskeys?.map((w: Partial<WhiskeyNode>) => ({
          id: w.id || '',
          name: w.name || '',
          type: 'whiskey' as const,
          properties: {
            age: w.properties?.age,
            proof: w.properties?.proof
          },
          connections: w.connections || []
        })) || []
      };
      setProfile(formattedProfile as AdminProfile);

      // Convert admin to player profile for user state
      const playerProfile: PlayerProfile = {
        userId: fetchedProfile.userId,
        displayName: fetchedProfile.displayName,
        email: fetchedProfile.email,
        role: fetchedProfile.role,
        createdAt: fetchedProfile.createdAt,
        updatedAt: fetchedProfile.updatedAt || new Date(),
        lastLoginAt: fetchedProfile.lastLoginAt,
        guest: false,
        isAnonymous: false,
        registrationType: 'email',
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
        },
        whiskeys: formattedProfile.whiskeys
      };
      setUser(playerProfile);
    } else {
      setProfile(fetchedProfile as PlayerProfile);
      setUser(fetchedProfile as PlayerProfile);
    }
  } catch (error) {
    setError((error as Error).message);
  } finally {
    setLoading(false);
  }
});