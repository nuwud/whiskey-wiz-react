import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth.context';
import { Spinner } from '@/components/ui/spinner-ui.component';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

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

  const userRole = user?.role as UserRole | undefined;

  // If auth is required and user isn't logged in, redirect to login
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // If there are allowed roles and user's role isn't in them, redirect to home
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // If user is logged in but accessing auth pages, redirect to home
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};