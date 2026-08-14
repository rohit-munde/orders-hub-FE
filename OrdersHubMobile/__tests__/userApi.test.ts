import { getCurrentUserDetails } from '../src/features/auth/services/userApi';
import { ApiError } from '../src/services/http/ApiError';

const mockUserDetails = {
  name: 'Rohit Munde',
  pictureUrl: 'https://example.com/avatar.jpg',
  connectedInboxCount: 2,
  trackedOrderCount: 230,
};

describe('getCurrentUserDetails', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps the user details response returned by the backend', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        success: true,
        message: 'User info fetched successfully',
        payload: mockUserDetails,
      }),
    } as unknown as Response);

    const details = await getCurrentUserDetails('app-jwt-token');

    expect(details).toEqual(mockUserDetails);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/me'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer app-jwt-token',
        }),
      }),
    );
  });

  it('throws an error on failure response status', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        status: 400,
        message: 'Invalid request',
      }),
    } as unknown as Response);

    await expect(getCurrentUserDetails('invalid-token')).rejects.toThrow(ApiError);
  });
});
