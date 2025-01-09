import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { User } from 'firebase/auth';

class AnalyticsService {
  private analytics;

  constructor() {
    const firebaseConfig = {
      // Your Firebase config
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      // ... other config
    };

    const app = initializeApp(firebaseConfig);
    this.analytics = getAnalytics(app);
  }

  // Track game start
  trackGameStart(quarterId: string) {
    logEvent(this.analytics, 'game_start', {
      quarter_id: quarterId
    });
  }

  // Track game completion
  trackGameCompletion(score: number, quarterId: string) {
    logEvent(this.analytics, 'game_complete', {
      score,
      quarter_id: quarterId
    });
  }

  // Set user ID for tracking
  setUser(user: User | null) {
    if (user) {
      setUserId(this.analytics, user.uid);
      setUserProperties(this.analytics, {
        email: user.email || 'unknown',
        display_name: user.displayName || 'Anonymous'
      });
    }
  }

  // Track custom events
  trackEvent(eventName: string, eventData?: Record<string, any>) {
    logEvent(this.analytics, eventName, eventData);
  }
}

export default new AnalyticsService();