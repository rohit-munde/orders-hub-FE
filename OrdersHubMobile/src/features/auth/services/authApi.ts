import { httpService } from '../../../services/http/httpService';
import { AuthSession, GoogleAuthenticationRequest } from '../types';

export async function authenticateWithGoogle(
  googleTokens: GoogleAuthenticationRequest,
): Promise<AuthSession> {
  const session = await httpService.post<AuthSession>('/api/v1/auth/google', {
    body: googleTokens,
  });

  if (!session?.appToken || !session.user?.name) {
    throw new Error('The backend returned an invalid authentication response.');
  }

  return session;
}
