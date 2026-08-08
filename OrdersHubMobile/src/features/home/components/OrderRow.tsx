import React from 'react';
import { Text, View } from 'react-native';
import { AppTheme, useAppTheme } from '../../../theme/AppThemeProvider';
import { Order, OrderStatus } from '../types';

type OrderRowProps = {
  order: Order;
};

export function OrderRow({ order }: OrderRowProps): React.JSX.Element {
  const { theme } = useAppTheme();
  const styles = theme.styles.orderRow;
  const merchant = order.brandName ?? order.merchantKey ?? 'Unknown merchant';
  const status = getStatusPresentation(theme)[order.status];

  return (
    <View style={styles.card}>
      <View style={[styles.merchant, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.merchantInitial}>{merchant.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>{merchant}</Text>
          <Text style={styles.price}>
            {formatAmount(order.billAmount, order.currency)}
          </Text>
        </View>

        <Text style={styles.orderNumber}>{order.orderNo}</Text>
        <View style={styles.metaRow}>
          {order.placedAt ? (
            <Text numberOfLines={1} style={styles.placedAt}>
              {formatDate(order.placedAt)}
            </Text>
          ) : null}
          <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
            <Text style={[styles.statusText, { color: status.foreground }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {order.items.length > 0 ? (
          <View style={styles.items}>
            {order.items.map(item => (
              <Text key={item.id} style={styles.itemText}>
                {item.productName} ×{item.quantity}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function formatAmount(amount: number | null, currency: string | null): string {
  if (amount === null) {
    return 'Amount unavailable';
  }

  try {
    return new Intl.NumberFormat(undefined, currency ? {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    } : { maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency ?? ''} ${amount.toLocaleString()}`.trim();
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getStatusPresentation(theme: AppTheme): Record<
  OrderStatus,
  { label: string; foreground: string; background: string }
> {
  const { colors } = theme;
  const ordered = {
    foreground: colors.orderedText,
    background: colors.orderedSurface,
  };
  const inTransit = {
    foreground: colors.inTransitText,
    background: colors.inTransitSurface,
  };
  return {
    UNKNOWN: { label: 'Unknown', ...ordered },
    CONFIRMED: { label: 'Confirmed', ...ordered },
    DISPATCHED: { label: 'Dispatched', ...inTransit },
    SHIPPED: { label: 'Shipped', ...inTransit },
    OUT_FOR_DELIVERY: {
      label: 'Out for delivery',
      foreground: colors.outForDeliveryText,
      background: colors.outForDeliverySurface,
    },
    DELIVERED: {
      label: 'Delivered',
      foreground: colors.deliveredText,
      background: colors.deliveredSurface,
    },
    CANCELLED: {
      label: 'Cancelled',
      foreground: colors.danger,
      background: colors.dangerSurface,
    },
  };
}
