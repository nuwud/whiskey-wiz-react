import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FeatureProvider } from './contexts/FeatureContext';
import { GameContainer } from './components/game/GameContainer';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FeatureProvider>
          <div className="min-h-screen bg-gray-50">
            <main className="container mx-auto py-8">
              <GameContainer />
            </main>
          </div>
        </FeatureProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;