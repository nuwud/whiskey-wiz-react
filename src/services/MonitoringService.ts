import { AnalyticsService } from './AnalyticsService';

export class MonitoringService {
  private static performanceEntries: Record<string, number> = {};

  static startTrace(traceName: string) {
    this.performanceEntries[traceName] = Date.now();
  }

  static endTrace(traceName: string) {
    const startTime = this.performanceEntries[traceName];
    if (startTime) {
      const duration = Date.now() - startTime;
      
      AnalyticsService.trackPerformanceMetric(traceName, duration);
      
      if (duration > 1000) {  // Log performance warnings
        console.warn(`Performance warning: ${traceName} took ${duration}ms`);
      }

      // Clean up
      delete this.performanceEntries[traceName];
    }
  }

  static measureAsync<T>(
    traceName: string, 
    asyncFn: () => Promise<T>
  ): Promise<T> {
    this.startTrace(traceName);
    return asyncFn().finally(() => {
      this.endTrace(traceName);
    });
  }

  static logMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      AnalyticsService.trackUserEngagement('memory_usage', {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed
      });
    }
  }
}