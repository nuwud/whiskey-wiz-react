// src/components/auth/login.component.tsx
import React from 'react';
import { useAuth } from '../../contexts/auth.context';  // Add this import
import LoginForm from './login-form.component';

export const Login: React.FC = () => {
  const { error } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>
      {error && (
        <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error.message}</span>
          </div>
        </div>
      )}
      <LoginForm />
    </div>
  );
};

export default Login;