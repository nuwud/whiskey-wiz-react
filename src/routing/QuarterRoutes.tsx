import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QuarterFactory } from '../components/quarters/QuarterFactory';
import { useAuth } from '../services/AuthContext';
import { FeatureFlags } from '../config/featureFlags';
import { QuarterService } from '../services/QuarterService';

export const QuarterRoutes: React.FC = () => {
  const { user } = useAuth();

  // Dynamic route generation based on available quarters
  const [quarterRoutes, setQuarterRoutes] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchAvailableQuarters = async () => {
      try {
        const quartersService = new QuarterService();
        const quarters = await quartersService.getAvailableQuarters();
        
        // Generate routes for each quarter
        const routes = quarters.map(quarter => `/quarters/${quarter.id}`);
        setQuarterRoutes(routes);
      } catch (error) {
        console.error('Failed to fetch quarters', error);
      }
    };

    fetchAvailableQuarters();
  }, []);

  // Check if user is allowed to access quarters
  const canAccessQuarters = () => {
    return user || FeatureFlags.isEnabled('GUEST_MODE');
  };

  return (
    <Routes>
      {quarterRoutes.map(route => (
        <Route 
          key={route} 
          path={route} 
          element={
            canAccessQuarters() ? (
              <QuarterFactory quarterId={route.split('/').pop() || ''} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      ))}
      
      {/* Fallback route */}
      <Route 
        path="/quarters/*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
};