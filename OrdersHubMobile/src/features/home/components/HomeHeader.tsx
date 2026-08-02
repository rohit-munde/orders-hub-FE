import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStyles } from '../../../theme/AppThemeProvider';

type HomeHeaderProps = {
  name: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeHeader({ name }: HomeHeaderProps): React.JSX.Element {
  const styles = useStyles().homeHeader;
  const firstName = name.trim().split(/\s+/)[0] || 'there';

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.name}>{firstName}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={10}
          style={styles.notificationButton}>
          <Text style={styles.bell}>♢</Text>
          <View style={styles.notificationDot} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}
