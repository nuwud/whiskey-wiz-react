export interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiresRefresh: boolean;
  category: 'gameplay' | 'social' | 'interface' | 'analytics';
}

export const DEFAULT_FEATURES: Feature[] = [
  {
    id: 'accessibility',
    name: 'Accessibility Settings',
    description: 'Enhanced accessibility options for vision and motor impairments',
    enabled: true,
    requiresRefresh: false,
    category: 'interface'
  },
  {
    id: 'progress-tracking',
    name: 'Game Progress Tracking',
    description: 'Track detailed progress through each quarter',
    enabled: true,
    requiresRefresh: true,
    category: 'gameplay'
  },
  {
    id: 'seasonal-trends',
    name: 'Seasonal Events & Trends',
    description: 'Special seasonal events and trend analysis',
    enabled: true,
    requiresRefresh: true,
    category: 'gameplay'
  },
  {
    id: 'shopify',
    name: 'Shopify Integration',
    description: 'Integration with BlindBarrels shop',
    enabled: true,
    requiresRefresh: false,
    category: 'interface'
  },
  {
    id: 'recommendations',
    name: 'Whiskey Recommendations',
    description: 'Personalized whiskey recommendations based on gameplay',
    enabled: true,
    requiresRefresh: false,
    category: 'analytics'
  }
];
