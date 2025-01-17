import { auth } from '@/lib/firebase';

type EventType = 'game_start' | 'challenge_complete' | 'quarter_complete' | 'error';

interface AnalyticsEvent {
  type: EventType;
  userId?: string;
  timestamp: Date;
  data: Record<string, any>;
}

class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async trackEvent(type: EventType, data: Record<string, any> = {}): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        type,
        userId: auth.currentUser?.uid,
        timestamp: new Date(),
        data
      };

      // Log event for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics Event:', event);
      }

      // Implement real analytics tracking here
      // e.g., Firebase Analytics, Google Analytics, etc.
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  trackGameStart(quarterId: string): void {
    this.trackEvent('game_start', { quarterId });
  }

  trackChallengeComplete(challengeId: string, score: number): void {
    this.trackEvent('challenge_complete', { challengeId, score });
  }

  trackQuarterComplete(quarterId: string, finalScore: number): void {
    this.trackEvent('quarter_complete', { quarterId, finalScore });
  }

  trackError(error: Error, context?: string): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context
    });
  }
}

export const analyticsService = AnalyticsService.getInstance();