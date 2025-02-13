import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';
import { UserRole } from '../types/auth.types';
import { Spinner } from '../components/ui/spinner-ui.component';

interface PrivateRouteProps {
  allowedRoles?: UserRole[];
  adminOnly?: boolean;
  children?: React.ReactNode;
  redirectPath?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  allowedRoles = [],
  adminOnly = false,
  children,
  redirectPath = '/login'
}) => {
  const { user, loading } = useAuth();

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

  const userRole = user.role as UserRole;

  if (adminOnly && userRole !== UserRole.ADMIN) {
    return <Navigate to="/game" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/game" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;
