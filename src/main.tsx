import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/auth.context'; // Import AuthProvider
import { ErrorBoundary } from './components/error-boundary.component';
import { verifyEnvironment, handleEnvironmentError } from './utils/env.check.utils';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const router = createBrowserRouter([
  {
    path: "*",
    element: <App />,
  }
], {
  future: {
    v7_relativeSplatPath: true
  }
});

const init = async () => {
  try {
    verifyEnvironment();
    await import('./config/firebase');
    
    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <React.StrictMode>
        <ErrorBoundary fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center p-4">
              <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                Try Again
              </button>
            </div>
          </div>
        }>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    handleEnvironmentError(error);
  }
};

init();