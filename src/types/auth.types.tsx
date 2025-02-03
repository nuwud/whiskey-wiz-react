import { User as FirebaseUser } from 'firebase/auth';

export enum UserType {
  PLAYER = 'player',
  ADMIN = 'admin',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  GUEST = 'guest'
}

export interface ExtendedUser extends FirebaseUser {
  role?: UserRole;
}

export interface BaseProfile {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  };
  achievements?: {
    id: string;
    title: string;
    description: string;
    type: 'game' | 'challenge' | 'whiskey';
    unlocksAt: Date;
  };
  badges?: {
    id: string;
    title: string;
    description: string;
    unlocksAt: Date;
  };
  whiskeys?: {
    id: string;
    name: string;
    type: 'whiskey';
    properties: {
      age?: number;
      proof?: number;
    };
    connections: string[];
  };
  challenges?: {
    id: string;
    name: string;
    type: 'challenge';
    properties: {
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    };
    connections: string[];
  };
}

export interface AdminProfile extends BaseProfile {
  adminPrivileges: string[];
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