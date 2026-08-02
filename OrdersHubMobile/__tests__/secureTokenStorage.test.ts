import * as Keychain from 'react-native-keychain';
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from '../src/features/auth/services/secureTokenStorage';
import { AuthSession } from '../src/features/auth/types';

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const session: AuthSession = {
  appToken: 'signed-jwt',
  user: {
    id: 42,
    name: 'Test User',
    email: 'user@example.com',
    pictureUrl: null,
  },
};

const service = { service: 'com.ordershubmobile.auth-session' };

beforeEach(() => {
  jest.resetAllMocks();
  (Keychain.setGenericPassword as jest.Mock).mockResolvedValue({ service: service.service });
  (Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(true);
});

it('stores and restores the complete authentication session', async () => {
  await saveAuthSession(session);

  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'ordershub-session',
    JSON.stringify(session),
    service,
  );

  (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
    username: 'ordershub-session',
    password: JSON.stringify(session),
  });

  await expect(loadAuthSession()).resolves.toEqual(session);
});

it('does not persist extra fields from the backend response envelope', async () => {
  const responseEnvelope = {
    ...session,
    syncPreview: { messages: [{ subject: 'Private order' }] },
  } as AuthSession;

  await saveAuthSession(responseEnvelope);

  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'ordershub-session',
    JSON.stringify(session),
    service,
  );
});

it('returns null when no session is stored', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

  await expect(loadAuthSession()).resolves.toBeNull();
});

it.each([
  ['malformed JSON', '{invalid'],
  ['an invalid session shape', JSON.stringify({ appToken: '', user: {} })],
])('clears %s instead of restoring it', async (_description, password) => {
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
    username: 'ordershub-session',
    password,
  });

  await expect(loadAuthSession()).resolves.toBeNull();
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith(service);
});

it('clears storage and returns null when Keychain cannot be read', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockRejectedValue(
    new Error('Keychain unavailable'),
  );

  await expect(loadAuthSession()).resolves.toBeNull();
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith(service);
});

it('clears the stored authentication session', async () => {
  await clearAuthSession();

  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith(service);
});
