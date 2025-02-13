import React from 'react';
import { FeatureProvider } from './contexts/feature.context';
import { QuarterProvider } from './contexts/quarter.context';
import { Layout } from './components/layout/layout.component';
import { AppRoutes } from './routes';

const App: React.FC = () => {
  return (
        <FeatureProvider>
          <QuarterProvider>
            <Layout>
              <AppRoutes />
            </Layout>
          </QuarterProvider>
        </FeatureProvider>
  );
};

export default App;