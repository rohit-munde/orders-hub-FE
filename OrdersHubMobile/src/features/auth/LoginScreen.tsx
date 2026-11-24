import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>OrdersHub</Text>
          <Text style={styles.subtitle}>
            Every order from every inbox, organized.
          </Text>
        </View>

        <View style={styles.authArea}>
          <GmailDisclosure />

          <PrimaryButton
            label="Agree & continue"
            accessibilityLabel="Agree and continue with Google"
            leading={<GoogleGlyph />}
            loading={isLoading}
            onPress={authenticate}
          />

          {error ? <InlineMessage message={error} /> : null}
        </View>

        <View style={styles.footer}>
          <LegalNotice />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function LegalNotice(): React.JSX.Element {
  const { theme } = useAppTheme();
  const labelStyle = [
    theme.styles.securityLabel.label,
    { color: theme.colors.textMuted },
  ];
  const linkStyle = {
    color: theme.colors.text,
    textDecorationLine: 'underline' as const,
  };
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

/**
 * Google Play's User Data policy requires a prominent in-app disclosure, shown before the
 * Gmail permission is requested, of what is accessed, how it is used and what is kept.
 * Signing in is the affirmative consent, which is why the button says "Agree and continue".
 */
function GmailDisclosure(): React.JSX.Element {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const text = [disclosureStyles.text, { color: colors.text }];

  return (
    <View
      style={[
        disclosureStyles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID="gmail-disclosure"
      accessibilityRole="summary"
    >
      <Text style={[disclosureStyles.title, { color: colors.text }]}>
        How OrdersHub uses your Gmail
      </Text>
      <Text style={text}>
        OrdersHub asks Google for read-only access to your Gmail to find order,
        shipping and delivery emails from shopping sites. Our server reads those
        emails to pull out order details (merchant, items, amount, status) and,
        when you tap Show OTP, the delivery OTP.
      </Text>
      <Text style={text}>
        We keep the order details and the IDs of the emails they came from,
        never the full email text or your OTPs. Your data is never sold or used
        for ads. You can disconnect Gmail or delete your account any time in
        Profile.
      </Text>
    </View>
  );
}

const disclosureStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
  },
});
