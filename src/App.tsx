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