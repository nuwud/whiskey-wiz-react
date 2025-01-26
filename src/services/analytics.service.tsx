import { logEvent, Analytics, setUserProperties } from 'firebase/analytics';
import { analytics } from '@/config/firebase';
import { UserRole } from '@/types/firebase.types';

interface GameEvent {
  quarterId: string;
  userId?: string;
  score?: number;
  sampleId?: string;
  accuracy?: number;
  timeSpent?: number;
}

interface UserEvent {
  userId: string;
  role?: UserRole;
  preference?: string;
  action?: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private analytics: Analytics;

  constructor() {
    if (!analytics) {
      throw new Error('Firebase analytics is not initialized');
    }
    this.analytics = analytics;
  }

  logError(error: any) {
    console.error('[AnalyticsService]:', error);
  }

  // Game Events
  gameStarted({ quarterId, userId }: GameEvent) {
    try {
      logEvent(this.analytics, 'game_started', {
        quarter_id: quarterId,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - game_started:', error);
    }
  }

  gameCompleted({ quarterId, userId, score, timeSpent }: GameEvent) {
    try {
      logEvent(this.analytics, 'game_completed', {
        quarter_id: quarterId,
        user_id: userId,
        score,
        time_spent: timeSpent,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - game_completed:', error);
    }
  }

  sampleGuessed({ quarterId, userId, sampleId, accuracy, timeSpent }: GameEvent) {
    try {
      logEvent(this.analytics, 'sample_guessed', {
        quarter_id: quarterId,
        user_id: userId,
        sample_id: sampleId,
        accuracy,
        time_spent: timeSpent,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - sample_guessed:', error);
    }
  }

  // User Events
  userSignedUp({ userId, role }: UserEvent) {
    try {
      logEvent(this.analytics, 'user_signed_up', {
        user_id: userId,
        role,
        timestamp: new Date().toISOString()
      });
      this.setUserRole(userId, role);
    } catch (error) {
      console.error('Analytics error - user_signed_up:', error);
    }
  }

  userSignedIn({ userId, role }: UserEvent) {
    try {
      logEvent(this.analytics, 'user_signed_in', {
        user_id: userId,
        role,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - user_signed_in:', error);
    }
  }

  userPreferenceSet({ userId, preference }: UserEvent) {
    try {
      logEvent(this.analytics, 'preference_set', {
        user_id: userId,
        preference,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - preference_set:', error);
    }
  }

  // Social Events
  scoreShared({ userId, action }: UserEvent) {
    try {
      logEvent(this.analytics, 'score_shared', {
        user_id: userId,
        share_method: action,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - score_shared:', error);
    }
  }

  // Error Tracking
  trackError(errorMessage: string, context: string, userId?: string) {
    try {
      logEvent(this.analytics, 'error_occurred', {
        error_message: errorMessage,
        context,
        user_id: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - error_occurred:', error);
    }
  }

  private setUserRole(userId: string, role?: UserRole) {
    try {
      setUserProperties(this.analytics, {
        user_id: userId,
        user_role: role
      });
    } catch (error) {
      console.error('Analytics error - setUserRole:', error);
    }
  }

  public static trackUserEngagement(action: string, data: Record<string, any>) {
    if (!AnalyticsService.instance) {
      throw new Error('Analytics service is not initialized');
    }
    // Check if user is logged in and has a valid role
    try {
      logEvent(AnalyticsService.instance.analytics, action, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - trackUserEngagement:', error);
    }
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public static trackEvent(_action: string, _data: Record<string, any>) {
    try {
      logEvent(AnalyticsService.instance.analytics, _action, {
        ...(_data as Record<string, any>),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - trackEvent:', error);
    }
  }

  public static setUserProperties(_userId: string, _properties: Record<string, any>) {
    try {
      setUserProperties(AnalyticsService.instance.analytics, {
        user_id: _userId,
        ..._properties
      });
    } catch (error) {
      console.error('Analytics error - setUserProperties:', error);
    }
  }

  public static trackError(_errorMessage: string, _context: string, _userId?: string) {
    try {
      logEvent(AnalyticsService.instance.analytics, 'error_occurred', {
        error_message: _errorMessage,
        context: _context,
        user_id: _userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - trackError:', error);
    }
  }

  public static startTrace(_traceName: string, _context?: string) {
    try {
      logEvent(AnalyticsService.instance.analytics, 'trace_start', {
        trace_name: _traceName,
        context: _context,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics error - startTrace:', error);
    }
  }

  public static async measureAsync<T>(
    _traceName: string,
    asyncFn: () => Promise<T>,
    _context?: string
  ): Promise<T> {
    try {
      const startTime = performance.now();
      const result = await asyncFn();
      const duration = performance.now() - startTime;
      // Log the duration with your analytics system
      logEvent(AnalyticsService.instance.analytics, 'trace_duration', {
        trace_name: _traceName,
        duration,
        context: _context,
        timestamp: new Date().toISOString()
      });
      console.log(`Trace ${_traceName} took ${duration}ms`);
      return result;
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }
  static logError(_error: unknown) {
    throw new Error('Method not implemented.');
    // Implement error logging using your preferred method
    // For example, using console.error() or your preferred error logging service
    // Log the error message, stack trace, and any other relevant information
    // This method should be called whenever an error occurs in your application
    // It should also be called when you call the trackError() method
    // to log errors that occur during user interactions or other events in your application
    // You can also use this method to log errors that occur in your asynchronous functions
    // to provide more detailed error information in your analytics system
  }
}

export interface SampleAnalytics {
  sampleId: string;
  totalAttempts: number;
  averageAccuracy: {
    age: number;
    proof: number;
    mashbill: number;
  };
  machineLearningSuggestions: {
    recommendedMerchandise: string[];
    potentialSubscriptionTargets: string[];
    marketingSegments: string[];
  };
  playerDemographics: {
    authMethodBreakdown: Record<string, number>;
    ageBreakdown: Record<string, number>;
    regionDistribution: Record<string, number>;
    countryDistribution: Record<string, number>;
    favoriteWhiskey?: string;
  };
  samplePerformance: {
    accuracy: number;
    completion: number;
  };
  challengePerformance: {
    score: number;
    time: number;
  };
  playerChallenges: any[];
  playerProfile: {
    level: number;
    rank: string;
  };
  playerLeaderboard: {
    position: number;
    score: number;
  };
  playerStats: {
    attempts: number;
    successRate: number;
  };
}

export const analyticsService = new AnalyticsService();