import React, { PropsWithChildren } from 'react';
import {
  StatusBar,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTheme, useAppTheme } from '../../theme/AppThemeProvider';

type AppScreenProps = PropsWithChildren<{
  dark?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function AppScreen({
  children,
  dark = false,
  contentStyle,
}: AppScreenProps): React.JSX.Element {
  const { theme } = useAppTheme();
  const screenTheme = dark ? getTheme('dark') : theme;
  const backgroundColor = screenTheme.colors.background;
  const styles = screenTheme.styles.appScreen;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar
        barStyle={screenTheme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}
