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
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface AuthState {
  user: PlayerProfile | null;
  profile: PlayerProfile | AdminProfile | null;
  isLoading: boolean;
  error: string | null;
  navigate: ReturnType<typeof useNavigate>;
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

const createBaseProfile = (fbUser: FirebaseUser, _role: UserRole = UserRole.PLAYER): PlayerProfile => ({
  userId: fbUser.uid,
  email: fbUser.email ?? '',
  displayName: fbUser.displayName ?? '',
  emailVerified: fbUser.emailVerified,
  role: UserRole.PLAYER,
  type: UserType.REGISTERED,
  isAnonymous: fbUser.isAnonymous,
  guest: fbUser.isAnonymous,
  registrationType: 'facebook',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
  lastActive: new Date(),
  version: 1,
  adminPrivileges: null,
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
    preferredDifficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    notifications: true
  },
  statistics: {
    totalSamplesGuessed: 0 as const,
    correctGuesses: 0,
    hintsUsed: 0,
    averageAccuracy: 0,
    bestScore: 0,
    worstScore: 0,
    lastUpdated: new Date()
  } as const
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  navigate: useNavigate(), // Define navigate

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const auth = getAuth();
      const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data() as PlayerProfile;
      if (!userData || !userData.role) {
        throw new Error('User data is malformed or missing role information');
      }

      const role = validateRole(userData.role) ? userData.role : UserRole.PLAYER;
      set({ user: userData });

      if (role === UserRole.ADMIN as UserRole) {
        // Validate admin profile structure
        if (!validateAdminProfile(userData)) {
          console.warn('Invalid admin profile structure:', userData);

          const adminProfile: AdminProfile = {
            ...userData as PlayerProfile, // Extend PlayerProfile properties
            email: userData.email || '', // Ensure email is never null
            role: UserRole.ADMIN,
            type: UserType.ADMIN,
            statistics: {
              totalSamplesGuessed: 0 as const,
              correctGuesses: 0,
              hintsUsed: 0,
              averageAccuracy: 0,
              bestScore: 0,
              worstScore: 0,
              lastUpdated: new Date()
            },
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
              canDeleteUsers: true,
              canBanUsers: true,
              canViewUsers: true,
              canUnbanUsers: true,
              canBanContent: true,
              canUnbanContent: true,
            },
            adminPrivileges: userData.adminPrivileges || ['basic'],
            registrationType: 'email', 
            guest: false,
            lastActive: new Date(),
            lifetimeScore: 0,
            totalQuartersCompleted: 0,
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
            }
          };

          // Update Firestore with admin permissions
          await updateDoc(userDocRef, {
            permissions: adminProfile.permissions,
            adminPrivileges: adminProfile.adminPrivileges
          });

          set({ profile: adminProfile });
        } else {
          set({ profile: userData as AdminProfile });
        }
      } else {
        // Ensure PlayerProfile contains required fields
        const playerProfile: PlayerProfile = {
          userId: fbUser.uid,
          email: fbUser.email ?? '',
          displayName: fbUser.displayName ?? '',
          emailVerified: fbUser.emailVerified,
          type: userData.type || UserType.REGISTERED,
          isAnonymous: fbUser.isAnonymous,
          createdAt: userData.createdAt || new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          version: userData.version || 1,
          adminPrivileges: null,
          quarterPerformance: userData.quarterPerformance || {},
          statistics: userData.statistics || {
            totalSamplesGuessed: 0,
            correctGuesses: 0,
            hintsUsed: 0,
            averageAccuracy: 0,
            bestScore: 0,
            worstScore: 0,
            lastUpdated: new Date()
          },
          role: UserRole.PLAYER,
          registrationType: userData.registrationType || UserType.REGISTERED,
          guest: userData.guest ?? false,
          lastActive: userData.lastActive ?? new Date().toISOString(),
          lifetimeScore: userData.lifetimeScore ?? 0,
          totalQuartersCompleted: userData.totalQuartersCompleted ?? 0,
          metrics: userData.metrics || {
            gamesPlayed: 0,
            totalScore: 0,
            averageScore: 0,
            bestScore: 0,
            badges: [],
            achievements: [],
            lastVisit: new Date(),
            visitCount: 1
          },
          preferences: userData.preferences || {
            favoriteWhiskeys: [],
            preferredDifficulty: 'beginner',
            notifications: true
          }
        };

        set({ profile: playerProfile });
      }

      // userData is already validated and typed as PlayerProfile
      set({ user: userData });

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

      // Ensure valid role
      const validRole = validateRole(role) ? role : UserRole.PLAYER;
      const baseProfile = createBaseProfile(fbUser, validRole);

      let profile: PlayerProfile | AdminProfile;

      if (validRole === UserRole.ADMIN) {
        const { guest: _, ...baseProfileWithoutGuest } = baseProfile; // Remove guest property
        profile = {
          ...baseProfileWithoutGuest,
          email: fbUser.email ?? '',  // Ensure email is never null
          role: UserRole.ADMIN,
          type: UserType.ADMIN,
          guest: false as const,  // Explicitly set to false
          registrationType: 'email' as const,  // Explicitly set to 'email'
          adminPrivileges: ['basic'],
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
            canDeleteUsers: true,
            canBanUsers: true,
            canViewUsers: true,
            canUnbanUsers: true,
            canBanContent: true,
            canUnbanContent: true
          },
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
          statistics: {
            totalSamplesGuessed: 0 as const,
            correctGuesses: 0,
            hintsUsed: 0,
            averageAccuracy: 0,
            bestScore: 0,
            worstScore: 0,
            lastUpdated: new Date()
          }
        };
      } else {
        profile = {
          ...baseProfile,
          role: UserRole.PLAYER,
          type: UserType.REGISTERED,
          registrationType: "email",
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
          statistics: {
            totalSamplesGuessed: 0 as const,
            correctGuesses: 0,
            hintsUsed: 0,
            averageAccuracy: 0,
            bestScore: 0,
            worstScore: 0,
            lastUpdated: new Date()
          }
        };
      }

      await setDoc(doc(db, 'users', fbUser.uid), profile);
      set({ user: profile as PlayerProfile, profile });

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

      const guestProfile: PlayerProfile = {
        userId: fbUser.uid,
        displayName: `Guest_${fbUser.uid.slice(0, 6)}`,
        email: '',
        emailVerified: false,
        role: UserRole.PLAYER,
        isAnonymous: true,
        guest: true,
        type: UserType.REGISTERED,
        registrationType: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        lastActive: new Date(),
        version: 1,
        adminPrivileges: null,
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

      await setDoc(doc(db, 'users', fbUser.uid), guestProfile);
      set({ user: guestProfile, profile: guestProfile });
    } catch (error: unknown) {
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
      const processedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'users', user.userId), processedData);

      const updatedProfile = {
        ...get().profile!,
        ...data,
        updatedAt: new Date(),
      } as PlayerProfile | AdminProfile;
      
      set({ profile: updatedProfile });

    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user: PlayerProfile | null) => set({ user }),
  setProfile: (profile: PlayerProfile | AdminProfile | null) => set({ profile }),
  setError: (error: string | null) => set({ error }),
  setLoading: (isLoading: boolean) => set({ isLoading })
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

