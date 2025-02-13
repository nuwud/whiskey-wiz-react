// src/components/layout/layout.component.tsx
import React, { useState, useEffect } from 'react';
import { NavBar } from './navbar.component';
import { useAuth } from '../../contexts/auth.context';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { loading } = useAuth();  // Remove unused variables
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVerifying(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};