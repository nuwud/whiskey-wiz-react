import { AnalyticsService } from './analytics.service';

interface PerformanceMetric {
  name: string;
  duration: number;
  startTime: number;
  context?: string;
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

class MonitoringService {
  private performanceEntries: Map<string, number> = new Map();
  private thresholds: Map<string, number> = new Map([
    ['game_load', 2000],
    ['sample_render', 500],
    ['guess_submission', 1000],
    ['analytics_event', 200]
  ]);
  private readonly MEMORY_THRESHOLD = 0.8; // 80% of heap limit
  private memoryWarningLogged = false;
  private activeTraces: Map<string, number> = new Map();

  startTrace(traceName: string, context?: string) {
    try {
      if (this.activeTraces.has(traceName)) {
        console.warn(`Trace ${traceName} already exists`);
        return;
      }
      const startTime = performance.now();
      this.performanceEntries.set(traceName, startTime);
      this.activeTraces.set(traceName, Date.now());

      if (context) {
        AnalyticsService.trackError(`Trace started: ${traceName}`, context);
      }
    } catch (error) {
      console.error('Failed to start trace:', error);
      AnalyticsService.trackError('Failed to start trace', 'monitoring_service');
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

      const startTimestamp = this.activeTraces.get(traceName);
      if (!startTimestamp) {
        console.warn(`No start time found for trace: ${traceName}`);
        return;
      }
      const durationTimestamp = Date.now() - startTimestamp;
      this.activeTraces.delete(traceName);
      console.debug(`Trace ${traceName} completed in ${durationTimestamp}ms`);

      return duration;
    } catch (error) {
      console.error('Failed to end trace:', error);
      AnalyticsService.trackError('Failed to end trace', 'monitoring_service');
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
      AnalyticsService.trackError('Performance metric logged', 'monitoring_service');

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
      AnalyticsService.trackError(
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
      if (!('memory' in performance)) {
        return; // Early return if memory metrics not available
      }

      const memory = (performance as any).memory as MemoryMetrics;
      const metrics = {
        usedMB: memory.usedJSHeapSize / (1024 * 1024),
        totalMB: memory.totalJSHeapSize / (1024 * 1024),
        limitMB: memory.jsHeapSizeLimit / (1024 * 1024),
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };

      // Track regular metrics
      AnalyticsService.trackMetrics({
        name: 'memory_metrics',
        ...metrics,
        timestamp: new Date().toISOString()
      });
      // Handle memory warnings
      if (metrics.usagePercentage > this.MEMORY_THRESHOLD * 100) {
        if (!this.memoryWarningLogged) {
          AnalyticsService.trackError(
            `High memory usage: ${metrics.usagePercentage.toFixed(1)}%`,
            'monitoring_service'
          );
          this.memoryWarningLogged = true;
        }
      } else {
        this.memoryWarningLogged = false;
      }

      // Log in development
      if (import.meta.env.DEV) {
        console.log('Memory Usage:', metrics);
      }
    } catch (error) {
      console.error('Failed to log memory metrics:', error);
    }
  }

  clearTrace(traceName: string): void {
    this.activeTraces.delete(traceName);
  }
}

export const formatMemoryMetrics = (memory: MemoryMetrics) => {
  const bytesToMB = (bytes: number) => bytes / (1024 * 1024);

  return {
    usedMB: bytesToMB(memory.usedJSHeapSize),
    totalMB: bytesToMB(memory.totalJSHeapSize),
    limitMB: bytesToMB(memory.jsHeapSizeLimit),
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
  };
};

export const monitoringService = new MonitoringService();