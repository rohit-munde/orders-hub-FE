import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { LoginScreen } from '../src/features/auth/LoginScreen';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';
import { legalLinks } from '../src/config/appConfig';

jest.mock('../src/features/auth/hooks/useGoogleAuthentication', () => ({
  useGoogleAuthentication: () => ({
    authenticate: jest.fn(),
    error: null,
    isLoading: false,
  }),
}));

it('links the Terms and Privacy Policy from the sign-in screen', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  let component: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    component = ReactTestRenderer.create(
      <AppThemeProvider>
        <LoginScreen onAuthenticated={jest.fn()} />
      </AppThemeProvider>,
    );
  });

  await ReactTestRenderer.act(async () => {
    component!.root.findByProps({ testID: 'login-terms-link' }).props.onPress();
    component!.root.findByProps({ testID: 'login-privacy-link' }).props.onPress();
  });

  expect(openURL).toHaveBeenCalledWith(legalLinks.terms);
  expect(openURL).toHaveBeenCalledWith(legalLinks.privacyPolicy);
  openURL.mockRestore();
});
