import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PrivateRoute } from '../routes/private-route';
import { UserRole } from '../types/auth.types';
import { GameErrorBoundary } from '../components/game/game-error-boundary.component';

// Auth Components
import { Login } from '../components/auth/login.component';
import { SignUp } from '../components/auth/sign-up.component';
import { ForgotPassword } from '../components/auth/forgot-password.component';
import { VerifyEmail } from '../components/auth/verify-email.component';

// Game Components
import { GameContainer } from '../components/game/game-container.component';
import { QuarterSelection } from '../components/game/quarter-selection.component';
import { GameResults } from '../components/game/game-results.component'; 

// Admin Components
import AdminDashboard from '../components/admin/admin-dashboard.component';
import UserManagement from '../components/admin/user-management.component';
import QuarterManagement from '../components/admin/quarter-management.component';

// Player Components
import { PlayerDashboard } from '../components/player/player-dashboard.component';
import { PlayerProfile } from '../components/player/player-profile.component';

export const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/game/:quarterId/results" element={<GameResults />} />

      {/* Game Routes */}
      <Route element={<PrivateRoute allowedRoles={[UserRole.PLAYER, UserRole.ADMIN]} />}>
        <Route path="/" element={<QuarterSelection onSelect={(quarter) => {
          if (quarter?.id) {
            navigate(`/game/${quarter.id}`);
          }
        }} />} />
        <Route path="/game/:quarterId" element={
          <GameErrorBoundary>
            <GameContainer />
          </GameErrorBoundary>
        } />
        <Route path="/game" element={
          <GameErrorBoundary>
            <GameContainer />
          </GameErrorBoundary>
        } />
        <Route path="/game/:quarterId/results" element={<GameResults />} />
      </Route>

      {/* Player Routes */}
      <Route element={<PrivateRoute allowedRoles={[UserRole.PLAYER, UserRole.ADMIN]} />}>
        <Route path="/dashboard" element={<PlayerDashboard />} />
        <Route path="/profile" element={<PlayerProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<PrivateRoute adminOnly />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/quarters" element={<QuarterManagement />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};