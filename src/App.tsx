import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Import components
import PrivateRoute from './routes/PrivateRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import GameContainer from './components/game/GameContainer';
import ResultsView from './components/results/ResultsView';
import AdminQuarterManagement from './components/admin/AdminQuarterManagement';

// Import styles
import './styles/global.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
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
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;