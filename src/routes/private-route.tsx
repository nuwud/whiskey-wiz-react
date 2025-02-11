import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';
import { Spinner } from '../components/ui/spinner-ui.component';
import { UserRole } from '../types/auth.types';

interface PrivateRouteProps {
  allowedRoles?: UserRole[];
  adminOnly?: boolean;
  children?: React.ReactNode;
  redirectPath?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  allowedRoles = [],
  adminOnly = false,
  children,
  redirectPath = '/login'
}) => {
  const { user, loading } = useAuth();
  const isAdmin = UserRole.ADMIN;
  
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

  if (adminOnly && !isAdmin) {
    return <Navigate to="/game" replace />;
  }

  if (allowedRoles.length > 0 && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/game" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

