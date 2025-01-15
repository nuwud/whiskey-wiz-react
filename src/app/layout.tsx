import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { FeatureProvider } from '@/contexts/FeatureContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'BlindBarrels.com',
  description: 'Whiskey Tasting Game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
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
  )
}