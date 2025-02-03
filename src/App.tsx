import React from 'react';
import { AuthProvider } from './contexts/auth.context';
import { FeatureProvider } from './contexts/feature.context';
import { QuarterProvider } from './contexts/quarter.context';
import { Layout } from './components/layout/layout.component';
import { AppRoutes } from './routes';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FeatureProvider>
        <QuarterProvider>
        <Layout>
          <AppRoutes />
        </Layout>
        </QuarterProvider>
      </FeatureProvider>
    </AuthProvider>
  );
};

export default App;