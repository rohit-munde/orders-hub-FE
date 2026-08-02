import { useCallback, useEffect, useRef, useState } from 'react';
import { getOrdersPage } from '../services/ordersService';
import { OrderSummary } from '../types';

export function useInfiniteOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const page = await getOrdersPage(cursorRef.current);
      setOrders(current => [...current, ...page.orders]);
      cursorRef.current = page.nextCursor;
      hasMoreRef.current = page.nextCursor !== null;
    } catch {
      setError('Orders could not be loaded. Pull down or try again shortly.');
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMore().catch(() => undefined);
  }, [loadMore]);

  return {
    orders,
    isLoading,
    error,
    hasMore: hasMoreRef.current,
    loadMore,
  };
}
