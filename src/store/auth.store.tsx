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
import { db } from '../config/firebase';
import { UserRole, PlayerProfile, AdminProfile } from '../types/auth.types';

interface AuthState {
  user: PlayerProfile | null;
  profile: PlayerProfile | AdminProfile | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<PlayerProfile | AdminProfile>) => Promise<void>;
  setUser: (user: PlayerProfile | null) => void;
  setProfile: (profile: PlayerProfile | AdminProfile | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

const isAdminProfile = (profile: any): profile is AdminProfile => {
  return profile.role === UserRole.ADMIN && 'permissions' in profile;
};

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

      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const profile = userDoc.data() as PlayerProfile | AdminProfile;
      // Convert string timestamps back to Date objects
      const convertedProfile = {
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
        lastLoginAt: new Date(profile.lastLoginAt)
      };
      set({ profile: convertedProfile });

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
        isAnonymous: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
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
        } as unknown as AdminProfile
        : {
          ...baseProfile,
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
        } as unknown as PlayerProfile;

      await setDoc(doc(db, 'users', fbUser.uid), profile);
      
      // Convert string timestamps to Date objects for local state
      const convertedProfile = {
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
        lastLoginAt: new Date(profile.lastLoginAt)
      };
      
      set({ 
        user: convertedProfile as PlayerProfile, 
        profile: convertedProfile 
      });
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

      const timestamps = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      const guestProfile = {
        userId: fbUser.uid,
        displayName: `Guest_${fbUser.uid.slice(0, 6)}`,
        email: '',
        role: UserRole.USER,
        isAnonymous: true,
        guest: true,
        registrationType: 'guest',
        ...timestamps,
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
      } as unknown as PlayerProfile;

      await setDoc(doc(db, 'users', fbUser.uid), guestProfile);

      // Convert timestamps for local state
      const convertedProfile = {
        ...guestProfile,
        createdAt: new Date(guestProfile.createdAt),
        updatedAt: new Date(guestProfile.updatedAt),
        lastLoginAt: new Date(guestProfile.lastLoginAt),
        guest: true
      };

      set({ user: convertedProfile, profile: convertedProfile });
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
      // Convert Date objects to ISO strings for Firestore
      const processedData = {
        ...data,
        updatedAt: new Date().toISOString(),
        ...(data.createdAt && { createdAt: (data.createdAt as Date).toISOString() }),
        ...(data.lastLoginAt && { lastLoginAt: (data.lastLoginAt as Date).toISOString() })
      };

      await updateDoc(doc(db, 'users', user.userId), processedData);
      
      // Update local state with Date objects
      const updatedProfile = {
        ...get().profile,
        ...data,
        updatedAt: new Date(),
        guest: (data as PlayerProfile).guest ?? (get().profile as PlayerProfile)?.guest ?? false,
        role: (data as PlayerProfile).role ?? (get().profile as PlayerProfile)?.role ?? UserRole.USER
      } as PlayerProfile | AdminProfile;
      set({ profile: updatedProfile });
      
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading })
}));

export const validateProfile = (profile: PlayerProfile | AdminProfile): boolean => {
  const requiredFields = ['userId', 'email', 'displayName', 'role', 'isAnonymous'];
  const hasRequiredFields = requiredFields.every(field => field in profile);
  
  if (profile.role === UserRole.ADMIN) {
    return hasRequiredFields && 'permissions' in profile;
  }
  
  return hasRequiredFields;
};

// Auth state listener
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

    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const fetchedProfile = userDoc.data();
    if (!fetchedProfile) {
      throw new Error('Invalid profile data');
    }

    // Convert string timestamps to Date objects
    const convertedProfile = {
      ...fetchedProfile,
      createdAt: new Date(fetchedProfile.createdAt),
      updatedAt: new Date(fetchedProfile.updatedAt),
      lastLoginAt: new Date(fetchedProfile.lastLoginAt)
    } as PlayerProfile | AdminProfile;

    if (isAdminProfile(convertedProfile)) {
      setProfile(convertedProfile);
      setUser(convertedProfile as unknown as PlayerProfile);  // Cast through unknown
    } else {
      setProfile(convertedProfile as PlayerProfile);
      setUser(convertedProfile as PlayerProfile);
    }

  } catch (error) {
    setError((error as Error).message);
    setUser(null);
    setProfile(null);
  } finally {
    setLoading(false);
  }
});