// performance.service.tsx
import { AnalyticsService } from './analytics.service';
import { errorTrackingService } from './error-tracking.service';

export class PerformanceService {
    private static instance: PerformanceService;
    private performanceMarks: Map<string, number> = new Map();
    private analyticsService = AnalyticsService.getInstance();

    public static getInstance(): PerformanceService {
        if (!PerformanceService.instance) {
            PerformanceService.instance = new PerformanceService();
        }
        return PerformanceService.instance;
    }

    startTrace(name: string, context?: string): void {
        this.performanceMarks.set(name, performance.now());
        this.analyticsService.trackEvent('trace_start', { name, context });
    }

    endTrace(name: string, context?: string): number {
        const startTime = this.performanceMarks.get(name);
        if (!startTime) return 0;

        const duration = performance.now() - startTime;
        this.performanceMarks.delete(name);
        this.analyticsService.trackEvent('trace_end', { name, duration, context });

        return duration;
    }

    async measureAsync<T>(
        name: string,
        operation: () => Promise<T>,
        context?: string
    ): Promise<T> {
        try {
            this.startTrace(name, context);
            const result = await operation();
            this.endTrace(name, context);
            return result;
        } catch (error) {
            this.endTrace(name, 'error');
            // Use error tracking service
            errorTrackingService.trackError(error as Error, `async_operation_${name}`);
            throw error;
        }
    }
}

export const performanceService = PerformanceService.getInstance();