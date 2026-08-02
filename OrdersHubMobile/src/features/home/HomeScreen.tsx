import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { AppScreen } from '../../components/layout/AppScreen';
import { useStyles } from '../../theme/AppThemeProvider';
import { AuthSession } from '../auth/types';
import { BottomNavigation } from './components/BottomNavigation';
import { HomeHeader } from './components/HomeHeader';
import { OrderRow } from './components/OrderRow';
import { SpendingOverview } from './components/SpendingOverview';
import { useInfiniteOrders } from './hooks/useInfiniteOrders';
import { OrderSummary } from './types';

type HomeScreenProps = {
  session: AuthSession;
};

export function HomeScreen({ session }: HomeScreenProps): React.JSX.Element {
  const styles = useStyles().home;
  const { orders, error, hasMore, isLoading, loadMore } = useInfiniteOrders();

  const renderOrder = useCallback(
    ({ item }: { item: OrderSummary }) => <OrderRow order={item} />,
    [],
  );

  return (
    <AppScreen>
      <View style={styles.screen}>
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          ItemSeparatorComponent={OrderSeparator}
          ListHeaderComponent={
            <View>
              <HomeHeader name={session.user.name} />
              <SpendingOverview />
              <Text style={styles.sectionTitle}>Active orders</Text>
            </View>
          }
          ListFooterComponent={
            <ListFooter error={error} hasMore={hasMore} isLoading={isLoading} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => loadMore().catch(() => undefined)}
          onEndReachedThreshold={0.35}
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

function ListFooter({
  error,
  hasMore,
  isLoading,
}: {
  error: string | null;
  hasMore: boolean;
  isLoading: boolean;
}): React.JSX.Element | null {
  const styles = useStyles().home;

  if (isLoading) {
    return <ActivityIndicator color={styles.loading.color} style={styles.footer} />;
  }

  if (error) {
    return <Text style={[styles.footer, styles.error]}>{error}</Text>;
  }

  if (!hasMore) {
    return <Text style={styles.footer}>You’re all caught up.</Text>;
  }

  return null;
}
