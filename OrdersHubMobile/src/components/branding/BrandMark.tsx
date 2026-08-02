import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../../theme/AppThemeProvider';

type BrandMarkProps = {
  size?: 'small' | 'large';
};

export function BrandMark({ size = 'small' }: BrandMarkProps): React.JSX.Element {
  const styles = useStyles().brandMark;
  const isLarge = size === 'large';

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.container, isLarge ? styles.large : styles.small]}>
      <Text style={[styles.symbol, isLarge && styles.largeSymbol]}>◇</Text>
    </View>
  );
}

export function GoogleGlyph(): React.JSX.Element {
  const styles = useStyles().brandMark;
  return <Text style={styles.googleGlyph}>G</Text>;
}

export function EnvelopeMark(): React.JSX.Element {
  const styles = useStyles().brandMark;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.container, styles.large]}>
      <Text style={[styles.symbol, styles.largeSymbol]}>✉</Text>
    </View>
  );
}
