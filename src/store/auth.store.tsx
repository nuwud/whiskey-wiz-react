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
import { UserRole, UserType, PlayerProfile, AdminProfile } from '../types/auth.types';

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

const validateAdminProfile = (profile: unknown): profile is AdminProfile => {
  if (!profile || typeof profile !== 'object') return false;
  
  const p = profile as AdminProfile;
  return (
    p.role === UserRole.ADMIN &&
    typeof p.permissions === 'object' &&
    'canManageUsers' in p.permissions &&
    'canManageContent' in p.permissions &&
    'canViewAnalytics' in p.permissions &&
    'canModifyGameSettings' in p.permissions &&
    Array.isArray(p.adminPrivileges)
  );
};

const isAdminProfile = (profile: any): profile is AdminProfile => {
  return profile.role === UserRole.ADMIN && 'permissions' in profile;
};

const createBaseProfile = (fbUser: FirebaseUser, role: UserRole = UserRole.PLAYER) => ({
  userId: fbUser.uid,
  email: fbUser.email ?? '',
  displayName: fbUser.displayName ?? '',
  role: role || UserRole.PLAYER,  // Ensure default player role
  type: fbUser.isAnonymous ? UserType.GUEST : UserType.REGISTERED,
  isAnonymous: fbUser.isAnonymous,
  guest: fbUser.isAnonymous,
  registrationType: fbUser.isAnonymous ? UserType.GUEST : UserType.REGISTERED,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  lastActive: new Date().toISOString(),
  version: 1
});

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
  
      const userData = userDoc.data();
      
      // Check if it's an admin profile
      if (userData.role === UserRole.ADMIN) {
        // Ensure admin profile has required fields
        if (!validateAdminProfile(userData)) {
          console.error('Invalid admin profile structure:', userData);
          // Create missing admin fields if needed
          const adminProfile: AdminProfile = {
            ...userData as PlayerProfile,
            role: UserRole.ADMIN,
            permissions: {
              canManageUsers: true,
              canManageContent: true,
              canViewAnalytics: true,
              canModifyGameSettings: true,
              canSendInvites: true,
              canViewInvites: true,
              canRedeemInvites: true,
              canCreateContent: true,
              canEditContent: true,
              canDeleteContent: true,
              canBanUsers: true,
              canUnbanUsers: true,
              canBanContent: true,
              canUnbanContent: true,
              canDeleteUsers: true,
              canViewUsers: true
            },
            adminPrivileges: ['basic']
          };
          
          // Update the profile in Firestore
          await updateDoc(doc(db, 'users', fbUser.uid), {
            permissions: adminProfile.permissions,
            adminPrivileges: adminProfile.adminPrivileges
          });
          
          set({ profile: adminProfile });
        } else {
          set({ profile: userData as AdminProfile });
        }
      } else {
        set({ profile: userData as PlayerProfile });
      }
  
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, role: UserRole = UserRole.PLAYER) => {
    try {
      set({ isLoading: true, error: null });
      const auth = getAuth();
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

      const validRole = ensureValidRole(role);
      const baseProfile = createBaseProfile(fbUser, validRole);

      const profile = validRole === UserRole.ADMIN
        ? {
            ...baseProfile,
            adminPrivileges: ['basic'],
            permissions: {
              canManageUsers: true,
              canManageContent: true,
              canViewAnalytics: true,
              canModifyGameSettings: true
            }
          }
        : {
            ...baseProfile,
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
            lastActive: new Date().toISOString(),
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
            }
          };

      await setDoc(doc(db, 'users', fbUser.uid), profile);
      
      // Convert string timestamps to Date objects for local state
      const convertedProfile = {
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
        lastLoginAt: new Date(profile.lastLoginAt),
        ...('lastActive' in profile && { lastActive: new Date(profile.lastActive) })
      };
      
      set({ 
        user: convertedProfile as unknown as PlayerProfile, 
        profile: role === UserRole.ADMIN 
          ? { ...convertedProfile, adminPrivileges: (profile as any).adminPrivileges, permissions: (profile as any).permissions } as AdminProfile 
          : convertedProfile as PlayerProfile
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
        role: UserRole.PLAYER,
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
        role: (data as PlayerProfile).role ?? (get().profile as PlayerProfile)?.role ?? UserRole.PLAYER
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

export const validateRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

export const validateProfile = (profile: PlayerProfile | AdminProfile): boolean => {
  if (!profile) return false;

  const requiredFields = ['userId', 'email', 'displayName', 'role', 'type', 'isAnonymous'];
  const hasRequiredFields = requiredFields.every(field => field in profile);
  
  // Ensure role is valid
  if (!validateRole(profile.role)) {
    console.warn(`Invalid role: ${profile.role}, defaulting to PLAYER`);
    profile.role = UserRole.PLAYER;
  }
  
  // Additional validation for admin profiles
  if (profile.role === UserRole.ADMIN) {
    return hasRequiredFields && 'permissions' in profile;
  }
  
  return hasRequiredFields;
};

// Add fetch user data utility
const fetchUserData = async (userId: string): Promise<PlayerProfile | AdminProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      console.warn(`User data not found for ID: ${userId}`);
      return null;
    }

    const userData = snapshot.data();
    console.log('Fetched user data:', userData);

    return {
      ...userData,
      createdAt: new Date(userData.createdAt),
      updatedAt: new Date(userData.updatedAt),
      lastLoginAt: new Date(userData.lastLoginAt)
    } as PlayerProfile | AdminProfile;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
};

// Update auth state listener
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

    const profile = await fetchUserData(fbUser.uid);
    
    if (!profile) {
      throw new Error('User profile not found or invalid');
    }

    if (isAdminProfile(profile)) {
      console.log('Setting admin profile:', profile);
      setProfile(profile);
      setUser(profile as unknown as PlayerProfile);
    } else {
      console.log('Setting player profile:', profile);
      setProfile(profile);
      setUser(profile);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Auth state change error:', errorMessage);
    setError(errorMessage);
    setUser(null);
    setProfile(null);
  } finally {
    setLoading(false);
  }
});

const ensureValidRole = (role: string | undefined): UserRole => {
  if (!role || !validateRole(role)) {
    console.warn(`Invalid or missing role: ${role}, using default PLAYER role`);
    return UserRole.PLAYER;
  }
  return role as UserRole;
};