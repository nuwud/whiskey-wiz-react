import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/auth.context';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signInAsGuest, error, loading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      await signIn(email, password);
      // Wait for auth to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to sign in:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Skip authentication completely for fastest guest access
  const handleDirectGuestPlay = () => {
    // Clear any previous state that might cause issues
    localStorage.removeItem('guestToken');
    localStorage.removeItem('guestSessionToken');
    localStorage.removeItem('guestSessionExpiry');

    const featuredQuarterId = '1224';

    // Go directly to quarter selection
    navigate(`/game/${featuredQuarterId}`);
  };

  const handleGuestPlay = async () => {
    try {
      setIsProcessing(true);
      await signInAsGuest();
      // Give time for auth to process
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate('/');  // Navigate to quarters selection
    } catch (err) {
      console.error('Failed to sign in as guest:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Welcome to Whiskey Wiz</h2>

      {/* Direct Play Button (No Auth) */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleDirectGuestPlay}
          className="w-full py-3 px-4 border-2 border-green-700 rounded-md shadow-lg text-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all duration-200 transform hover:scale-105 flex flex-col items-center justify-center"
        >
          <span className="text-2xl">PLAY NOW</span>
          <span className="text-sm font-normal mt-1">Instant access, no sign-up required</span>
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or sign in</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error.message}</div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading || isProcessing}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            {loading || isProcessing ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleGuestPlay}
            disabled={loading || isProcessing}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Sign in as Guest
          </button>
        </div>
      </form>

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-600">Don't have an account? </span>
        <Link
          to="/register"
          className="text-sm text-amber-600 hover:text-amber-500"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;