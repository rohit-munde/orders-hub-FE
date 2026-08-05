import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { AppScreen } from '../../components/layout/AppScreen';
import { useStyles } from '../../theme/AppThemeProvider';
import { AuthSession } from '../auth/types';
import { BottomNavigation } from './components/BottomNavigation';
import { HomeHeader } from './components/HomeHeader';
import { OrderRow } from './components/OrderRow';
import { useOrders } from './hooks/useOrders';
import { Order } from './types';

type HomeScreenProps = {
  session: AuthSession;
  onSessionExpired: () => void;
};

export function HomeScreen({
  session,
  onSessionExpired,
}: HomeScreenProps): React.JSX.Element {
  const styles = useStyles().home;
  const {
    orders,
    lastSyncedAt,
    isInitialLoading,
    isRefreshing,
    error,
    refresh,
  } = useOrders(session.appToken, onSessionExpired);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => <OrderRow order={item} />,
    [],
  );

  if (isInitialLoading && orders.length === 0) {
    return (
      <AppScreen>
        <View style={styles.initialLoading}>
          <ActivityIndicator color={styles.loading.color} size="large" />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.screen}>
        <FlatList
          data={orders}
          keyExtractor={item => String(item.id)}
          renderItem={renderOrder}
          ItemSeparatorComponent={OrderSeparator}
          ListHeaderComponent={
            <View>
              <HomeHeader name={session.user.name} />
              <Text style={styles.sectionTitle}>Orders</Text>
              {lastSyncedAt ? (
                <Text style={styles.lastSynced}>
                  Last synced {formatDate(lastSyncedAt)}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={<EmptyState error={error} onRefresh={refresh} />}
          ListFooterComponent={
            orders.length > 0 && error ? (
              <RetryableError message={error} onRetry={refresh} />
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
        />
        <BottomNavigation />
      </View>
    </AppScreen>
  );
}

function OrderSeparator(): React.JSX.Element {
  const styles = useStyles().home;
  return <View style={styles.separator} />;
}

function EmptyState({
  error,
  onRefresh,
}: {
  error: string | null;
  onRefresh: () => Promise<void>;
}): React.JSX.Element {
  const styles = useStyles().home;
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>
        {error ?? 'No orders found in the last 45 days'}
      </Text>
      {!error ? (
        <Text style={styles.emptyDescription}>
          Pull down or refresh after connecting your Gmail inbox.
        </Text>
      ) : null}
      <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.retryButton}>
        <Text style={styles.retryText}>Refresh</Text>
      </Pressable>
    </View>
  );
}

function RetryableError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => Promise<void>;
}): React.JSX.Element {
  const styles = useStyles().home;
  return (
    <View style={styles.errorCard}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry}>
        <Text style={styles.errorAction}>Retry</Text>
      </Pressable>
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
