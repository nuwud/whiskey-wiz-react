import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from '../firebaseConfig';

const analytics = getAnalytics(app);

export const AnalyticsService = {
  logQuarterStart(quarterId: string) {
    logEvent(analytics, 'quarter_start', { quarter_id: quarterId });
  },

  logGuess(quarterId: string, result: { points: number, correct: boolean }) {
    logEvent(analytics, 'whiskey_guess', {
      quarter_id: quarterId,
      points_earned: result.points,
      guess_accuracy: result.correct
    });
  },

  trackUserEngagement(action: string, details?: any) {
    logEvent(analytics, action, details || {});
  }
};