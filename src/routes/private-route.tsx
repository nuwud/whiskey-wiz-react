import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth.context';
import { UserRole } from '@/types/firebase.types';
import { Spinner } from '@/components/ui/spinner-ui.component';

interface PrivateRouteProps {
  allowedRoles?: UserRole[];
  adminOnly?: boolean;
  children?: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  allowedRoles = [], 
  adminOnly = false,
  children 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};