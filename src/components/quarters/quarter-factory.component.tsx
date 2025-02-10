import React, { Suspense } from 'react';
import { quarterService } from '../../services/quarter.service';
import { ErrorBoundary } from '../error-boundary.component';
import { AnalyticsService } from '../../services/analytics.service';
import { monitoringService } from '../../services/monitoring.service';
import { Quarter } from '../../types/game.types';

interface QuarterFactoryProps {
  quarterId: string;
}

// Dynamic Quarter Component Loader
export const QuarterFactory: React.FC<QuarterFactoryProps> = ({ quarterId }) => {
  const [QuarterComponent, setQuarterComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [quarterData, setQuarterData] = React.useState<Quarter | null>(null);

  React.useEffect(() => {
    const loadQuarterComponent = async () => {
      const traceStartTime = performance.now(); // Start timing

      try {
        // Use monitoring to track component loading performance
        let traceStartTime = monitoringService.startTrace(`quarter_load_${quarterId}`);

        // Fetch quarter data
        const quarter = await quarterService.getQuarterById(quarterId);

        if (!quarter) {
          throw new Error(`Quarter ${quarterId} not found`);
        }

        setQuarterData(quarter);

        // Dynamically import quarter-specific component
        const dynamicImport = async () => {
          try {
            // This would typically come from a mapping of quarter IDs to dynamic imports
            const module = await import(`./Quarter${quarterId}Component`);
            setQuarterComponent(() => module.default);
          } catch (importError) {
            // Fallback to base quarter component if specific component not found
            const BaseQuarterComponent = await import('../../components/quarters/base-quarter.component');
            setQuarterComponent(() => BaseQuarterComponent.default);
          }
        };

        await dynamicImport();

        // Log successful quarter component load
        AnalyticsService.trackGameInteraction('quarter_component_loaded', {
          quarterId,
          actionType: 'component_load',
          metadata: {
            name: quarter.name
          }
        });

        // Record the performance metric
        const duration = performance.now() - traceStartTime;
        console.debug(`Quarter creation took ${duration}ms`);

        // Optional: Send to monitoring service
        monitoringService.recordMetric('quarter_creation_time', duration);
      } catch (error) {
        // Still record timing even on failure
        const duration = performance.now() - traceStartTime;
        console.error(`Quarter creation failed after ${duration}ms:`, error);

        // Handle loading errors
        AnalyticsService.logError({
          type: 'quarter_load_error',
          message: (error as Error).message,
          quarterId
        });

        throw error;
      } finally {
        if (traceStartTime) {
          monitoringService.endTrace(`quarter_load_${quarterId}`, traceStartTime);
        }
      }
    };

    loadQuarterComponent();
  }, [quarterId]);

  // Render loading or error state
  if (!QuarterComponent) {
    return (
      <div className="quarter-loading">
        <p>Loading Quarter {quarterId}...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={
      <div className="quarter-error">
        Failed to load quarter {quarterId}
      </div>
    }>
      <Suspense fallback={<div>Loading Quarter Components...</div>}>
        <QuarterComponent
          quarterId={quarterId}
          quarterData={quarterData}
        />
      </Suspense>
    </ErrorBoundary>
  );
};