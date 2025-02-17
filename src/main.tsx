import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/auth.context';
import { ErrorBoundary } from './components/error-boundary.component';
import { verifyEnvironment, handleEnvironmentError } from './utils/env-check.utils';
import './config/firebase';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const router = createBrowserRouter(
  [
    {
      path: "*",
      element: (
        <AuthProvider>
          <App />
        </AuthProvider>
      ),
    }
  ],
  {
    future: {
      v7_relativeSplatPath: true
    }
  }
);

const ErrorFallback = () => (
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
);

const init = async () => {
  try {
    verifyEnvironment();
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    handleEnvironmentError(error);
  }
};

init();