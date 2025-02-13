// src/components/auth/protected-route.component.tsx
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';

const ProtectedRoute: React.FC<{ allowedRoles?: string[]; redirectPath?: string }> = ({
  allowedRoles = [],
  redirectPath = '/login'
}) => {
  const authContext = useAuth();  // Change to authContext for clarity
  const [timeoutError, setTimeoutError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (authContext?.loading) {
        setTimeoutError(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [authContext?.loading]);

  // Early return if context is missing
  if (!authContext) {
    console.error("Auth context is missing! Ensure AuthProvider is wrapping your application.");
    return <Navigate to={redirectPath} replace />;
  }

  const { user, loading } = authContext;

  // Show loading spinner while auth state is being determined
  if (loading && !timeoutError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // Show error if loading timeout occurred
  if (timeoutError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Authentication Error</h2>
          <p className="mt-2">Unable to verify authentication status</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handle unauthenticated or unauthorized access
  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return <Navigate to={redirectPath} replace />;
  }

  // If all checks pass, render the protected content
  return <Outlet />;
};

export default ProtectedRoute;