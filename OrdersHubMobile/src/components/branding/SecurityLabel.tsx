import React from 'react';
import { Text } from 'react-native';
import { getTheme, useAppTheme } from '../../theme/AppThemeProvider';

type SecurityLabelProps = {
  label: string;
  dark?: boolean;
};

export function SecurityLabel({
  label,
  dark = false,
}: SecurityLabelProps): React.JSX.Element {
  const { theme } = useAppTheme();
  const color = dark ? getTheme('dark').colors.onDarkMuted : theme.colors.textMuted;
  const styles = theme.styles.securityLabel;

  return (
    <Text style={[styles.label, { color }]} numberOfLines={2}>
      ▢ {label}
    </Text>
  );
}
