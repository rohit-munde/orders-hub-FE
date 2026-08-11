import React, { useCallback, useEffect, useState } from 'react';
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
import { HomeHeader } from './components/HomeHeader';
import { OrderRow } from './components/OrderRow';
import { useOrders } from './hooks/useOrders';
import { Order } from './types';
import { ProfilePage } from './components/profile/ProfilePage';

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
    isLoadingMore,
    error,
    loadMoreError,
    refresh,
    loadMore,
  } = useOrders(session.appToken, onSessionExpired);

  const [relativeSyncTime, setRelativeSyncTime] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState<boolean>(false);

  useEffect(() => {
    if (!lastSyncedAt) {
      setRelativeSyncTime(null);
      return;
    }

    const update = () => {
      setRelativeSyncTime(formatDate(lastSyncedAt));
    };

    update();
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const interval = setInterval(update, 10000); // Update relative time every 10s

    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => <OrderRow order={item} />,
    [],
  );

  if (showProfile) {
    return (
      <ProfilePage
        session={session}
        onBack={() => setShowProfile(false)}
        onLogout={onSessionExpired}
      />
    );
  }

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
              <HomeHeader name={session.user.name} onProfilePress={() => setShowProfile(true)} />
              <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Orders</Text>
                {relativeSyncTime ? (
                  <View style={styles.syncContainer}>
                    <View style={styles.syncDotBadge}>
                      <View style={styles.syncDotInner} />
                    </View>
                    <Text style={styles.syncText}>Synced {relativeSyncTime}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={<EmptyState error={error} onRefresh={refresh} />}
          ListFooterComponent={
            <OrdersFooter
              hasOrders={orders.length > 0}
              isLoadingMore={isLoadingMore}
              loadMoreError={loadMoreError}
              error={error}
              onLoadMoreRetry={loadMore}
              onRefreshRetry={refresh}
            />
          }
          onEndReached={() => loadMore().catch(() => undefined)}
          onEndReachedThreshold={0.4}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
        />
      </View>
    </AppScreen>
  );
}

function OrdersFooter({
  hasOrders,
  isLoadingMore,
  loadMoreError,
  error,
  onLoadMoreRetry,
  onRefreshRetry,
}: {
  hasOrders: boolean;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  error: string | null;
  onLoadMoreRetry: () => Promise<void>;
  onRefreshRetry: () => Promise<void>;
}): React.JSX.Element | null {
  const styles = useStyles().home;
  if (isLoadingMore) {
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator color={styles.loading.color} />
      </View>
    );
  }
  if (loadMoreError) {
    return <RetryableError message={loadMoreError} onRetry={onLoadMoreRetry} />;
  }
  if (hasOrders && error) {
    return <RetryableError message={error} onRetry={onRefreshRetry} />;
  }
  return null;
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

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) {
    return 'just now';
  }

  if (seconds < 60) {
    return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return days === 1 ? 'yesterday' : `${days} days ago`;
  }

  return date.toLocaleDateString();
}
