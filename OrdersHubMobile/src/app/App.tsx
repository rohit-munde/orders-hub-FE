import React, { useCallback, useEffect, useState } from 'react';
import { LoginScreen } from '../features/auth/LoginScreen';
import { loadAuthSession } from '../features/auth/services/secureTokenStorage';
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
  const handleSessionExpired = useCallback(() => setSession(null), []);

  useEffect(() => {
    let isActive = true;
    let timer: ReturnType<typeof setTimeout>;
    const splashDelay = new Promise<void>(resolve => {
      timer = setTimeout(resolve, SPLASH_DURATION_MS);
    });

    Promise.all([loadAuthSession().catch(() => null), splashDelay]).then(
      ([restoredSession]) => {
        if (!isActive) {
          return;
        }

        setSession(restoredSession);
        setRoute(restoredSession ? 'login' : 'onboarding');
      },
    );

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, []);

  if (route === 'splash') {
    return <SplashScreen />;
  }

  if (route === 'onboarding') {
    return <OnboardingScreen onComplete={() => setRoute('login')} />;
  }

  if (session) {
    return (
      <HomeScreen
        session={session}
        onSessionExpired={handleSessionExpired}
      />
    );
  }

  return <LoginScreen onAuthenticated={setSession} />;
}
