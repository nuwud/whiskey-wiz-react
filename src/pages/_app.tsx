import { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import { FeatureProvider } from '@/contexts/FeatureContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <FeatureProvider>
        <Component {...pageProps} />
      </FeatureProvider>
    </AuthProvider>
  );
}

export default MyApp;
