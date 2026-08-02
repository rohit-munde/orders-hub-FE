import React, { useEffect, useState } from 'react';
import { LoginScreen } from '../features/auth/LoginScreen';
import { AuthSession } from '../features/auth/types';
import { HomeScreen } from '../features/home/HomeScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { SplashScreen } from '../features/splash/SplashScreen';
import { AppThemeProvider } from '../theme/AppThemeProvider';

type AppRoute = 'splash' | 'onboarding' | 'login';

const SPLASH_DURATION_MS = 1400;

export default function App(): React.JSX.Element {
  return (
    <AppThemeProvider>
      <AppContent />
    </AppThemeProvider>
  );
}

function AppContent(): React.JSX.Element {
  const [route, setRoute] = useState<AppRoute>('splash');
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setRoute('onboarding'), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (route === 'splash') {
    return <SplashScreen />;
  }

  if (route === 'onboarding') {
    return <OnboardingScreen onComplete={() => setRoute('login')} />;
  }

  if (session) {
    return <HomeScreen session={session} />;
  }

  return <LoginScreen onAuthenticated={setSession} />;
}
