import React from 'react';
import { Linking, Text, View } from 'react-native';
import { GoogleGlyph } from '../../components/branding/BrandMark';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { InlineMessage } from '../../components/feedback/InlineMessage';
import { AppScreen } from '../../components/layout/AppScreen';
import { legalLinks } from '../../config/appConfig';
import { useAppTheme, useStyles } from '../../theme/AppThemeProvider';
import { useGoogleAuthentication } from './hooks/useGoogleAuthentication';
import { AuthSession } from './types';

type LoginScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export function LoginScreen({
  onAuthenticated,
}: LoginScreenProps): React.JSX.Element {
  const styles = useStyles().login;
  const { authenticate, error, isLoading } =
    useGoogleAuthentication(onAuthenticated);

  return (
    <AppScreen contentStyle={styles.screen}>
      <View style={styles.heading}>
        <Text style={styles.title}>OrdersHub</Text>
        <Text style={styles.subtitle}>Every order from every inbox, organized.</Text>
      </View>

      <View style={styles.authArea}>
        <PrimaryButton
          label="Continue with Google"
          accessibilityLabel="Continue with Google"
          leading={<GoogleGlyph />}
          loading={isLoading}
          onPress={authenticate}
        />

        {error ? <InlineMessage message={error} /> : null}
      </View>

      <View style={styles.footer}>
        <LegalNotice />
      </View>
    </AppScreen>
  );
}

function LegalNotice(): React.JSX.Element {
  const { theme } = useAppTheme();
  const labelStyle = [theme.styles.securityLabel.label, { color: theme.colors.textMuted }];
  const linkStyle = { color: theme.colors.text, textDecorationLine: 'underline' as const };
  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Text style={labelStyle} testID="login-legal-notice">
      By continuing you accept the{' '}
      <Text
        style={linkStyle}
        accessibilityRole="link"
        onPress={() => open(legalLinks.terms)}
        testID="login-terms-link"
      >
        Terms
      </Text>{' '}
      and{' '}
      <Text
        style={linkStyle}
        accessibilityRole="link"
        onPress={() => open(legalLinks.privacyPolicy)}
        testID="login-privacy-link"
      >
        Privacy Policy
      </Text>
    </Text>
  );
}
