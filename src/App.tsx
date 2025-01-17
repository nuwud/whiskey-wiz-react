import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FeatureProvider } from './contexts/FeatureContext';

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
import PrivateRoute from './components/PrivateRoute';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FeatureProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <div className="min-h-screen bg-gray-50">
                <main className="container mx-auto py-8">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Game Routes */}
                    <Route element={<PrivateRoute />}>
                      <Route path="/" element={<GameContainer />} />
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
                </main>
              </div>
            </Suspense>
          </Router>
        </FeatureProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;