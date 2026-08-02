import React from 'react';
import { Text, View } from 'react-native';
import { BrandMark } from '../../components/branding/BrandMark';
import { SecurityLabel } from '../../components/branding/SecurityLabel';
import { AppScreen } from '../../components/layout/AppScreen';
import { getTheme } from '../../theme/AppThemeProvider';

export function SplashScreen(): React.JSX.Element {
  return (
    <AppScreen dark contentStyle={styles.screen}>
      <View style={styles.brandGroup}>
        <BrandMark />
        <Text style={styles.title}>OrderHub</Text>
        <Text style={styles.subtitle}>Every order. One place.</Text>
      </View>

      <View style={styles.footer}>
        <SecurityLabel dark label="Bank-grade encryption" />
      </View>
    </AppScreen>
  );
}

const styles = getTheme('dark').styles.splash;
