import * as Keychain from 'react-native-keychain';
import { AuthSession } from '../types';

const SESSION_SERVICE = 'com.ordershubmobile.auth-session';
const SESSION_USERNAME = 'ordershub-session';
const sessionServiceOptions = { service: SESSION_SERVICE } as const;

export async function saveAuthSession(session: AuthSession): Promise<void> {
  const storedSession: AuthSession = {
    appToken: session.appToken,
    user: session.user,
  };
  const stored = await Keychain.setGenericPassword(
    SESSION_USERNAME,
    JSON.stringify(storedSession),
    sessionServiceOptions,
  );

  if (!stored) {
    throw new Error('The Orders Hub session could not be stored securely.');
  }
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  try {
    const credentials = await Keychain.getGenericPassword(sessionServiceOptions);
    if (!credentials) {
      return null;
    }

    const session = JSON.parse(credentials.password) as unknown;
    if (isAuthSession(session)) {
      return session;
    }
  } catch {
    // Unreadable credentials are discarded below so startup can continue safely.
  }

  await discardStoredSession();
  return null;
}

export async function clearAuthSession(): Promise<void> {
  await Keychain.resetGenericPassword(sessionServiceOptions);
}

async function discardStoredSession(): Promise<void> {
  try {
    await clearAuthSession();
  } catch {
    // A failed cleanup must not block app startup.
  }
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!isRecord(value) || !isRecord(value.user)) {
    return false;
  }

  const { user } = value;
  return (
    typeof value.appToken === 'string' &&
    value.appToken.length > 0 &&
    typeof user.id === 'number' &&
    Number.isFinite(user.id) &&
    typeof user.name === 'string' &&
    user.name.length > 0 &&
    typeof user.email === 'string' &&
    user.email.length > 0 &&
    (typeof user.pictureUrl === 'string' || user.pictureUrl === null)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
