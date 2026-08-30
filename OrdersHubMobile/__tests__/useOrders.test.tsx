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
const thirdOrder = createOrder(23, 'Myntra');
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
    expect(getOrders).toHaveBeenCalledWith('app-jwt', 0);
    expect((syncOrders as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (getOrders as jest.Mock).mock.invocationCallOrder[0],
    );
    expect(latest?.orders).toEqual([firstOrder]);
    expect(latest?.lastSyncedAt).toBe('2026-08-03T12:00:00Z');
  });

  it('uses force=true and reloads orders on pull-to-refresh', async () => {
    await renderHook();
    (getOrders as jest.Mock).mockResolvedValue(
      response([secondOrder], 0, false, '2026-08-04T09:30:00Z'),
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

  it('appends and deduplicates the next page without syncing again', async () => {
    (getOrders as jest.Mock)
      .mockResolvedValueOnce(response([firstOrder], 0, true))
      .mockResolvedValueOnce(response([firstOrder, secondOrder], 1, false));
    await renderHook();

    await ReactTestRenderer.act(async () => latest?.loadMore());

    expect(getOrders).toHaveBeenLastCalledWith('app-jwt', 1);
    expect(syncOrders).toHaveBeenCalledTimes(1);
    expect(latest?.orders.map(order => order.id)).toEqual([21, 22]);
    expect(latest?.hasNext).toBe(false);
  });

  it('ignores repeated load-more calls while a page is in flight', async () => {
    let resolvePage!: (value: OrdersResponse) => void;
    const pagePromise = new Promise<OrdersResponse>(resolve => {
      resolvePage = resolve;
    });
    (getOrders as jest.Mock)
      .mockResolvedValueOnce(response([firstOrder], 0, true))
      .mockReturnValueOnce(pagePromise);
    await renderHook();

    let firstLoad!: Promise<void>;
    await ReactTestRenderer.act(async () => {
      firstLoad = latest!.loadMore();
      await latest!.loadMore();
    });
    expect(getOrders).toHaveBeenCalledTimes(2);

    resolvePage(response([secondOrder], 1, false));
    await ReactTestRenderer.act(async () => firstLoad);
  });

  it('does not request another page when the backend reports no next page', async () => {
    (getOrders as jest.Mock).mockResolvedValue(
      response([firstOrder], 0, false),
    );
    await renderHook();

    await ReactTestRenderer.act(async () => latest?.loadMore());

    expect(getOrders).toHaveBeenCalledTimes(1);
  });

  it('preserves rows and retries only the failed next page', async () => {
    (getOrders as jest.Mock)
      .mockResolvedValueOnce(response([firstOrder], 0, true))
      .mockRejectedValueOnce(new ApiError('Page unavailable', { status: 503 }))
      .mockResolvedValueOnce(response([secondOrder], 1, false));
    await renderHook();

    await ReactTestRenderer.act(async () => latest?.loadMore());
    expect(latest?.orders).toEqual([firstOrder]);
    expect(latest?.loadMoreError).toBe('Page unavailable');

    await ReactTestRenderer.act(async () => latest?.loadMore());
    expect(latest?.orders).toEqual([firstOrder, secondOrder]);
    expect(syncOrders).toHaveBeenCalledTimes(1);
  });

  it('expires the session when loading another page returns 401', async () => {
    const onSessionExpired = jest.fn();
    (getOrders as jest.Mock)
      .mockResolvedValueOnce(response([firstOrder], 0, true))
      .mockRejectedValueOnce(new ApiError('Unauthorized', { status: 401 }));
    await renderHook(onSessionExpired);

    await ReactTestRenderer.act(async () => latest?.loadMore());

    expect(clearAuthSession).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('ignores an old token response and loads page zero for the new token', async () => {
    let resolveOldToken!: (value: OrdersResponse) => void;
    const oldTokenResponse = new Promise<OrdersResponse>(resolve => {
      resolveOldToken = resolve;
    });
    (getOrders as jest.Mock)
      .mockReturnValueOnce(oldTokenResponse)
      .mockResolvedValueOnce(response([secondOrder]));

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HookHarness appToken="old-token" onSessionExpired={jest.fn()} />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer.update(
        <HookHarness appToken="new-token" onSessionExpired={jest.fn()} />,
      );
    });

    expect(getOrders).toHaveBeenLastCalledWith('new-token', 0);
    expect(latest?.orders).toEqual([secondOrder]);

    resolveOldToken(response([firstOrder]));
    await ReactTestRenderer.act(async () => {
      await oldTokenResponse;
    });

    expect(latest?.orders).toEqual([secondOrder]);
  });

  it('ignores an old token sync rejection after the token changes', async () => {
    let rejectOldSync!: (reason: unknown) => void;
    const oldTokenSync = new Promise<OrdersSyncResponse>((_, reject) => {
      rejectOldSync = reject;
    });
    (syncOrders as jest.Mock)
      .mockReturnValueOnce(oldTokenSync)
      .mockResolvedValueOnce(completedSync);
    (getOrders as jest.Mock).mockResolvedValue(response([secondOrder]));
    const oldSessionExpired = jest.fn();
    const newSessionExpired = jest.fn();

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HookHarness
          appToken="old-token"
          onSessionExpired={oldSessionExpired}
        />,
      );
    });
    await ReactTestRenderer.act(async () => {
      renderer.update(
        <HookHarness
          appToken="new-token"
          onSessionExpired={newSessionExpired}
        />,
      );
    });
    expect(latest?.orders).toEqual([secondOrder]);

    rejectOldSync(new ApiError('Unauthorized', { status: 401 }));
    await ReactTestRenderer.act(async () => {
      await oldTokenSync.catch(() => undefined);
    });

    expect(clearAuthSession).not.toHaveBeenCalled();
    expect(oldSessionExpired).not.toHaveBeenCalled();
    expect(newSessionExpired).not.toHaveBeenCalled();
    expect(latest?.orders).toEqual([secondOrder]);
    expect(latest?.error).toBeNull();
  });

  it('ignores an old token page-zero rejection after the token changes', async () => {
    let rejectOldPage!: (reason: unknown) => void;
    const oldTokenPage = new Promise<OrdersResponse>((_, reject) => {
      rejectOldPage = reject;
    });
    (getOrders as jest.Mock)
      .mockReturnValueOnce(oldTokenPage)
      .mockResolvedValueOnce(response([secondOrder]));
    const oldSessionExpired = jest.fn();
    const newSessionExpired = jest.fn();

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HookHarness
          appToken="old-token"
          onSessionExpired={oldSessionExpired}
        />,
      );
    });
    await ReactTestRenderer.act(async () => {
      renderer.update(
        <HookHarness
          appToken="new-token"
          onSessionExpired={newSessionExpired}
        />,
      );
    });
    expect(latest?.orders).toEqual([secondOrder]);

    rejectOldPage(new ApiError('Unauthorized', { status: 401 }));
    await ReactTestRenderer.act(async () => {
      await oldTokenPage.catch(() => undefined);
    });

    expect(clearAuthSession).not.toHaveBeenCalled();
    expect(oldSessionExpired).not.toHaveBeenCalled();
    expect(newSessionExpired).not.toHaveBeenCalled();
    expect(latest?.orders).toEqual([secondOrder]);
    expect(latest?.error).toBeNull();
  });

  it('clears account-scoped orders and pagination when the token changes', async () => {
    (syncOrders as jest.Mock)
      .mockResolvedValueOnce(completedSync)
      .mockRejectedValueOnce(new ApiError('New sync failed', { status: 502 }));
    (getOrders as jest.Mock)
      .mockResolvedValueOnce(response([firstOrder], 0, true))
      .mockRejectedValueOnce(new ApiError('New list failed', { status: 503 }));
    const onSessionExpired = jest.fn();

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HookHarness
          appToken="old-token"
          onSessionExpired={onSessionExpired}
        />,
      );
    });
    expect(latest?.orders).toEqual([firstOrder]);
    expect(latest?.hasNext).toBe(true);

    await ReactTestRenderer.act(async () => {
      renderer.update(
        <HookHarness
          appToken="new-token"
          onSessionExpired={onSessionExpired}
        />,
      );
    });

    expect(latest?.orders).toEqual([]);
    expect(latest?.lastSyncedAt).toBeNull();
    expect(latest?.hasNext).toBe(false);
    expect(latest?.error).toBe('New list failed');

    await ReactTestRenderer.act(async () => latest?.loadMore());
    expect(getOrders).toHaveBeenCalledTimes(2);
  });

  it('lets a refresh own a new append while the previous append is pending', async () => {
    let resolveOldAppend!: (value: OrdersResponse) => void;
    let resolveNewAppend!: (value: OrdersResponse) => void;
    const oldAppend = new Promise<OrdersResponse>(resolve => {
      resolveOldAppend = resolve;
    });
    const newAppend = new Promise<OrdersResponse>(resolve => {
      resolveNewAppend = resolve;
    });
    (getOrders as jest.Mock)
      .mockResolvedValueOnce(response([firstOrder], 0, true))
      .mockReturnValueOnce(oldAppend)
      .mockResolvedValueOnce(response([secondOrder], 0, true))
      .mockReturnValueOnce(newAppend);
    await renderHook();

    let oldLoad!: Promise<void>;
    await ReactTestRenderer.act(async () => {
      oldLoad = latest!.loadMore();
    });
    await ReactTestRenderer.act(async () => latest?.refresh());

    let newLoad!: Promise<void>;
    await ReactTestRenderer.act(async () => {
      newLoad = latest!.loadMore();
    });
    expect(getOrders).toHaveBeenCalledTimes(4);
    expect(latest?.isLoadingMore).toBe(true);

    resolveOldAppend(response([firstOrder], 1, false));
    await ReactTestRenderer.act(async () => {
      await oldLoad;
    });
    expect(latest?.isLoadingMore).toBe(true);
    await ReactTestRenderer.act(async () => latest?.loadMore());
    expect(getOrders).toHaveBeenCalledTimes(4);

    resolveNewAppend(response([thirdOrder], 1, false));
    await ReactTestRenderer.act(async () => {
      await newLoad;
    });
    expect(latest?.orders).toEqual([secondOrder, thirdOrder]);
    expect(latest?.isLoadingMore).toBe(false);
  });

  it('lets a new token append while the previous token append is pending', async () => {
    let resolveOldAppend!: (value: OrdersResponse) => void;
    let resolveNewAppend!: (value: OrdersResponse) => void;
    const oldAppend = new Promise<OrdersResponse>(resolve => {
      resolveOldAppend = resolve;
    });
    const newAppend = new Promise<OrdersResponse>(resolve => {
      resolveNewAppend = resolve;
    });
    (getOrders as jest.Mock)
      .mockResolvedValueOnce(response([firstOrder], 0, true))
      .mockReturnValueOnce(oldAppend)
      .mockResolvedValueOnce(response([secondOrder], 0, true))
      .mockReturnValueOnce(newAppend);
    const onSessionExpired = jest.fn();

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HookHarness
          appToken="old-token"
          onSessionExpired={onSessionExpired}
        />,
      );
    });
    let oldLoad!: Promise<void>;
    await ReactTestRenderer.act(async () => {
      oldLoad = latest!.loadMore();
    });

    await ReactTestRenderer.act(async () => {
      renderer.update(
        <HookHarness
          appToken="new-token"
          onSessionExpired={onSessionExpired}
        />,
      );
    });
    let newLoad!: Promise<void>;
    await ReactTestRenderer.act(async () => {
      newLoad = latest!.loadMore();
    });
    expect(getOrders).toHaveBeenCalledTimes(4);
    expect(latest?.isLoadingMore).toBe(true);

    resolveOldAppend(response([firstOrder], 1, false));
    await ReactTestRenderer.act(async () => {
      await oldLoad;
    });
    expect(latest?.isLoadingMore).toBe(true);

    resolveNewAppend(response([thirdOrder], 1, false));
    await ReactTestRenderer.act(async () => {
      await newLoad;
    });
    expect(latest?.orders).toEqual([secondOrder, thirdOrder]);
    expect(latest?.isLoadingMore).toBe(false);
  });

  it('never returns old account state during the first new-token render', async () => {
    let resolveNewTokenSync!: (value: OrdersSyncResponse) => void;
    const newTokenSync = new Promise<OrdersSyncResponse>(resolve => {
      resolveNewTokenSync = resolve;
    });
    (syncOrders as jest.Mock)
      .mockResolvedValueOnce(completedSync)
      .mockReturnValueOnce(newTokenSync);
    (getOrders as jest.Mock)
      .mockResolvedValueOnce(response([firstOrder], 0, true))
      .mockResolvedValueOnce(response([secondOrder]));
    let firstNewTokenRender:
      | Pick<UseOrdersResult, 'orders' | 'lastSyncedAt' | 'hasNext'>
      | undefined;
    const captureRender = (appToken: string, result: UseOrdersResult) => {
      if (appToken === 'new-token' && !firstNewTokenRender) {
        firstNewTokenRender = {
          orders: result.orders,
          lastSyncedAt: result.lastSyncedAt,
          hasNext: result.hasNext,
        };
      }
    };
    const onSessionExpired = jest.fn();

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HookHarness
          appToken="old-token"
          onSessionExpired={onSessionExpired}
          onRender={captureRender}
        />,
      );
    });
    expect(latest?.orders).toEqual([firstOrder]);

    await ReactTestRenderer.act(async () => {
      renderer.update(
        <HookHarness
          appToken="new-token"
          onSessionExpired={onSessionExpired}
          onRender={captureRender}
        />,
      );
    });

    expect(firstNewTokenRender).toEqual({
      orders: [],
      lastSyncedAt: null,
      hasNext: false,
    });

    resolveNewTokenSync(completedSync);
    await ReactTestRenderer.act(async () => {
      await newTokenSync;
    });
    expect(latest?.orders).toEqual([secondOrder]);
  });
});

