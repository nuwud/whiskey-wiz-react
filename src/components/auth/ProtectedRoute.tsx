import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';
import { Spinner } from '../ui/Spinner';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  allowedRoles = [], 
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <Spinner />;
  }

  // If auth is required and user isn't logged in, redirect to login
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // If there are allowed roles and user's role isn't in them, redirect to home
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If user is logged in but accessing auth pages, redirect to home
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};