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

it('explains how Gmail is used before asking the user to sign in', async () => {
  let component: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    component = ReactTestRenderer.create(
      <AppThemeProvider>
        <LoginScreen onAuthenticated={jest.fn()} />
      </AppThemeProvider>,
    );
  });

  const text = JSON.stringify(component!.toJSON());
  expect(component!.root.findAllByProps({ testID: 'gmail-disclosure' }).length).toBeGreaterThan(0);
  expect(text).toContain('read-only access to your Gmail');
  expect(text).toContain('never sold or used for ads');
  expect(text).toContain('Agree & continue');
  expect(component!.root.findAllByProps({ accessibilityLabel: 'Agree and continue with Google' }).length).toBeGreaterThan(0);
});
