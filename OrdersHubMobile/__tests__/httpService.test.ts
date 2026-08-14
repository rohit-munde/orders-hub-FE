import { httpService } from '../src/services/http/httpService';
import { ApiError } from '../src/services/http/ApiError';

describe('httpService success responses', () => {
  afterEach(() => jest.restoreAllMocks());

  it('posts JSON publicly and returns only the success payload', async () => {
    const payload = { appToken: 'signed-jwt' };
    const fetchMock = mockResponse(200, {
      success: true,
      message: 'Authenticated.',
      payload,
    });

    await expect(
      httpService.post<typeof payload>('/api/v1/auth/google', {
        body: { idToken: 'google-token' },
      }),
    ).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/google'),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'google-token' }),
      },
    );
  });

  it('adds a bearer token without adding a body header to GET', async () => {
    mockResponse(200, {
      success: true,
      message: 'Loaded.',
      payload: { orders: [] },
    });

    await httpService.get('/api/v1/orders', { token: 'app-jwt' });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/orders'), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer app-jwt',
      },
    });
  });

  it('sends DELETE request with returnFullResponse and returns the full success envelope', async () => {
    const fullResponse = {
      success: true,
      message: 'Google account disconnected successfully',
      payload: {
        connectedAccountDeleted: true,
        ordersDeleted: 3,
        emailSourcesDeleted: 5,
        disconnectedEmailId: 'shopper@gmail.com',
      },
    };

    const fetchMock = mockResponse(200, fullResponse);

    const result = await httpService.delete<typeof fullResponse.payload>(
      '/api/v1/connected-accounts/google/123',
      {
        token: 'app-jwt',
        returnFullResponse: true,
      },
    );

    expect(result).toEqual(fullResponse);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/connected-accounts/google/123'),
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer app-jwt',
        },
      },
    );
  });
});

it('yesta', async () => {
  mockResponse(422, {
    timeStamp: '2026-08-05T22:11:00',
    status: 422,
    error: 'Unprocessable Entity',
    message: 'Validation failed.',
    path: '/api/v1/orders',
    validationErrors: { force: 'must be a boolean' },
  });

  await expect(httpService.get('/api/v1/orders')).rejects.toEqual(
    expect.objectContaining<Partial<ApiError>>({
      name: 'ApiError',
      status: 422,
      error: 'Unprocessable Entity',
      message: 'Validation failed.',
      path: '/api/v1/orders',
      timeStamp: '2026-08-05T22:11:00',
      validationErrors: { force: 'must be a boolean' },
    }),
  );
});

it('uses a safe fallback for a malformed HTTP error body', async () => {
  mockResponse(503, null);
  await expect(httpService.get('/api/v1/orders')).rejects.toEqual(
    expect.objectContaining({ status: 503, message: 'Request failed (503).' }),
  );
});

it('maps a network failure to a status-less ApiError', async () => {
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
  await expect(httpService.get('/api/v1/orders')).rejects.toEqual(
    expect.objectContaining({
      name: 'ApiError',
      status: null,
      message: 'Could not reach Orders Hub. Check your connection and try again.',
    }),
  );
});

it.each([
  null,
  { success: false, message: 'No payload.', payload: {} },
  { success: true, message: 'Missing payload.' },
])('rejects malformed successful envelope %#', async body => {
  mockResponse(200, body);
  await expect(httpService.get('/api/v1/orders')).rejects.toEqual(
    expect.objectContaining({
      name: 'ApiError',
      status: null,
      message: 'The backend returned an invalid response.',
    }),
  );
});

function mockResponse(status: number, body: unknown) {
  return jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);
}
