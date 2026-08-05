import { ApiError } from '../src/services/http/ApiError';
import {
  getOrders,
  syncOrders,
} from '../src/features/home/services/ordersService';

const syncResponse = {
  outcome: 'COMPLETED',
  lastSyncedAt: '2026-08-03T12:00:00Z',
  candidateCount: 20,
  savedCount: 5,
  skippedCount: 10,
  ignoredCount: 3,
  failedCount: 2,
};

const ordersResponse = {
  lastSyncedAt: null,
  orders: {
    content: [
      {
        id: 21,
        merchantKey: null,
        brandName: 'Amazon',
        orderNo: 'ORDER-123',
        billAmount: 1499,
        currency: 'INR',
        paid: null,
        status: 'SHIPPED',
        placedAt: null,
        items: [
          {
            id: 31,
            productName: 'USB-C Cable',
            productUrl: null,
            quantity: 2,
            price: null,
          },
        ],
      },
    ],
  },
};

describe('ordersService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([false, true])(
    'syncs with force=%s and the OrdersHub bearer token',
    async force => {
      const fetchMock = mockSuccess(syncResponse);

      await expect(syncOrders('app-jwt', force)).resolves.toEqual(syncResponse);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/orders/sync?force=${force}`),
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer app-jwt',
          },
        },
      );
    },
  );

  it('loads orders without changing nullable backend fields', async () => {
    const fetchMock = mockSuccess(ordersResponse);

    await expect(getOrders('app-jwt')).resolves.toEqual(ordersResponse);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/orders'),
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer app-jwt',
        },
      },
    );
  });

  it('throws a status-aware error without exposing credentials', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({
        timeStamp: '2026-08-05T22:11:00',
        status: 409,
        error: 'Conflict',
        message: 'Reconnect Gmail.',
        path: '/api/v1/orders',
        validationErrors: null,
      }),
    } as unknown as Response);

    await expect(getOrders('secret-app-jwt')).rejects.toEqual(
      expect.objectContaining<Partial<ApiError>>({
        name: 'ApiError',
        status: 409,
        error: 'Conflict',
        message: 'Reconnect Gmail.',
        path: '/api/v1/orders',
        timeStamp: '2026-08-05T22:11:00',
        validationErrors: null,
      }),
    );
  });

  it('maps an unreachable backend to a retryable service error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(getOrders('app-jwt')).rejects.toEqual(
      expect.objectContaining<Partial<ApiError>>({
        name: 'ApiError',
        status: null,
      }),
    );
  });
});

function mockSuccess(payload: unknown) {
  return jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({
      success: true,
      message: 'OK',
      payload,
    }),
  } as unknown as Response);
}
