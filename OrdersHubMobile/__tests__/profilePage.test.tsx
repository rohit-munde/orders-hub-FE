import React from 'react';
import { Alert, ToastAndroid, Platform } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ProfilePage } from '../src/features/home/components/profile/ProfilePage';
import { httpService } from '../src/services/http/httpService';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';
import { AuthSession } from '../src/features/auth/types';
import { ApiError } from '../src/services/http/ApiError';

jest.mock('../src/services/http/httpService', () => ({
  httpService: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

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

const mockSession: AuthSession = {
  appToken: 'app-jwt-token',
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    pictureUrl: null,
  },
};

const mockUserDetails = {
  name: 'Test User',
  pictureUrl: null,
  connectedInboxCount: 2,
  trackedOrderCount: 5,
};

describe('ProfilePage Gmail Disconnect', () => {
  let alertSpy: jest.SpyInstance;
  let toastSpy: jest.SpyInstance;
  const onAccountsChangedMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
    toastSpy = jest.spyOn(ToastAndroid, 'show').mockImplementation(() => {});
    Platform.OS = 'android';

    (httpService.get as jest.Mock).mockResolvedValue([
      { id: 1, provider: 'GOOGLE', email: 'first@gmail.com', status: 'SYNCED', lastSyncedAt: null },
      { id: 2, provider: 'GOOGLE', email: 'second@gmail.com', status: 'SYNCED', lastSyncedAt: null },
    ]);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    toastSpy.mockRestore();
  });

  it('renders disconnect buttons, and they are enabled when multiple accounts exist', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfilePage
            session={mockSession}
            userDetails={mockUserDetails}
            onBack={jest.fn()}
            onLogout={jest.fn()}
            onAccountsChanged={onAccountsChangedMock}
          />
        </AppThemeProvider>
      );
    });

    const button = component!.root.findByProps({ testID: 'disconnect-btn-1' });
    expect(button.props.disabled).toBe(false);

    // Verify helper text is not rendered when multiple accounts exist
    const helperTexts = component!.root.findAllByProps({ testID: 'disabled-helper-text' });
    expect(helperTexts).toHaveLength(0);
  });

  it('disables the disconnect button and shows helper text when only one account exists', async () => {
    (httpService.get as jest.Mock).mockResolvedValue([
      { id: 1, provider: 'GOOGLE', email: 'only@gmail.com', status: 'SYNCED', lastSyncedAt: null },
    ]);

    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfilePage
            session={mockSession}
            userDetails={mockUserDetails}
            onBack={jest.fn()}
            onLogout={jest.fn()}
            onAccountsChanged={onAccountsChangedMock}
          />
        </AppThemeProvider>
      );
    });

    const button = component!.root.findByProps({ testID: 'disconnect-btn-1' });
    expect(button.props.disabled).toBe(true);

    const helperText = component!.root.findByProps({ testID: 'disabled-helper-text' });
    expect(helperText.props.children).toBe('At least one Gmail account must remain connected.');
  });

  it('opens confirmation dialog on disconnect press', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfilePage
            session={mockSession}
            userDetails={mockUserDetails}
            onBack={jest.fn()}
            onLogout={jest.fn()}
            onAccountsChanged={onAccountsChangedMock}
          />
        </AppThemeProvider>
      );
    });

    const button = component!.root.findByProps({ testID: 'disconnect-btn-1' });
    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Disconnect Gmail account?',
      'This will remove first@gmail.com and delete imported orders from this Gmail account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: expect.any(Function),
        },
      ]
    );
  });

  it('performs successful disconnect, showing toast and calling refresh callbacks on Android', async () => {
    const successResponse = {
      success: true,
      message: 'Account deleted successfully from backend',
      payload: {
        connectedAccountDeleted: true,
        ordersDeleted: 5,
        emailSourcesDeleted: 2,
        disconnectedEmailId: 'first@gmail.com',
      },
    };
    (httpService.delete as jest.Mock).mockResolvedValue(successResponse);

    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfilePage
            session={mockSession}
            userDetails={mockUserDetails}
            onBack={jest.fn()}
            onLogout={jest.fn()}
            onAccountsChanged={onAccountsChangedMock}
          />
        </AppThemeProvider>
      );
    });

    // Simulate pressing the disconnect button to open the alert
    const button = component!.root.findByProps({ testID: 'disconnect-btn-1' });
    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });

    // Extract the confirm onPress function from Alert.alert mock call
    const confirmAction = alertSpy.mock.calls[0][2][1].onPress;

    // Trigger the confirmation action
    await ReactTestRenderer.act(async () => {
      await confirmAction();
    });

    expect(httpService.delete).toHaveBeenCalledWith(
      '/api/v1/connected-accounts/google/1',
      {
        token: 'app-jwt-token',
        returnFullResponse: true,
      }
    );

    // Verify toast was shown on Android
    expect(toastSpy).toHaveBeenCalledWith('Account deleted successfully from backend', ToastAndroid.SHORT);

    // Verify refresh callbacks were triggered
    expect(onAccountsChangedMock).toHaveBeenCalledTimes(1);
    expect(httpService.get).toHaveBeenCalledTimes(2); // Initial fetch + refresh fetch
  });

  it('performs successful disconnect, showing Alert success and calling refresh callbacks on iOS', async () => {
    Platform.OS = 'ios';
    const successResponse = {
      success: true,
      message: 'Account deleted successfully from backend',
      payload: {
        connectedAccountDeleted: true,
        ordersDeleted: 5,
        emailSourcesDeleted: 2,
        disconnectedEmailId: 'first@gmail.com',
      },
    };
    (httpService.delete as jest.Mock).mockResolvedValue(successResponse);

    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfilePage
            session={mockSession}
            userDetails={mockUserDetails}
            onBack={jest.fn()}
            onLogout={jest.fn()}
            onAccountsChanged={onAccountsChangedMock}
          />
        </AppThemeProvider>
      );
    });

    const button = component!.root.findByProps({ testID: 'disconnect-btn-1' });
    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });

    const confirmAction = alertSpy.mock.calls[0][2][1].onPress;
    
    // Clear alert spy history to verify the success alert
    alertSpy.mockClear();

    await ReactTestRenderer.act(async () => {
      await confirmAction();
    });

    // Verify Alert.alert was shown on iOS instead of toast
    expect(toastSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Success', 'Account deleted successfully from backend');
  });

  it('shows error alert with backend message on 409 conflict', async () => {
    const error409 = new ApiError('At least one Gmail account must remain connected', {
      status: 409,
    });
    (httpService.delete as jest.Mock).mockRejectedValue(error409);

    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfilePage
            session={mockSession}
            userDetails={mockUserDetails}
            onBack={jest.fn()}
            onLogout={jest.fn()}
            onAccountsChanged={onAccountsChangedMock}
          />
        </AppThemeProvider>
      );
    });

    const button = component!.root.findByProps({ testID: 'disconnect-btn-1' });
    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });

    const confirmAction = alertSpy.mock.calls[0][2][1].onPress;
    alertSpy.mockClear();

    await ReactTestRenderer.act(async () => {
      await confirmAction();
    });

    expect(alertSpy).toHaveBeenCalledWith('Error', 'At least one Gmail account must remain connected');
  });

  it('shows generic error alert on other network/API errors', async () => {
    (httpService.delete as jest.Mock).mockRejectedValue(new Error('Network error'));

    let component: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(
        <AppThemeProvider>
          <ProfilePage
            session={mockSession}
            userDetails={mockUserDetails}
            onBack={jest.fn()}
            onLogout={jest.fn()}
            onAccountsChanged={onAccountsChangedMock}
          />
        </AppThemeProvider>
      );
    });

    const button = component!.root.findByProps({ testID: 'disconnect-btn-1' });
    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });

    const confirmAction = alertSpy.mock.calls[0][2][1].onPress;
    alertSpy.mockClear();

    await ReactTestRenderer.act(async () => {
      await confirmAction();
    });

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Could not disconnect Gmail account. Please try again.');
  });
});
