// game-analytics.service.tsx
import { AnalyticsService } from './analytics.service';

export class GameAnalyticsService {
  private static instance: GameAnalyticsService;
  private analyticsService = AnalyticsService.getInstance();

  static getInstance(): GameAnalyticsService {
    if (!GameAnalyticsService.instance) {
      GameAnalyticsService.instance = new GameAnalyticsService();
    }
    return GameAnalyticsService.instance;
  }

  trackGameStart(data: {
    userId: string;
    quarterId: string;
    difficulty: string;
    mode: string;
  }): void {
    this.analyticsService.trackEvent('game_started', data);
  }

  trackGameComplete(data: {
    userId: string;
    quarterId: string;
    score: number;
    timeSpent: number;
  }): void {
    this.analyticsService.trackEvent('game_completed', data);
  }

  trackGuess(data: {
    userId: string;
    quarterId: string;
    sampleId: string;
    guess: any;
    accuracy: number;
    timeSpent: number;
  }): void {
    this.analyticsService.trackEvent('guess_submitted', data);
  }
}

export const gameAnalyticsService = GameAnalyticsService.getInstance();