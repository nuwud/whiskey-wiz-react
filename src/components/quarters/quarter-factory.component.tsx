import React, { lazy, Suspense } from 'react';
import { QuarterService, Quarter } from '../../services/QuarterService';
import { ErrorBoundary } from '../error-boundary.component';
import { AnalyticsService } from '../../services/AnalyticsService';
import { MonitoringService } from '../../services/MonitoringService';

interface QuarterFactoryProps {
  quarterId: string;
}

// Dynamic Quarter Component Loader
export const QuarterFactory: React.FC<QuarterFactoryProps> = ({ quarterId }) => {
  const [QuarterComponent, setQuarterComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [quarterData, setQuarterData] = React.useState<Quarter | null>(null);

  React.useEffect(() => {
    const loadQuarterComponent = async () => {
      try {
        // Use monitoring to track component loading performance
        MonitoringService.startTrace(`quarter_load_${quarterId}`);

        // Fetch quarter data
        const quarterService = new QuarterService();
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
            const BaseQuarterComponent = await import('./BaseQuarterComponent');
            setQuarterComponent(() => BaseQuarterComponent.default);
          }
        };

        await dynamicImport();

        // Log successful quarter component load
        AnalyticsService.trackGameInteraction('quarter_component_loaded', {
          quarterId,
          quarterName: quarter.name
        });
      } catch (error) {
        // Handle loading errors
        AnalyticsService.logError({
          type: 'quarter_load_error',
          message: (error as Error).message,
          quarterId
        });
      } finally {
        MonitoringService.endTrace(`quarter_load_${quarterId}`);
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