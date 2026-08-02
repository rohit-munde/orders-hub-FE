import { appConfig } from '../../../config/appConfig';
import { AuthSession, GoogleAuthenticationRequest } from '../types';

type ErrorResponse = {
  message?: string;
  error?: string;
};

export async function authenticateWithGoogle(
  googleTokens: GoogleAuthenticationRequest,
): Promise<AuthSession> {
  let response: Response;

  try {
    response = await fetch(`${appConfig.apiBaseUrl}/api/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleTokens),
    });
  } catch {
    throw new Error('Could not reach Orders Hub. Check that the backend is running.');
  }

  const body = (await response.json().catch(() => null)) as
    | (AuthSession & ErrorResponse)
    | null;

  if (!response.ok) {
    throw new Error(
      body?.message ?? body?.error ?? `Authentication failed (${response.status}).`,
    );
  }

  if (!body?.appToken || !body.user?.name) {
    throw new Error('The backend returned an invalid authentication response.');
  }

  return body;
}
