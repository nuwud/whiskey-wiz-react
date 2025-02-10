// error-tracking.service.tsx
import { AnalyticsService } from './analytics.service';

export class ErrorTrackingService {
    private static instance: ErrorTrackingService;

    static getInstance(): ErrorTrackingService {
        if (!ErrorTrackingService.instance) {
            ErrorTrackingService.instance = new ErrorTrackingService();
        }
        return ErrorTrackingService.instance;
    }

    trackError(error: Error | string, context: string, userId?: string): void {
        const errorMessage = error instanceof Error ? error.message : error;
        const errorStack = error instanceof Error ? error.stack : undefined;

        AnalyticsService.getInstance().trackEvent('error', {
            error: errorMessage,
            stack: errorStack,
            context,
            userId
        });
    }
}

export const errorTrackingService = ErrorTrackingService.getInstance();