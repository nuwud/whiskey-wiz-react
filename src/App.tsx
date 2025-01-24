import React from 'react';
import { AuthProvider } from '@/contexts/auth.context';
import { FeatureProvider } from '@/contexts/feature.context';
import { Layout } from '@/components/layout/layout.component';
import { AppRoutes } from '@/routes';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FeatureProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </FeatureProvider>
    </AuthProvider>
  );
};

export default App;