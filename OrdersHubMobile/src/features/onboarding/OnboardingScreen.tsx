import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { EnvelopeMark } from '../../components/branding/BrandMark';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { AppScreen } from '../../components/layout/AppScreen';
import { useStyles } from '../../theme/AppThemeProvider';

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps): React.JSX.Element {
  const styles = useStyles().onboarding;

  return (
    <AppScreen contentStyle={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
        hitSlop={12}
        onPress={onComplete}
        style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.hero}>
        <EnvelopeMark />
        <Text style={styles.title}>Connect every inbox</Text>
        <Text style={styles.description}>
          Link all your Gmail accounts.{`\n`}We read only shopping receipts.
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.pageIndicator}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <PrimaryButton label="Continue" onPress={onComplete} />
      </View>
    </AppScreen>
  );
}
