import React from 'react';
import { Alert, Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ProfilePage } from '../src/features/home/components/profile/ProfilePage';
import { httpService } from '../src/services/http/httpService';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';
import { AuthSession } from '../src/features/auth/types';
import { ApiError } from '../src/services/http/ApiError';
import { clearAuthSession } from '../src/features/auth/services/secureTokenStorage';
import { legalLinks } from '../src/config/appConfig';

jest.mock('../src/services/http/httpService', () => ({
  httpService: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../src/features/auth/services/secureTokenStorage', () => ({
  clearAuthSession: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    revokeAccess: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
  },
  isErrorWithCode: jest.fn(() => false),
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

const session: AuthSession = {
  appToken: 'app-jwt-token',
  user: { id: 1, name: 'Test User', email: 'test@example.com', pictureUrl: null },
};

type AlertButton = { text: string; onPress?: () => void };

async function renderProfile(onLogout = jest.fn()) {
  let component: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    component = ReactTestRenderer.create(
      <AppThemeProvider>
        <ProfilePage
          session={session}
          userDetails={null}
          onBack={jest.fn()}
          onLogout={onLogout}
          onAccountsChanged={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });
  return component!;
}

async function confirmDeletion(alertSpy: jest.SpyInstance) {
  const [, , buttons] = alertSpy.mock.calls[0] as [string, string, AlertButton[]];
  const confirm = buttons.find(button => button.text === 'Delete account');
  await ReactTestRenderer.act(async () => {
    confirm?.onPress?.();
  });
}

describe('ProfilePage account deletion and legal links', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    (httpService.get as jest.Mock).mockResolvedValue([]);
    (httpService.delete as jest.Mock).mockReset();
    (clearAuthSession as jest.Mock).mockClear();
    (GoogleSignin.revokeAccess as jest.Mock).mockClear();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('asks for confirmation before deleting anything', async () => {
    const component = await renderProfile();

    await ReactTestRenderer.act(async () => {
      component.root.findByProps({ testID: 'delete-account-btn' }).props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete your account?',
      expect.stringContaining('cannot be undone'),
      expect.any(Array),
    );
    expect(httpService.delete).not.toHaveBeenCalled();
  });

  it('deletes the account, revokes Google access, clears the session and logs out', async () => {
    (httpService.delete as jest.Mock).mockResolvedValue({
      accountDeleted: true,
      connectedAccountsDeleted: 1,
      ordersDeleted: 3,
    });
    const onLogout = jest.fn();
    const component = await renderProfile(onLogout);

    await ReactTestRenderer.act(async () => {
      component.root.findByProps({ testID: 'delete-account-btn' }).props.onPress();
    });
    await confirmDeletion(alertSpy);

    expect(httpService.delete).toHaveBeenCalledWith('/api/v1/users/me', { token: 'app-jwt-token' });
    expect(GoogleSignin.revokeAccess).toHaveBeenCalled();
    expect(clearAuthSession).toHaveBeenCalled();
    expect(onLogout).toHaveBeenCalled();
  });

  it('keeps the user signed in and explains the failure when deletion fails', async () => {
    (httpService.delete as jest.Mock).mockRejectedValue(new ApiError('Server error', { status: 500 }));
    const onLogout = jest.fn();
    const component = await renderProfile(onLogout);

    await ReactTestRenderer.act(async () => {
      component.root.findByProps({ testID: 'delete-account-btn' }).props.onPress();
    });
    await confirmDeletion(alertSpy);

    expect(alertSpy).toHaveBeenLastCalledWith('Could not delete account', expect.any(String));
    expect(clearAuthSession).not.toHaveBeenCalled();
    expect(onLogout).not.toHaveBeenCalled();
    expect(component.root.findByProps({ testID: 'delete-account-btn' }).props.disabled).toBe(false);
  });

  it('opens the privacy policy and terms pages', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const component = await renderProfile();

    await ReactTestRenderer.act(async () => {
      component.root.findByProps({ testID: 'privacy-policy-link' }).props.onPress();
      component.root.findByProps({ testID: 'terms-link' }).props.onPress();
    });

    expect(openURL).toHaveBeenCalledWith(legalLinks.privacyPolicy);
    expect(openURL).toHaveBeenCalledWith(legalLinks.terms);
  });
});
