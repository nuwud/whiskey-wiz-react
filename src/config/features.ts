export interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiresRefresh: boolean;
  category: 'gameplay' | 'social' | 'interface' | 'analytics' | 'extras';
  isEssential?: boolean;
}

export const FEATURES: Feature[] = [
  // Essential Features
  {
    id: 'core-game',
    name: 'Core Game Mechanics',
    description: 'Basic whiskey guessing gameplay',
    enabled: true,
    requiresRefresh: true,
    category: 'gameplay',
    isEssential: true
  },
  {
    id: 'basic-auth',
    name: 'Basic Authentication',
    description: 'User login and registration',
    enabled: true,
    requiresRefresh: true,
    category: 'interface',
    isEssential: true
  },
  
  // Optional Features
  {
    id: 'accessibility',
    name: 'Accessibility Settings',
    description: 'Enhanced accessibility options',
    enabled: true,
    requiresRefresh: false,
    category: 'interface'
  },
  {
    id: 'detailed-progress',
    name: 'Detailed Progress Tracking',
    description: 'Advanced progress statistics and history',
    enabled: true,
    requiresRefresh: true,
    category: 'analytics'
  },
  {
    id: 'seasonal-events',
    name: 'Seasonal Events',
    description: 'Special seasonal challenges and themes',
    enabled: true,
    requiresRefresh: true,
    category: 'extras'
  },
  {
    id: 'social-sharing',
    name: 'Social Sharing',
    description: 'Share results on social media',
    enabled: true,
    requiresRefresh: false,
    category: 'social'
  },
  {
    id: 'achievements',
    name: 'Achievements System',
    description: 'Unlock badges and achievements',
    enabled: true,
    requiresRefresh: false,
    category: 'extras'
  },
  {
    id: 'leaderboard',
    name: 'Global Leaderboard',
    description: 'Compare scores with other players',
    enabled: true,
    requiresRefresh: true,
    category: 'social'
  },
  {
    id: 'whiskey-info',
    name: 'Whiskey Information',
    description: 'Detailed whiskey facts and history',
    enabled: true,
    requiresRefresh: false,
    category: 'extras'
  },
  {
    id: 'profile-customization',
    name: 'Profile Customization',
    description: 'Customize your player profile',
    enabled: true,
    requiresRefresh: false,
    category: 'extras'
  },
  {
    id: 'practice-mode',
    name: 'Practice Mode',
    description: 'Practice without affecting scores',
    enabled: true,
    requiresRefresh: true,
    category: 'gameplay'
  },
  {
    id: 'advanced-stats',
    name: 'Advanced Statistics',
    description: 'Detailed gameplay analytics',
    enabled: true,
    requiresRefresh: false,
    category: 'analytics'
  }
];
