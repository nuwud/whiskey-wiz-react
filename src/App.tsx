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

// Import private route and styles
import PrivateRoute from './routes/PrivateRoute';
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