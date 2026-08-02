import { authenticateWithGoogle } from '../src/features/auth/services/authApi';

const backendResponse = {
  appToken: 'signed-jwt',
  user: {
    id: 42,
    email: 'user@example.com',
    name: 'Test User',
    pictureUrl: null,
  },
  connectedAccount: {
    id: 7,
    email: 'user@example.com',
    status: 'CONNECTED',
  },
  syncPreview: {
    query: 'newer_than:30d',
    messageCount: 1,
    nextPageTokenAvailable: false,
    messages: [
      {
        gmailMessageId: 'gmail-message-id',
        threadId: 'gmail-thread-id',
        subject: null,
        from: 'store@example.com',
        date: null,
        messageId: null,
      },
    ],
  },
};

describe('authenticateWithGoogle', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps the authentication envelope returned by the backend', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(backendResponse),
    } as unknown as Response);

    const session = await authenticateWithGoogle({
      idToken: 'google-id-token',
      serverAuthCode: 'google-server-auth-code',
    });

    expect(session).toEqual(backendResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/google'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          idToken: 'google-id-token',
          serverAuthCode: 'google-server-auth-code',
        }),
      }),
    );
  });
});
