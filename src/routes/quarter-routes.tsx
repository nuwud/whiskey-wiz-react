import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QuarterFactory } from '../components/quarters/quarter-factory.component';
import { useAuth } from 'src/contexts/auth.context';
import { useFeatures } from '../config/feature-flags.config';
import { quarterService } from 'src/services/quarter.service';

export const QuarterRoutes: React.FC = () => {
  const { user } = useAuth();
  const { features } = useFeatures();

  // Dynamic route generation based on available quarters
  const [quarterRoutes, setQuarterRoutes] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchAvailableQuarters = async () => {
        try {
            const quarters = await quarterService.getAllQuarters();
            if (!quarters.length) {
                console.warn("No quarters found");
                return;
            }
            setQuarterRoutes(quarters.map(q => `/quarters/${q.id}`));
        } catch (error) {
            console.error("Failed to fetch quarters", error);
        }
    };

    fetchAvailableQuarters();
}, []);

  // Check if user is allowed to access quarters
  const canAccessQuarters = () => {
    return user || features.GUEST_MODE;
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