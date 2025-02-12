import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';

const ProtectedRoute: React.FC<{ allowedRoles?: string[]; redirectPath?: string }> = ({
  allowedRoles = [],
  redirectPath = '/login'
}) => {
  const auth = useAuth(); // Ensure context is available

  if (!auth) {
    console.error("Auth context is missing! Ensure AuthProvider is wrapping your application.");
    return <Navigate to={redirectPath} replace />;
  }

  const { user, loading } = auth;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