async function renderHook(onSessionExpired = jest.fn()) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <HookHarness appToken="app-jwt" onSessionExpired={onSessionExpired} />,
    );
  });
  return renderer!;
}

function HookHarness({
  appToken,
  onSessionExpired,
  onRender,
}: {
  appToken: string;
  onSessionExpired: () => void;
  onRender?: (appToken: string, result: UseOrdersResult) => void;
}): null {
  latest = useOrders(appToken, onSessionExpired);
  onRender?.(appToken, latest);
  return null;
}

function response(
  orders: Order[],
  page = 0,
  hasNext = false,
  lastSyncedAt = '2026-08-03T12:00:00Z',
): OrdersResponse {
  return {
    lastSyncedAt,
    orders: {
      content: orders,
      pagination: {
        page,
        size: 10,
        totalElements: hasNext ? (page + 2) * 10 : page * 10 + orders.length,
        totalPages: hasNext ? page + 2 : page + 1,
        hasNext,
        hasPrevious: page > 0,
      },
    },
  };
}

function createOrder(id: number, brandName: string): Order {
  return {
    id,
    merchantKey: `${brandName.toLowerCase()}.in`,
    brandName,
    orderNo: `ORDER-${id}`,
    billAmount: 1499,
    refundAmount: null,
    currency: 'INR',
    paid: true,
    status: 'SHIPPED',
    placedAt: '2026-08-03T10:00:00Z',
    items: [],
  };
}
