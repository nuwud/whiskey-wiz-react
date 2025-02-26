import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';
import { UserRole } from '../../types/auth.types';
import { Spinner } from '../ui/spinner-ui.component';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  adminOnly?: boolean;
  children?: React.ReactNode;
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles = [],
  adminOnly = false,
  children,
  redirectPath = '/login'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // ALLOW GAME ACCESS: If the route is related to gameplay, allow access without authentication
  const isGameRoute = location.pathname.startsWith('/game/');
  if (isGameRoute) {
    return children ? <>{children}</> : <Outlet />;
  }
  
  const userRole = user?.role as UserRole;
  const isAllowed = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (!isAllowed) {
    return <Navigate to="/game" replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (adminOnly && userRole !== UserRole.ADMIN) {
    return <Navigate to="/game" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/game" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;