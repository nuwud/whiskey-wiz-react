export { shopifyService } from './shopify/ShopifyService';
export { quarterService } from './quarters/QuarterService';
export { analyticsService } from './analytics/AnalyticsService';
export { mockDataService } from './mock/mockDataService';

// Deprecation notices
export const ShopifyIntegrationService = () => {
  console.warn('ShopifyIntegrationService is deprecated. Use shopifyService instead.');
  return null;
};

export const QuarterTemplateService = () => {
  console.warn('QuarterTemplateService is deprecated. Use quarterService instead.');
  return null;
};
