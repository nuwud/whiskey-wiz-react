import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { Quarter } from '../models/Quarter';

class AnalyticsService {
  private analytics: Analytics;

  constructor() {
    this.analytics = getAnalytics();
  }

  // Track game start
  gameStarted(quarterId: string) {
    logEvent(this.analytics, 'game_started', {
      quarter_id: quarterId
    });
  }

  // Track game completion
  gameCompleted(quarterId: string, score: number) {
    logEvent(this.analytics, 'game_completed', {
      quarter_id: quarterId,
      score: score
    });
  }

  // Track score sharing
  scoreShared(method: string) {
    logEvent(this.analytics, 'score_shared', {
      share_method: method
    });
  }

  // Track errors
  trackError(errorMessage: string, context?: string) {
    logEvent(this.analytics, 'error_occurred', {
      error_message: errorMessage,
      context: context || 'unknown'
    });
  }
}

export const analyticsService = new AnalyticsService();