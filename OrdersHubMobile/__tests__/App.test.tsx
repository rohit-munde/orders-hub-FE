/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { loadAuthSession } from '../src/features/auth/services/secureTokenStorage';
import { AuthSession } from '../src/features/auth/types';

let mockOnSessionExpired: (() => void) | undefined;

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    revokeAccess: jest.fn(),
    signOut: jest.fn(),
  },
  isErrorWithCode: jest.fn(() => false),
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('../src/features/auth/services/secureTokenStorage', () => ({
  clearAuthSession: jest.fn(),
  loadAuthSession: jest.fn(),
  saveAuthSession: jest.fn(),
}));

jest.mock('../src/features/home/hooks/useOrders', () => ({
  useOrders: (_appToken: string, onSessionExpired: () => void) => {
    mockOnSessionExpired = onSessionExpired;
    return {
      orders: [],
      lastSyncedAt: null,
      isInitialLoading: false,
      isRefreshing: false,
      error: null,
      load: jest.fn(),
      refresh: jest.fn(),
    };
  },
}));

const restoredSession: AuthSession = {
  appToken: 'signed-jwt',
  user: {
    id: 42,
    name: 'Test User',
    email: 'user@example.com',
    pictureUrl: null,
  },
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetAllMocks();
  mockOnSessionExpired = undefined;
});

it('returns to login when the Orders API expires the session', async () => {
  (loadAuthSession as jest.Mock).mockResolvedValue(restoredSession);
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await finishSplash();

  await ReactTestRenderer.act(async () => mockOnSessionExpired?.());

  expect(textNodesWith(renderer!, 'Continue with Google')).toHaveLength(1);
  await ReactTestRenderer.act(() => renderer!.unmount());
});

afterEach(() => {
  jest.useRealTimers();
});

it('routes a restored session directly to Home after the splash', async () => {
  (loadAuthSession as jest.Mock).mockResolvedValue(restoredSession);
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await finishSplash();

  expect(textNodesWith(renderer!, 'Test')).toHaveLength(1);

  await ReactTestRenderer.act(() => renderer!.unmount());
});

it('routes a missing session to onboarding after the splash', async () => {
  (loadAuthSession as jest.Mock).mockResolvedValue(null);
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await finishSplash();

  expect(textNodesWith(renderer!, 'Connect every inbox')).toHaveLength(1);

  await ReactTestRenderer.act(() => renderer!.unmount());
});

async function finishSplash(): Promise<void> {
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(1400);
    await Promise.resolve();
  });
}

function textNodesWith(
  renderer: ReactTestRenderer.ReactTestRenderer,
  children: string,
) {
  return renderer.root
    .findAllByType(Text)
    .filter(node => node.props.children === children);
}
