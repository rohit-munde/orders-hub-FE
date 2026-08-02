import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../../../theme/AppThemeProvider';

type Metric = {
  label: string;
  value: string;
};

const metrics: Metric[] = [
  { label: 'Active', value: '7' },
  { label: 'This week', value: '3' },
  { label: 'Returns', value: '1' },
];

export function SpendingOverview(): React.JSX.Element {
  const styles = useStyles().spending;

  return (
    <View>
      <View style={styles.spendingCard}>
        <Text style={styles.label}>Spent this month · 3 inboxes</Text>
        <Text style={styles.amount}>₹48,250</Text>
        <Text style={styles.comparison}>↑ 12% vs April</Text>
      </View>

      <View style={styles.metrics}>
        {metrics.map(metric => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
