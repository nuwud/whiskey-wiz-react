import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/protected-route.component';
import { UserRole } from '../types/auth.types';
import { GameErrorBoundary } from '../components/game/game-error-boundary.component';

// Auth Components
import { Login } from '../components/auth/login.component';
import SignUp from '../components/auth/sign-up.component';
import ForgotPassword from '../components/auth/forgot-password.component';
import VerifyEmail from '../components/auth/verify-email.component';

// Game Components
import { GameContainer } from '../components/game/game-container.component';
import { GameResults } from '../components/game/game-results.component'; 

// Admin Components
import AdminDashboard from '../components/admin/admin-dashboard.component';
import UserManagement from '../components/admin/user-management.component';
import QuarterManagement from '../components/admin/quarter-management.component';

// Player Components
import { PlayerDashboard } from '../components/player/player-dashboard.component';
import { PlayerProfile } from '../components/player/player-profile.component';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Redirect from root to the featured quarter */}
      <Route path="/" element={<Navigate to="/game/1224" replace />} />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Game Routes - Public Access for Everyone */}
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

      {/* Player Only Routes */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.PLAYER, UserRole.ADMIN]} />}>
        <Route path="/dashboard" element={<PlayerDashboard />} />
        <Route path="/profile" element={<PlayerProfile />} />
      </Route>

      {/* Admin Only Routes */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/quarters" element={<QuarterManagement />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/game/1224" replace />} />
    </Routes>
  );
};