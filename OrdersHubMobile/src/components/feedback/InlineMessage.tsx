import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../../theme/AppThemeProvider';

type InlineMessageProps = {
  message: string;
};

export function InlineMessage({ message }: InlineMessageProps): React.JSX.Element {
  const styles = useStyles().inlineMessage;

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}
