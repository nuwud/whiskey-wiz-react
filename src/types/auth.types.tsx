import { User as FirebaseUser } from 'firebase/auth';

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

export interface PlayerProfile {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
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
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AdminProfile {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
  permissions: {
    canManageUsers: boolean;
    canManageContent: boolean;
    canViewAnalytics: boolean;
    canModifyGameSettings: boolean;
  };
  createdAt: Date;
  lastLoginAt: Date;
}