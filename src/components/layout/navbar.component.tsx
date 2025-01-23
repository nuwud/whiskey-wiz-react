import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth.context';

interface NavUser {
  displayName: string | null;
  email: string | null;
  isAnonymous: boolean;
  role?: string;
}

export const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    // Add signOut functionality here when implementing auth
    navigate('/login');
  };

  const navUser = user as NavUser | null;

  return (
    <nav className="bg-amber-600">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-white text-xl font-bold">
              WhiskeyWiz
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex space-x-4">
              <Link to="/" className="text-white hover:text-amber-200">
                Play
              </Link>
              
              {navUser && !navUser.isAnonymous && (
                <Link to="/profile" className="text-white hover:text-amber-200">
                  Profile
                </Link>
              )}

              {navUser?.role === 'admin' && (
                <Link to="/admin" className="text-white hover:text-amber-200">
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {navUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-white">
                  {navUser.isAnonymous 
                    ? 'Playing as Guest' 
                    : navUser.displayName || navUser.email || 'User'}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-amber-600 bg-white rounded-md hover:bg-amber-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white border border-white rounded-md hover:bg-amber-500"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-amber-600 bg-white rounded-md hover:bg-amber-50"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};