import React from 'react';
import { Text, View } from 'react-native';
import { AppTheme, useAppTheme } from '../../../theme/AppThemeProvider';
import { OrderStatus, OrderSummary } from '../types';

type OrderRowProps = {
  order: OrderSummary;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function OrderRow({ order }: OrderRowProps): React.JSX.Element {
  const { theme } = useAppTheme();
  const styles = theme.styles.orderRow;
  const status = getStatusPresentation(theme)[order.status];

  return (
    <View style={styles.card}>
      <View style={[styles.merchant, { backgroundColor: order.merchantColor }]}>
        <Text style={styles.merchantInitial}>{order.merchantInitial}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {order.title}
          </Text>
          <Text style={styles.price}>{currencyFormatter.format(order.price)}</Text>
        </View>

        <Text numberOfLines={1} style={styles.inbox}>✉ {order.inbox}</Text>

        <View style={styles.badges}>
          <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
            <Text style={[styles.statusText, { color: status.foreground }]}>
              {status.label}
            </Text>
          </View>

          {order.otp ? (
            <View
              accessibilityLabel={`Delivery OTP ${order.otp}`}
              style={styles.otpBadge}>
              <Text style={styles.otpLabel}>OTP</Text>
              <Text selectable style={styles.otpValue}>{order.otp}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function getStatusPresentation(theme: AppTheme): Record<
  OrderStatus,
  { label: string; foreground: string; background: string }
> {
  const { colors } = theme;
  return {
    ordered: {
      label: 'Ordered',
      foreground: colors.orderedText,
      background: colors.orderedSurface,
    },
    inTransit: {
      label: 'In transit',
      foreground: colors.inTransitText,
      background: colors.inTransitSurface,
    },
    outForDelivery: {
      label: 'Out for delivery',
      foreground: colors.outForDeliveryText,
      background: colors.outForDeliverySurface,
    },
    delivered: {
      label: 'Delivered',
      foreground: colors.deliveredText,
      background: colors.deliveredSurface,
    },
  };
}
