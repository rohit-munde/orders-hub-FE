import React from 'react';
import { ActivityIndicator, Clipboard, Image, Platform, Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { AppTheme, useAppTheme } from '../../../../theme/AppThemeProvider';
import { ApiError } from '../../../../services/http/ApiError';
import { DeliveryOtp, Order, OrderStatus } from '../../types';
import { CopyIcon } from './components/CopyIcon';


type OrderRowProps = {
  order: Order;
  /** Looks up the order's delivery OTP in Gmail. Without it, no OTP control is shown. */
  onRequestDeliveryOtp?: (orderId: number) => Promise<DeliveryOtp>;
};

const FINISHED_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'REFUNDED'];

export function OrderRow({ order, onRequestDeliveryOtp }: OrderRowProps): React.JSX.Element {
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

      {onRequestDeliveryOtp && !FINISHED_STATUSES.includes(order.status) ? (
        <DeliveryOtpControl orderId={order.id} requestOtp={onRequestDeliveryOtp} />
      ) : null}
    </View>
  );
}

type OtpState =
  | { kind: 'masked' }
  | { kind: 'loading' }
  | { kind: 'revealed'; otp: DeliveryOtp }
  | { kind: 'hidden'; otp: DeliveryOtp }
  | { kind: 'error'; text: string };

const MASK = '••••••';

/**
 * Shows a masked delivery OTP. The real code is fetched from Gmail only when the user taps
 * Show, kept in this component's state while the screen is open, and never saved anywhere.
 */
function DeliveryOtpControl({
  orderId,
  requestOtp,
}: {
  orderId: number;
  requestOtp: (orderId: number) => Promise<DeliveryOtp>;
}): React.JSX.Element {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const [state, setState] = React.useState<OtpState>({ kind: 'masked' });

  const reveal = async () => {
    if (state.kind === 'hidden') {
      setState({ kind: 'revealed', otp: state.otp });
      return;
    }
    setState({ kind: 'loading' });
    try {
      setState({ kind: 'revealed', otp: await requestOtp(orderId) });
    } catch (error) {
      setState({ kind: 'error', text: otpErrorMessage(error) });
    }
  };

  const copy = (otp: string) => {
    Clipboard.setString(otp);
    if (Platform.OS === 'android') {
      ToastAndroid.show('OTP copied', ToastAndroid.SHORT);
    }
  };

  const revealed = state.kind === 'revealed' ? state.otp : null;

  return (
    <View
      style={[otpStyles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      testID="delivery-otp"
    >
      <View style={otpStyles.labelColumn}>
        <Text style={[otpStyles.label, { color: colors.textMuted }]}>Delivery OTP</Text>
        {revealed?.receivedAt ? (
          <Text style={[otpStyles.hint, { color: colors.textMuted }]}>
            From email {formatPlacedDate(revealed.receivedAt)}
          </Text>
        ) : null}
      </View>

      <View style={otpStyles.valueColumn}>
        <Text
          style={[otpStyles.code, { color: revealed ? colors.text : colors.textMuted }]}
          selectable={Boolean(revealed)}
          accessibilityLabel={revealed ? `Delivery OTP ${revealed.otp.split('').join(' ')}` : 'Delivery OTP hidden'}
          testID="delivery-otp-value"
        >
          {revealed ? revealed.otp : MASK}
        </Text>
        {state.kind === 'error' ? (
          <Text style={[otpStyles.message, { color: colors.textMuted }]} testID="delivery-otp-message">
            {state.text}
          </Text>
        ) : null}
      </View>

      {state.kind === 'loading' ? (
        <ActivityIndicator size="small" color={colors.text} style={otpStyles.action} />
      ) : revealed ? (
        <View style={otpStyles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy delivery OTP"
            onPress={() => copy(revealed.otp)}
            hitSlop={8}
            testID="copy-delivery-otp"
            style={({ pressed }) => [otpStyles.copy, pressed && otpStyles.pressed]}
          >
            <CopyIcon color={colors.textMuted} backgroundColor={colors.surface} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hide delivery OTP"
            onPress={() => setState({ kind: 'hidden', otp: revealed })}
            hitSlop={8}
            testID="hide-delivery-otp"
            style={({ pressed }) => [otpStyles.action, pressed && otpStyles.pressed]}
          >
            <Text style={[otpStyles.actionText, { color: colors.text }]}>Hide</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show delivery OTP"
          onPress={reveal}
          hitSlop={8}
          testID="show-delivery-otp"
          style={({ pressed }) => [otpStyles.action, pressed && otpStyles.pressed]}
        >
          <Text style={[otpStyles.actionText, { color: colors.text }]}>
            {state.kind === 'error' ? 'Retry' : 'Show'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function otpErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'No OTP in your email yet. Couriers often send it by SMS.';
    }
    if (error.status === 409) {
      return 'Reconnect Gmail in Profile to look up OTPs.';
    }
    if (error.status === null) {
      return 'You seem to be offline. Check your connection.';
    }
  }
  return 'Could not check your email right now.';
}

const otpStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  labelColumn: {
    marginRight: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    fontSize: 10,
    marginTop: 2,
  },
  valueColumn: {
    flex: 1,
  },
  message: {
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  action: {
    minWidth: 44,
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  code: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  copy: {
    paddingLeft: 8,
  },
  pressed: {
    opacity: 0.6,
  },
});



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

