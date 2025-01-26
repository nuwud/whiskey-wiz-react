import { User as FirebaseUser } from 'firebase/auth';

export enum UserType {
  PLAYER = 'player',
  ADMIN = 'admin',
  GUEST = 'guest'
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export interface ExtendedUser extends FirebaseUser {
  role?: UserRole;
}

export interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
}

export interface BaseProfile {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
  isAnonymous: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface PlayerProfile extends BaseProfile {
  guest: boolean;
  registrationType: 'email' | 'google' | 'facebook' | 'guest';
  geographicData?: {
    country?: string;
    region?: string;
  };
  metrics: {
    gamesPlayed: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    badges: string[];
    achievements: string[];
  };
  preferences: {
    favoriteWhiskeys: string[];
    preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
    notifications: boolean;
  };
}

export interface AdminProfile extends BaseProfile {
  adminPrivileges: string[];
  permissions: {
    canManageUsers: boolean;
    canManageContent: boolean;
    canViewAnalytics: boolean;
    canModifyGameSettings: boolean;
  };
}

export interface GuestProfile {
  guest: true;
  registrationType: 'guest';
  geographicData?: {
    country?: string;
    region?: string;
  };
  metrics: {
    gamesPlayed: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    badges: string[];
    achievements: string[];
  };
  preferences: {
    favoriteWhiskeys: string[];
    preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
    notifications: boolean;
  };
  invites?: {
    email: string;
    invitedBy: string;
    status: 'pending' | 'accepted' | 'declined';
    declined?: boolean;
    declinedReason?: string;
    expiresAt: Date;
    code: string;
    acceptedAt?: Date;
    declinedAt?: Date;
    createdAt: Date;
  };
}