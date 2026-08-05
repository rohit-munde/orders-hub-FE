import { httpService } from '../src/services/http/httpService';

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
});

function mockResponse(status: number, body: unknown) {
  return jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);
}
