import { getAnalytics, logEvent, Analytics, setUserProperties } from 'firebase/analytics';
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

class AnalyticsService {
  private analytics: Analytics;

  constructor() {
    this.analytics = analytics;
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
}

export const analyticsService = new AnalyticsService();