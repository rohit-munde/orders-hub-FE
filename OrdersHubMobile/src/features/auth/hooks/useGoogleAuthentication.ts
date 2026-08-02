import { useCallback, useRef, useState } from 'react';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { appConfig } from '../../../config/appConfig';
import { authenticateWithGoogle } from '../services/authApi';
import { saveAuthSession } from '../services/secureTokenStorage';
import { AuthSession, GoogleAuthenticationRequest } from '../types';

GoogleSignin.configure({
  webClientId: appConfig.googleWebClientId,
  offlineAccess: true,
  scopes: [...appConfig.googleScopes],
});

const isActivityUnavailable = (error: unknown): boolean =>
  error instanceof Error &&
  error.message.toLowerCase().includes('current activity is null');

async function getGoogleTokens(): Promise<GoogleAuthenticationRequest> {
  try {
    return await signIn();
  } catch (error) {
    if (!isActivityUnavailable(error)) throw error;

    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    return signIn();
  }
}

async function signIn(): Promise<GoogleAuthenticationRequest> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();

  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled.');
  }

  const { idToken, serverAuthCode } = result.data;
  if (!idToken || !serverAuthCode) {
    throw new Error('Google did not return the required authentication tokens.');
  }

  return { idToken, serverAuthCode };
}

function messageFor(error: unknown): string {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) return 'Google sign-in was cancelled.';
    if (error.code === statusCodes.IN_PROGRESS) return 'Google sign-in is already open.';
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play Services are unavailable.';
    }
  }

  return error instanceof Error ? error.message : 'Unable to sign in with Google.';
}

export function useGoogleAuthentication(
  onAuthenticated: (session: AuthSession) => void,
) {
  const authenticationInProgress = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    if (authenticationInProgress.current) return;
    authenticationInProgress.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const session = await authenticateWithGoogle(await getGoogleTokens());
      await saveAuthSession(session);
      onAuthenticated(session);
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      authenticationInProgress.current = false;
      setIsLoading(false);
    }
  }, [onAuthenticated]);

  return { authenticate, error, isLoading };
}
