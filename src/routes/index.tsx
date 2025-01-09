import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { AuthProvider } from '../contexts/AuthContext';

// Placeholder imports - will be replaced with actual components
const Login = () => <div>Login</div>;
const Dashboard = () => <div>Dashboard</div>;
const AdminPanel = () => <div>Admin Panel</div>;
const GameContainer = () => <div>Game Container</div>;

const AppRoutes: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/game" element={<GameContainer />} />
          </Route>
          
          {/* Admin Routes */}
          <Route element={<PrivateRoute adminOnly />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRoutes;
