import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
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
          <Router>
            <Layout>
              <AppRoutes />
            </Layout>
          </Router>
        </QuarterProvider>
      </FeatureProvider>
    </AuthProvider>
  );
};

export default App;