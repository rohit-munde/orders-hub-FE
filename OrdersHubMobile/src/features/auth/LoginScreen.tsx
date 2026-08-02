import React from 'react';
import { Text, View } from 'react-native';
import { GoogleGlyph } from '../../components/branding/BrandMark';
import { SecurityLabel } from '../../components/branding/SecurityLabel';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { InlineMessage } from '../../components/feedback/InlineMessage';
import { AppScreen } from '../../components/layout/AppScreen';
import { useStyles } from '../../theme/AppThemeProvider';
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
        <Text style={styles.title}>OrderHub</Text>
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
        <SecurityLabel label="By continuing you accept Terms & Privacy" />
      </View>
    </AppScreen>
  );
}
