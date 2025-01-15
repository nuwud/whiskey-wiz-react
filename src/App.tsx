<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { GameBoard } from './components/game/GameBoard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PlayerProfile } from './components/player/PlayerProfile';
import { useAuthStore } from './store/authStore';

function App() {
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route element={<ProtectedRoute requireAuth={false} />}>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
        </Route>

        {/* Protected routes */}
        <Route element={<Layout />}>
          {/* Routes for all authenticated users (including guests) */}
          <Route element={<ProtectedRoute requireAuth={true} />}>
            <Route path="/" element={<GameBoard />} />
          </Route>

          {/* Routes only for registered players */}
          <Route 
            element={
              <ProtectedRoute 
                requireAuth={true} 
                allowedRoles={['player', 'admin']} 
              />
            }
          >
            <Route path="/profile" element={<PlayerProfile />} />
          </Route>

          {/* Admin-only routes */}
          <Route 
            element={
              <ProtectedRoute 
                requireAuth={true} 
                allowedRoles={['admin']} 
              />
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
||||||| empty tree
=======
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import Error Handling
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load components for performance
const Login = React.lazy(() => import('./components/auth/Login'));
const Register = React.lazy(() => import('./components/auth/Register'));
const GameContainer = React.lazy(() => import('./components/game/GameContainer'));
const ResultsView = React.lazy(() => import('./components/results/ResultsView'));
const AdminQuarterManagement = React.lazy(() => import('./components/admin/AdminQuarterManagement'));

// New Feature Components
const SeasonalTrends = React.lazy(() => import('./components/SeasonalTrends'));
const AchievementBadges = React.lazy(() => import('./components/AchievementBadges'));
const FlavorWheel = React.lazy(() => import('./components/FlavorWheel'));
const WhiskeyRecommendations = React.lazy(() => import('./components/WhiskeyRecommendations'));

// Import private route and styles
import PrivateRoute from './components/PrivateRoute';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Game Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/game" element={<GameContainer />} />
                <Route path="/results" element={<ResultsView />} />
                
                {/* New Feature Routes */}
                <Route path="/trends" element={<SeasonalTrends />} />
                <Route path="/achievements" element={<AchievementBadges />} />
                <Route path="/flavor-wheel" element={<FlavorWheel />} />
                <Route path="/recommendations" element={<WhiskeyRecommendations />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<PrivateRoute adminOnly />}>
                <Route path="/admin" element={<AdminQuarterManagement />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Login />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
>>>>>>> 8178bd0910923a70f68e906db6195c9b7ffedd35
