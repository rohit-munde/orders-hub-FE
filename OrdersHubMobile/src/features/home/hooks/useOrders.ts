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
  error: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useOrders(
  appToken: string,
  onSessionExpired: () => void,
): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const expireSession = useCallback(async () => {
    try {
      await clearAuthSession();
    } finally {
      onSessionExpired();
    }
  }, [onSessionExpired]);

  const run = useCallback(
    async (force: boolean) => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      force ? setIsRefreshing(true) : setIsInitialLoading(true);
      setError(null);
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
          const response = await getOrders(appToken);
          setOrders(response.orders.content);
          setLastSyncedAt(response.lastSyncedAt);
          setError(syncError ? messageFor(syncError) : null);
        } catch (caughtError) {
          if (isUnauthorized(caughtError)) {
            await expireSession();
            return;
          }
          setError(messageFor(caughtError));
        }
      } finally {
        inFlightRef.current = false;
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [appToken, expireSession],
  );

  const load = useCallback(() => run(false), [run]);
  const refresh = useCallback(() => run(true), [run]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return {
    orders,
    lastSyncedAt,
    isInitialLoading,
    isRefreshing,
    error,
    load,
    refresh,
  };
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
