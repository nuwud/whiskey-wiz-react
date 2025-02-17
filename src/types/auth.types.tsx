import { User as FirebaseUser } from 'firebase/auth';

export type RegistrationType = 'email' | 'google' | 'facebook' | 'twitter' | 'guest';

export enum UserType {
  GUEST = 'guest',
  REGISTERED = 'registered',
  ADMIN = 'admin',
}

export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin',
  GUEST = 'guest'
}

export interface ExtendedUser extends FirebaseUser {
  userId: string; // Maps to uid from FirebaseUser
  role: UserRole;
  type: UserType;
  registrationType: RegistrationType;
  guest: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  
  // Optional fields that might not be available immediately
  metrics?: PlayerProfile['metrics'];
  preferences?: PlayerProfile['preferences'];
  geographicData?: PlayerProfile['geographicData'];
}

export interface BaseProfile {
  userId: string;
  email: string | null;
  displayName: 'Guest Player';
  role: UserRole;
  type: UserType;
  registrationType: RegistrationType;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  lastActive: Date;
}

export interface PlayerProfile {
  // Required core fields
  userId: string;
  email: string | null;
  emailVerified: boolean; 
  displayName: string;
  role: UserRole.PLAYER;
  type: UserType.REGISTERED;
  registrationType: string;
  adminPrivileges: any;
  guest: boolean;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  lastActive: Date;

  // Game-related required fields
  lifetimeScore: number;
  totalQuartersCompleted: number;
  quarterPerformance: Record<string, {
    score: number;
    completedAt: Date;
    accuracy: number;
    timeSpent: number;
  }>;

  // Required structured data
  metrics: {
    gamesPlayed: number;
    totalScore: number;
    averageScore: number;
    bestScore: number;
    badges: any[];
    achievements: any[];
    lastVisit: Date;
    visitCount: number;
  };

  preferences: {
    favoriteWhiskeys: any[];
    preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
    notifications: boolean;
  };

  statistics: {
    totalSamplesGuessed: number;
    correctGuesses: number;
    hintsUsed: number;
    averageAccuracy: number;
    bestScore: number;
    worstScore: number;
    lastUpdated: Date;
  };

  // Optional fields
  version?: number;
  totalGames?: number;
  averageScore?: number;
  winRate?: number;
  level?: number;
  experience?: number;
  geographicData?: {
    country?: any;
    region?: any;
  } | null;
  achievements?: any[];
}

export interface AdminProfile {
  email: string;
  displayName: string;
  role: UserRole.ADMIN;
  type: UserType.ADMIN;
  registrationType: 'email';
  guest: false;
  lastActive: Date;
  adminPrivileges: string[];
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
    lastVisit: Date,
    visitCount: 1
  },
  preferences: {
    favoriteWhiskeys: [],
    preferredDifficulty: 'beginner',
    notifications: true
  }
  permissions: {
    canManageUsers: boolean;
    canManageContent: boolean;
    canViewAnalytics: boolean;
    canModifyGameSettings: boolean;
    canSendInvites: boolean;
    canViewInvites: boolean;
    canRedeemInvites: boolean;
    canCreateContent: boolean;
    canEditContent: boolean;
    canDeleteContent: boolean;
    canDeleteUsers: boolean;
    canBanUsers: boolean;
    canViewUsers: boolean;
    canUnbanUsers: boolean;
    canBanContent: boolean;
    canUnbanContent: boolean;
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
  content?: {
    id: string;
    title: string;
    description: string;
    type: 'game' | 'challenge' | 'whiskey';
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    content: string;
    status: 'draft' | 'published' | 'archived';
  };
  analytics?: {
    gameId: string;
    totalScore: number;
    averageScore: number;
    totalGamesPlayed: number;
    topScorers: { userId: string; score: number }[];
    challengesCompleted: { challengeId: string; completedAt: Date }[];
    whiskeysScored: { whiskeyId: string; score: number }[];
    whiskeysRedeemed: { whiskeyId: string; redeemedAt: Date }[];
    whiskeysCreated: { whiskeyId: string; createdAt: Date }[];
  };
  notifications?: {
    userId: string;
    type: 'challenge' | 'whiskey' | 'game';
    contentId: string;
    createdAt: Date;
    read: boolean;
  };
  whiskeys?: {
    whiskeyId: string;
    name: string;
    description: string;
    type: [];
    country: string;
    region: string;
    age: number;
    proof: number;
    mashbill: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    status: 'draft' | 'published' | 'archived';
  };
  challenges?: {
    challengeId: string;
    name: string;
    description: string;
    type: 'age' | 'proof' | 'mashbill';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    status: 'draft' | 'published' | 'archived';
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    whiskeys?: {
      whiskeyId: string;
      name: string;
      description: string;
      type: [];
      country: string;
      region: string;
      age: number;
      proof: number;
      mashbill: string;
      notes?: string;
      createdAt: Date;
      updatedAt: Date;
      createdBy: string;
      updatedBy: string;
      status: 'draft' | 'published' | 'archived';
    }[];
  };
  games?: {
    gameId: string;
    name: string;
    description: string;
    status: 'draft' | 'published' | 'archived';
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    players?: {
      playerId: string;
      score: number;
      guesses: {
        sampleId: string;
        age: number;
        proof: number;
        mashbill: string;
      }[];
    }[];
  };
  statistics: {
    totalSamplesGuessed: 0,
    correctGuesses: 0,
    hintsUsed: 0,
    averageAccuracy: 0,
    bestScore: 0,
    worstScore: 0,
    lastUpdated: Date
  };
}

// In auth.types.tsx
export interface GuestProfile {
  guestToken: string;
  guestSessionToken: string;
  guestSessionExpiresAt: Date;
  userId: string;
  email: null;
  emailVerified?: boolean;
  displayName: string;
  role: UserRole.GUEST;
  type: UserType.GUEST;
  registrationType: 'guest';
  isAnonymous: true;
  guest: true;
  createdAt: Date;
  // Basic game metrics
  metrics: {
    gamesPlayed: number;
    totalScore: number;
    bestScore: number;
  };
  adminPrivileges: null,
}