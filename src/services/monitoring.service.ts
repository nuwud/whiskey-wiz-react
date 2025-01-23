import { analyticsService } from './analytics.service';

interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
  context?: string;
}

class MonitoringService {
  private performanceEntries: Map<string, number> = new Map();
  private thresholds: Map<string, number> = new Map([
    ['game_load', 2000],
    ['sample_render', 500],
    ['guess_submission', 1000],
    ['analytics_event', 200]
  ]);

  startTrace(traceName: string, context?: string) {
    try {
      const startTime = performance.now();
      this.performanceEntries.set(traceName, startTime);
      
      if (context) {
        analyticsService.trackError(`Trace started: ${traceName}`, context);
      }
    } catch (error) {
      console.error('Failed to start trace:', error);
      analyticsService.trackError('Failed to start trace', 'monitoring_service');
    }
  }

  endTrace(traceName: string, context?: string) {
    try {
      const startTime = this.performanceEntries.get(traceName);
      if (!startTime) {
        throw new Error(`No start time found for trace: ${traceName}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log performance data
      this.logPerformanceMetric({
        name: traceName,
        duration,
        startTime,
        context
      });

      // Check against thresholds
      this.checkPerformanceThreshold(traceName, duration);

      // Clean up
      this.performanceEntries.delete(traceName);

      return duration;
    } catch (error) {
      console.error('Failed to end trace:', error);
      analyticsService.trackError('Failed to end trace', 'monitoring_service');
      return 0;
    }
  }

  async measureAsync<T>(
    traceName: string,
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    this.startTrace(traceName, context);
    try {
      const result = await asyncFn();
      this.endTrace(traceName, context);
      return result;
    } catch (error) {
      this.endTrace(traceName, 'error');
      throw error;
    }
  }

  setPerformanceThreshold(metricName: string, threshold: number) {
    this.thresholds.set(metricName, threshold);
  }

  private logPerformanceMetric(metric: PerformanceMetric) {
    try {
      // Log to analytics
      analyticsService.trackError('Performance metric logged', 'monitoring_service');

      // Log to console in development
      if (import.meta.env.DEV) {
        console.log(`Performance metric - ${metric.name}:`, {
          duration: `${metric.duration.toFixed(2)}ms`,
          context: metric.context
        });
      }
    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }
  }

  private checkPerformanceThreshold(metricName: string, duration: number) {
    const threshold = this.thresholds.get(metricName);
    if (threshold && duration > threshold) {
      analyticsService.trackError(
        `Performance threshold exceeded: ${metricName}`,
        'monitoring_service'
      );
      
      if (import.meta.env.DEV) {
        console.warn(
          `Performance warning: ${metricName} took ${duration.toFixed(2)}ms ` +
          `(threshold: ${threshold}ms)`
        );
      }
    }
  }

  // Browser-specific memory metrics
  logMemoryMetrics() {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        analyticsService.trackError('Memory metrics logged', 'monitoring_service');
      }
    } catch (error) {
      console.error('Failed to log memory metrics:', error);
    }
  }
}

export const monitoringService = new MonitoringService();