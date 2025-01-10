import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { FeatureProvider } from '@/contexts/FeatureContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BlindBarrels.com - Whiskey Tasting Game',
  description: 'Test your whiskey knowledge in this exciting tasting game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <FeatureProvider>
            {children}
          </FeatureProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
