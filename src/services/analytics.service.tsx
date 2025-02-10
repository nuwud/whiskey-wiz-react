// analytics.service.tsx
import { logEvent, Analytics, setUserProperties } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { analytics } from '../config/firebase';
import { UserType, UserRole } from '../types/auth.types';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private analytics!: Analytics;

  private constructor() {
    analytics().then(analyticsInstance => {
      if (analyticsInstance) {
        this.analytics = analyticsInstance;
      }
    });
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Core event tracking
  public trackEvent(eventName: string, data: Record<string, any>): void {
    try {
      logEvent(this.analytics, eventName, {
        ...data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track event:', eventName, error);
    }
  }

  // Add static trackEvent method
  public static trackEvent(eventName: string, eventData: Record<string, any>): void {
    const instance = AnalyticsService.getInstance();
    instance.trackEvent(eventName, eventData);
  }

  // Add static startTrace method
  public static startTrace(traceName: string): number {
    console.log(`Starting trace: ${traceName}`);
    return performance.now();
  }

  // Add static endTrace method
  public static endTrace(traceName: string, startTime: number): number {
    const duration = performance.now() - startTime;
    console.log(`Ending trace: ${traceName}, Duration: ${duration}ms`);
    return duration;
  }

  // Add static getPlayerAnalytics method
  public static async getPlayerAnalytics(userIds: string[]): Promise<Record<string, any>> {
    console.log('Fetching analytics for players:', userIds);
    const instance = AnalyticsService.getInstance();
    return instance.fetchPlayerAnalytics(userIds);
  }

  private async fetchPlayerAnalytics(userIds: string[]): Promise<Record<string, any>> {
    try {
      // Implement actual analytics fetching logic here
      const analyticsData: Record<string, any> = {};
      const auth = getAuth();
      const currentUser = auth.currentUser?.uid;
      
      for (const userId of userIds) {
        analyticsData[userId] = {
          isCurrentUser: userId === currentUser,
          // Add other analytics data here
        };
      }
      return analyticsData;
    } catch (error: unknown) {
      console.error('Failed to fetch player analytics:', error);
      return {};
    }
  }
  

  public static trackUserEngagement(eventName: string, eventData: Record<string, any>): void {
    const instance = AnalyticsService.getInstance();
    instance.trackEvent(eventName, {
      ...eventData,
      engagement_type: 'user_interaction'
    });
  }

  public static setUserProperties(userId: string, properties: Record<string, any>): void {
    try {
      const instance = AnalyticsService.getInstance();
      setUserProperties(instance.analytics, {
        user_id: userId,
        ...properties
      });
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  public static userSignedIn(data: { 
    userId: string; 
    role: UserRole; 
    type: UserType;
  }): void {
    console.log('User signed in:', data);
    const instance = AnalyticsService.getInstance();
    instance.trackEvent('user_signed_in', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public static userSignedUp(data: {
    userId: string;
    role: UserRole;
  }): void {
    console.log('User signed up:', data);
    const instance = AnalyticsService.getInstance();
    instance.trackEvent('user_signed_up', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  static trackGameInteraction(eventName: string, data: {
    quarterId: string;
    actionType: string;
    metadata: Record<string, any>;
  }): void {
    // Implementation for tracking game interactions
    console.log('Game interaction tracked:', eventName, data);
  }

  static logQuarterStart(quarterId: string): void {
    // Add your analytics logging logic here
    console.log(`Quarter started: ${quarterId}`);
  }

  static logError(error: {
    type: string;
    message: string;
    quarterId: string;
  }): void {
    console.error(`[${error.type}] ${error.message} (Quarter: ${error.quarterId})`);
  }
}

export const analyticsService = AnalyticsService.getInstance();