// Update auth state listener
const auth = getAuth();

onAuthStateChanged(auth, async (fbUser) => {
  const { setUser, setProfile, setLoading, setError } = useAuthStore.getState();

  try {
    setLoading(true);

      if (!fbUser) {
      setUser(null);
      setProfile(null);
      useAuthStore.getState().navigate('/login'); // Redirect to login page if no user is authenticated
      return;
    }

    // Fetch and normalize profile
    const profile = await fetchUserProfile(fbUser.uid);

    if (!profile) throw new Error('Failed to load user profile');

    // Update state based on profile type
    if (profile.role === UserRole.ADMIN) {
      setProfile(profile as AdminProfile);
      useAuthStore.getState().navigate('/admin'); // Redirect to admin page for admins
    } else {
      setProfile(profile as PlayerProfile);
      setUser(profile as PlayerProfile);
      useAuthStore.getState().navigate('/profile'); // Redirect to profile page for players
    }

  } catch (error) {
    console.error('Auth state change error:', error);
    setError(error instanceof Error ? error.message : 'Authentication error');
  } finally {
    setLoading(false);
  }
});

const fetchUserProfile = async (uid: string): Promise<PlayerProfile | AdminProfile> => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    console.warn(`No profile found for ${uid}, creating default profile...`);
    return createBaseProfile({ uid } as FirebaseUser, UserRole.PLAYER); // Ensure default role
  }

  const userData = userDoc.data();
  const role = validateRole(userData.role) ? userData.role : UserRole.PLAYER;

  if (role === UserRole.ADMIN) {
    return {
      ...normalizeAdminProfile(userData),
      registrationType: 'email', // Ensure missing fields are added
      guest: false,
      lastActive: new Date(),
      lifetimeScore: 0,
      totalQuartersCompleted: 0,
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
      }
    };
  } else {
    return normalizePlayerProfile(userData);
  }
};

const normalizeAdminProfile = (userData: any): AdminProfile => {
  return {
    ...userData,
    role: UserRole.ADMIN,
    permissions: {
      canManageUsers: userData.permissions?.canManageUsers ?? false,
      canManageContent: userData.permissions?.canManageContent ?? false,
      canViewAnalytics: userData.permissions?.canViewAnalytics ?? false,
      canModifyGameSettings: userData.permissions?.canModifyGameSettings ?? false,
      canSendInvites: userData.permissions?.canSendInvites ?? false,
      canViewInvites: userData.permissions?.canViewInvites ?? false,
      canRedeemInvites: userData.permissions?.canRedeemInvites ?? false,
      canCreateContent: userData.permissions?.canCreateContent ?? false,
      canEditContent: userData.permissions?.canEditContent ?? false,
      canDeleteContent: userData.permissions?.canDeleteContent ?? false,
      canDeleteUsers: userData.permissions?.canDeleteUsers ?? false,
      canBanUsers: userData.permissions?.canBanUsers ?? false,
      canViewUsers: userData.permissions?.canViewUsers ?? false,
      canUnbanUsers: userData.permissions?.canUnbanUsers ?? false,
      canBanContent: userData.permissions?.canBanContent ?? false,
      canUnbanContent: userData.permissions?.canUnbanContent ?? false,
    },
    adminPrivileges: userData.adminPrivileges || ['basic']
  };
};

const normalizePlayerProfile = (userData: any): PlayerProfile => {
  return {
    ...userData,
    metrics: userData.metrics || {
      gamesPlayed: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      badges: [],
      achievements: [],
      lastVisit: new Date(),
      visitCount: 1
    },
    preferences: userData.preferences || {
      favoriteWhiskeys: [],
      preferredDifficulty: 'beginner',
      notifications: true
    },
    statistics: userData.statistics || {
      totalSamplesGuessed: 0,
      correctGuesses: 0,
      hintsUsed: 0,
      averageAccuracy: 0,
      bestScore: 0,
      worstScore: 0,
      lastUpdated: new Date()
    },
    lastActive: new Date().toISOString(),
    lifetimeScore: userData.lifetimeScore || 0,
    totalQuartersCompleted: userData.totalQuartersCompleted || 0,
    registrationType: userData.registrationType || UserType.REGISTERED
  };
};