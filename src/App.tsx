import React from 'react';
import { FeatureProvider } from './contexts/feature.context';
import { QuarterProvider } from './contexts/quarter.context';
import { Layout } from './components/layout/layout.component';
import { AppRoutes } from './routes';
import { ToastProvider } from './hooks/use-toast.hook';
import { Toaster } from './components/ui/toaster-ui.component';

const App: React.FC = () => {
  return (
      <ToastProvider>
          <FeatureProvider>
            <QuarterProvider>
              <Layout>
                <AppRoutes />
              </Layout>
            </QuarterProvider>
          </FeatureProvider>
        <Toaster />
      </ToastProvider >
  );
};

export default App;