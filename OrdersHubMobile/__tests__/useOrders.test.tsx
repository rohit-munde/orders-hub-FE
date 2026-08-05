import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { clearAuthSession } from '../src/features/auth/services/secureTokenStorage';
import { useOrders, UseOrdersResult } from '../src/features/home/hooks/useOrders';
import { getOrders, syncOrders } from '../src/features/home/services/ordersService';
import { ApiError } from '../src/services/http/ApiError';
import { Order, OrdersResponse, OrdersSyncResponse } from '../src/features/home/types';

jest.mock('../src/features/home/services/ordersService', () => {
  const actual = jest.requireActual(
    '../src/features/home/services/ordersService',
  );
  return {
    ...actual,
    getOrders: jest.fn(),
    syncOrders: jest.fn(),
  };
});

jest.mock('../src/features/auth/services/secureTokenStorage', () => ({
  clearAuthSession: jest.fn(),
}));

const firstOrder = createOrder(21, 'Amazon');
const secondOrder = createOrder(22, 'Flipkart');
const completedSync: OrdersSyncResponse = {
  outcome: 'COMPLETED',
  lastSyncedAt: '2026-08-03T12:00:00Z',
  candidateCount: 2,
  savedCount: 2,
  skippedCount: 0,
  ignoredCount: 0,
  failedCount: 0,
};

let latest: UseOrdersResult | null = null;

describe('useOrders', () => {
  beforeEach(() => {
    latest = null;
    jest.resetAllMocks();
    (clearAuthSession as jest.Mock).mockResolvedValue(undefined);
    (syncOrders as jest.Mock).mockResolvedValue(completedSync);
    (getOrders as jest.Mock).mockResolvedValue(response([firstOrder]));
  });

  it('syncs with force=false and then loads orders on screen open', async () => {
    await renderHook();

    expect(syncOrders).toHaveBeenCalledWith('app-jwt', false);
    expect(getOrders).toHaveBeenCalledWith('app-jwt');
    expect((syncOrders as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (getOrders as jest.Mock).mock.invocationCallOrder[0],
    );
    expect(latest?.orders).toEqual([firstOrder]);
    expect(latest?.lastSyncedAt).toBe('2026-08-03T12:00:00Z');
  });

  it('uses force=true and reloads orders on pull-to-refresh', async () => {
    await renderHook();
    (getOrders as jest.Mock).mockResolvedValue(
      response([secondOrder], '2026-08-04T09:30:00Z'),
    );

    await ReactTestRenderer.act(async () => latest?.refresh());

    expect(syncOrders).toHaveBeenLastCalledWith('app-jwt', true);
    expect(getOrders).toHaveBeenCalledTimes(2);
    expect(latest?.orders).toEqual([secondOrder]);
    expect(latest?.lastSyncedAt).toBe('2026-08-04T09:30:00Z');
    expect(latest?.isRefreshing).toBe(false);
  });

  it('treats COOLDOWN as success and still loads orders', async () => {
    (syncOrders as jest.Mock).mockResolvedValue({
      ...completedSync,
      outcome: 'COOLDOWN',
    });

    await renderHook();

    expect(getOrders).toHaveBeenCalledTimes(1);
    expect(latest?.orders).toEqual([firstOrder]);
    expect(latest?.error).toBeNull();
  });

  it('preserves existing orders when a later sync and list request fail', async () => {
    await renderHook();
    (syncOrders as jest.Mock).mockRejectedValue(
      new ApiError('Gmail unavailable', { status: 502 }),
    );
    (getOrders as jest.Mock).mockRejectedValue(
      new ApiError('Gmail unavailable', { status: 502 }),
    );

    await ReactTestRenderer.act(async () => latest?.refresh());

    expect(getOrders).toHaveBeenCalledTimes(2);
    expect(latest?.orders).toEqual([firstOrder]);
    expect(latest?.error).toBe(
      'Gmail sync is temporarily unavailable. Please try again.',
    );
  });

  it('shows the Gmail reconnect copy for a 409 and still loads orders', async () => {
    (syncOrders as jest.Mock).mockRejectedValue(
      new ApiError('Backend conflict', { status: 409 }),
    );

    await renderHook();

    expect(latest?.orders).toEqual([firstOrder]);
    expect(latest?.error).toBe(
      'Connect or reconnect Gmail to sync your orders.',
    );
  });

  it('uses an unknown ApiError message when no status-specific copy exists', async () => {
    (getOrders as jest.Mock).mockRejectedValue(
      new ApiError('The backend returned an invalid orders response.'),
    );

    await renderHook();

    expect(latest?.error).toBe(
      'The backend returned an invalid orders response.',
    );
  });

  it('uses the safe fallback for a non-ApiError failure', async () => {
    (getOrders as jest.Mock).mockRejectedValue(new Error('socket exploded'));

    await renderHook();

    expect(latest?.error).toBe(
      'Orders could not be loaded. Check your connection and try again.',
    );
  });

  it('preserves the exact backend-provided order', async () => {
    (getOrders as jest.Mock).mockResolvedValue(
      response([secondOrder, firstOrder]),
    );

    await renderHook();

    expect(latest?.orders.map(order => order.id)).toEqual([22, 21]);
  });

  it('clears the secure session and reports a 401', async () => {
    const onSessionExpired = jest.fn();
    (syncOrders as jest.Mock).mockRejectedValue(
      new ApiError('Unauthorized', { status: 401 }),
    );

    await renderHook(onSessionExpired);

    expect(clearAuthSession).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(getOrders).not.toHaveBeenCalled();
  });
});

async function renderHook(onSessionExpired = jest.fn()) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <HookHarness onSessionExpired={onSessionExpired} />,
    );
  });
  return renderer!;
}

function HookHarness({
  onSessionExpired,
}: {
  onSessionExpired: () => void;
}): null {
  latest = useOrders('app-jwt', onSessionExpired);
  return null;
}

function response(
  orders: Order[],
  lastSyncedAt = '2026-08-03T12:00:00Z',
): OrdersResponse {
  return {
    lastSyncedAt,
    orders: { content: orders },
  };
}

function createOrder(id: number, brandName: string): Order {
  return {
    id,
    merchantKey: `${brandName.toLowerCase()}.in`,
    brandName,
    orderNo: `ORDER-${id}`,
    billAmount: 1499,
    currency: 'INR',
    paid: true,
    status: 'SHIPPED',
    placedAt: '2026-08-03T10:00:00Z',
    items: [],
  };
}
