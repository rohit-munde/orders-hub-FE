import { useCallback, useEffect, useRef, useState } from 'react';
import { clearAuthSession } from '../../auth/services/secureTokenStorage';
import { getOrders, syncOrders } from '../services/ordersService';
import { Order } from '../types';
import { ApiError } from '../../../services/http/ApiError';

export type UseOrdersResult = {
  orders: Order[];
  lastSyncedAt: string | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasNext: boolean;
  error: string | null;
  loadMoreError: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
};

export function useOrders(
  appToken: string,
  onSessionExpired: () => void,
): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const resetInFlightRef = useRef(false);
  const loadMoreInFlightRef = useRef(false);
  const nextPageRef = useRef(0);
  const hasNextRef = useRef(false);
  const generationRef = useRef(0);

  const expireSession = useCallback(async () => {
    try {
      await clearAuthSession();
    } finally {
      onSessionExpired();
    }
  }, [onSessionExpired]);

  const run = useCallback(
    async (force: boolean) => {
      if (resetInFlightRef.current) {
        return;
      }

      resetInFlightRef.current = true;
      const generation = ++generationRef.current;
      force ? setIsRefreshing(true) : setIsInitialLoading(true);
      setError(null);
      setLoadMoreError(null);
      let syncError: unknown = null;

      try {
        try {
          await syncOrders(appToken, force);
        } catch (caughtError) {
          if (isUnauthorized(caughtError)) {
            await expireSession();
            return;
          }
          syncError = caughtError;
        }

        try {
          const response = await getOrders(appToken, 0);
          if (generation !== generationRef.current) return;
          setOrders(response.orders.content);
          setLastSyncedAt(response.lastSyncedAt);
          nextPageRef.current = response.orders.pagination.page + 1;
          hasNextRef.current = response.orders.pagination.hasNext;
          setHasNext(response.orders.pagination.hasNext);
          setError(syncError ? messageFor(syncError) : null);
        } catch (caughtError) {
          if (isUnauthorized(caughtError)) {
            await expireSession();
            return;
          }
          setError(messageFor(caughtError));
        }
      } finally {
        resetInFlightRef.current = false;
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [appToken, expireSession],
  );

  const load = useCallback(() => run(false), [run]);
  const refresh = useCallback(() => run(true), [run]);

  const loadMore = useCallback(async () => {
    if (
      resetInFlightRef.current ||
      loadMoreInFlightRef.current ||
      !hasNextRef.current
    ) {
      return;
    }

    loadMoreInFlightRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    const generation = generationRef.current;

    try {
      const response = await getOrders(appToken, nextPageRef.current);
      if (generation !== generationRef.current) return;
      setOrders(current => appendUnique(current, response.orders.content));
      nextPageRef.current = response.orders.pagination.page + 1;
      hasNextRef.current = response.orders.pagination.hasNext;
      setHasNext(response.orders.pagination.hasNext);
      setLastSyncedAt(response.lastSyncedAt);
    } catch (caughtError) {
      if (generation !== generationRef.current) return;
      if (isUnauthorized(caughtError)) {
        await expireSession();
        return;
      }
      setLoadMoreError(messageFor(caughtError));
    } finally {
      loadMoreInFlightRef.current = false;
      setIsLoadingMore(false);
    }
  }, [appToken, expireSession]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return {
    orders,
    lastSyncedAt,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    hasNext,
    error,
    loadMoreError,
    load,
    refresh,
    loadMore,
  };
}

function appendUnique(current: Order[], incoming: Order[]): Order[] {
  const seen = new Set(current.map(order => order.id));
  const appended: Order[] = [];
  incoming.forEach(order => {
    if (!seen.has(order.id)) {
      seen.add(order.id);
      appended.push(order);
    }
  });
  return [...current, ...appended];
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'Connect or reconnect Gmail to sync your orders.';
    }
    if (error.status === 502) {
      return 'Gmail sync is temporarily unavailable. Please try again.';
    }
    return error.message;
  }

  return 'Orders could not be loaded. Check your connection and try again.';
}
