export type UserRole = 'admin' | 'player' | 'guest';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isAnonymous: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface PlayerProfile extends User {
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

export interface AdminProfile extends User {
  permissions: {
    canManageUsers: boolean;
    canManageContent: boolean;
    canViewAnalytics: boolean;
    canModifyGameSettings: boolean;
  };
}