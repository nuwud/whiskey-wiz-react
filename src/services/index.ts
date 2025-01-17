// Core Services
export { default as BaseService } from './core/BaseService';
export { default as FirebaseService } from './core/FirebaseService';
export { default as AuthService } from './core/AuthService';

// Game Services
export { default as GameChallengeService } from './game/GameChallengeService';
export { default as GameStateService } from './game/GameStateService';
export { quarterService } from './quarters/QuarterService';

// Analytics Services
export { analyticsService } from './analytics/AnalyticsService';
export { default as PlayerTrackingService } from './analytics/PlayerTrackingService';
export { default as MonitoringService } from './analytics/MonitoringService';

// Integration Services
export { shopifyService } from './shopify/ShopifyService';

// Feature Services
export { default as WhiskeyKnowledgeGraphService } from './features/WhiskeyKnowledgeGraphService';
export { default as SocialChallengeService } from './features/SocialChallengeService';
export { default as StateRecoveryService } from './features/StateRecoveryService';
export { default as MachineLearningService } from './features/MachineLearningService';

// Mock Services
export { mockDataService } from './mock/mockDataService';

// Deprecated Services - Use alternatives
export const QuarterTemplateService = () => {
  console.warn('QuarterTemplateService is deprecated. Use quarterService instead.');
  return null;
};

export const ShopifyIntegrationService = () => {
  console.warn('ShopifyIntegrationService is deprecated. Use shopifyService instead.');
  return null;
};
