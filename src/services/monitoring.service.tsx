import { AnalyticsService } from './analytics.service';

interface TraceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: 'measure';
}

export class MonitoringService {
    private performanceEntries: TraceEntry[] = [];
    private activeTraces: Map<string, number> = new Map();
    private thresholds = { responseTime: 200, memoryUsage: 500000000 };
    private MEMORY_THRESHOLD = 1000000000;
    private memoryWarningLogged = false;

    startTrace(name: string): number {
        const startTime = window.performance.now();
        this.activeTraces.set(name, startTime);
        
        this.performanceEntries.push({
            name,
            startTime,
            duration: 0,
            entryType: 'measure'
        });
        
        return startTime;
    }

    endTrace(traceName: string, startTime: number): number {
        if (!this.activeTraces.has(traceName)) {
            console.warn(`No active trace found for ${traceName}`);
            return 0;
        }

        const endTime = window.performance.now();
        const duration = endTime - startTime;

        const traceIndex = this.performanceEntries.findIndex(entry => entry.name === traceName);
        if (traceIndex !== -1) {
            this.performanceEntries[traceIndex].duration = duration;
            this.logPerformance(this.performanceEntries[traceIndex]);
        }

        this.activeTraces.delete(traceName);
        console.log(`Trace completed: ${traceName}, Duration: ${duration}ms`);
        return duration;
    }

    private logPerformance(trace: TraceEntry): void {
        if (trace.duration > this.thresholds.responseTime) {
            console.warn(`Performance warning: ${trace.name} took ${trace.duration}ms`);
            AnalyticsService.trackEvent('performance_warning', {
                name: trace.name,
                duration: trace.duration,
            });
        }
    }

    checkMemoryUsage(): void {
        const used = process.memoryUsage().heapUsed;
        if (used > this.MEMORY_THRESHOLD && !this.memoryWarningLogged) {
            console.warn('High memory usage detected:', used);
            AnalyticsService.trackEvent('high_memory_usage', { memoryUsage: used });
            this.memoryWarningLogged = true;
        }
    }

    recordMetric(metricName: string, value: number): void {
        console.log(`Metric ${metricName}: ${value}`);
    }
}

export const monitoringService = new MonitoringService();