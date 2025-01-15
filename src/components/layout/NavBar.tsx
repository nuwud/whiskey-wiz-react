import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const NavBar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
              
              {user && !user.isAnonymous && (
                <Link to="/profile" className="text-white hover:text-amber-200">
                  Profile
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link to="/admin" className="text-white hover:text-amber-200">
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-white">
                  {user.isAnonymous ? 'Playing as Guest' : user.displayName || user.email}
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