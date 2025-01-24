import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';
import { UserRole } from '../types';

interface PrivateRouteProps {
  adminOnly?: boolean;
  allowedRoles?: UserRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ adminOnly = false, allowedRoles = [] }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/game" />;
  }

  if (allowedRoles.length > 0 && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/game" />;
  }

  return <Outlet />;
};

export default PrivateRoute;