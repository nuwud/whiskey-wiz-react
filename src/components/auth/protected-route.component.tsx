import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { Spinner } from '../../components/ui/spinner-ui.component';
import { UserRole } from '../../types/auth.types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles = [],
  requireAuth = true,
  children
}) => {
  const { user, loading: isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  const role = user?.role ?? UserRole.PLAYER;


  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};