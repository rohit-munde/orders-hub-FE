import React from 'react';
import { Clipboard, Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTheme, useAppTheme } from '../../../../theme/AppThemeProvider';
import { Order, OrderStatus } from '../../types';
import { CopyIcon } from './components/CopyIcon';


type OrderRowProps = {
  order: Order;
};

export function OrderRow({ order }: OrderRowProps): React.JSX.Element {
  const { theme } = useAppTheme();
  const styles = theme.styles.orderRow;
  const merchant = order.brandName ?? order.merchantKey ?? 'Unknown merchant';
  const logoUrl = order.logoUrl ?? '';
  const status = getStatusPresentation(theme)[order.status];
  const [imageError, setImageError] = React.useState(false);

  const showLogo = Boolean(logoUrl) && !imageError;

  return (
    <View style={styles.card}>
      <View style={styles.topSection}>
        <View
          style={[
            styles.merchantBadge,
            { backgroundColor: showLogo ? '#FFFFFF' : getMerchantColor(merchant) },
          ]}
        >
          {showLogo ? (
            <Image
              style={styles.merchantLogo}
              source={{ uri: logoUrl }}
              onError={() => setImageError(true)}
            />
          ) : (
            <Text style={styles.merchantInitial}>
              {merchant.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.merchantInfo}>
          <Text numberOfLines={1} style={styles.merchantName}>{merchant}</Text>
          {order.placedAt ? (
            <Text style={styles.placedAt}>
              {formatPlacedDate(order.placedAt)}
            </Text>
          ) : null}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {formatAmount(order.billAmount, order.currency)}
          </Text>
          {order.refundAmount !== null && order.refundAmount !== undefined ? (
            <Text style={styles.refundText}>
              -{formatAmount(order.refundAmount, order.currency)} refunded
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomSection}>
        <View style={styles.orderNumberRow}>
          <Text style={styles.hashtag}># </Text>
          <Text style={styles.orderNumber}>{order.orderNo}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy order ID"
            onPress={() => Clipboard.setString(order.orderNo)}
            style={({ pressed }) => [
              styles.copyIconContainer,
              pressed && { opacity: 0.6 },
            ]}
          >
            <CopyIcon
              color={theme.colors.textMuted}
              backgroundColor={theme.colors.surface}
            />
          </Pressable>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
          <View style={[styles.statusDot, { backgroundColor: status.foreground }]} />
          <Text style={[styles.statusText, { color: status.foreground }]}>
            {status.label}
          </Text>
        </View>
      </View>
    </View>
  );
}



function getMerchantColor(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes('amazon')) {
    return '#FF9900';
  }
  if (normalized.includes('flipkart')) {
    return '#2874F0';
  }
  if (normalized.includes('swiggy')) {
    return '#FC8019';
  }
  if (normalized.includes('zomato')) {
    return '#CB202D';
  }
  if (normalized.includes('uber')) {
    return '#000000';
  }
  if (normalized.includes('ola')) {
    return '#A3C614';
  }

  const colors = [
    '#FF9900', '#2874F0', '#FC8019', '#CB202D',
    '#000000', '#059669', '#7C3AED', '#DB2777',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    /* eslint-disable-next-line no-bitwise */
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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

function formatPlacedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return formatted.replace(/,\s*/, ' · ');
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
    REFUNDED: {
      label: 'Refunded',
      foreground: colors.danger,
      background: colors.dangerSurface,
    },
  };
}

