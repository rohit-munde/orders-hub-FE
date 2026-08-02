import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../../../theme/AppThemeProvider';

const items = [
  { label: 'Home', symbol: '⌂', active: true },
  { label: 'Insights', symbol: '◔', active: false },
  { label: 'Orders', symbol: '◇', active: false },
  { label: 'Profile', symbol: '○', active: false },
];

export function BottomNavigation(): React.JSX.Element {
  const styles = useStyles().bottomNavigation;

  return (
    <View style={styles.container}>
      {items.map(item => (
        <View key={item.label} style={styles.item}>
          <Text style={[styles.icon, item.active && styles.active]}>{item.symbol}</Text>
          <Text style={[styles.label, item.active && styles.active]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
