import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth.context';
import { FeatureProvider } from '@/contexts/feature.context';
import { Layout } from '@/components/layout/layout.component';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FeatureProvider>
        <Layout>
          <Routes>
            {/* Define your routes here */}
            <Route path="/" element={<div>Home Page</div>} />
            {/* Add more routes as needed */}
          </Routes>
        </Layout>
      </FeatureProvider>
    </AuthProvider>
  );
};

export default App;