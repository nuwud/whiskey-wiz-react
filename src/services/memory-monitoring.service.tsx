// memory-monitoring.service.tsx
import { AnalyticsService } from './analytics.service';

interface MemoryMetrics {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

export class MemoryMonitoringService {
    private static instance: MemoryMonitoringService;
    private readonly MEMORY_WARNING_THRESHOLD = 0.8;
    private memoryWarningIssued = false;
    private analyticsService = AnalyticsService.getInstance();

    static getInstance(): MemoryMonitoringService {
        if (!MemoryMonitoringService.instance) {
            MemoryMonitoringService.instance = new MemoryMonitoringService();
        }
        return MemoryMonitoringService.instance;
    }

    monitorMemory(): void {
        if (!('memory' in performance)) return;

        const memory = (performance as any).memory as MemoryMetrics;
        const usagePercentage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (usagePercentage > this.MEMORY_WARNING_THRESHOLD && !this.memoryWarningIssued) {
            this.analyticsService.trackEvent('memory_warning', {
                usedHeap: memory.usedJSHeapSize,
                totalHeap: memory.totalJSHeapSize,
                heapLimit: memory.jsHeapSizeLimit,
                usagePercentage
            });
            this.memoryWarningIssued = true;
        } else if (usagePercentage <= this.MEMORY_WARNING_THRESHOLD) {
            this.memoryWarningIssued = false;
        }
    }
}

export const memoryMonitoringService = MemoryMonitoringService.getInstance();