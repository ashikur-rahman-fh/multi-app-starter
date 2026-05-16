import { afterEach, describe, expect, it, vi } from 'vitest';
import { USER_MESSAGES } from './errors';
import { getApiBaseUrl, getJson } from './client';

describe('getApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns configured URL when set', () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com');
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('throws in production when unset', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
    expect(() => getApiBaseUrl()).toThrow(/NEXT_PUBLIC_API_BASE_URL/);
  });
});

describe('getJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('requests the correct URL for a relative path', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://example.test');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Hello' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await getJson('/api/hello/');

    expect(fetchMock).toHaveBeenCalledWith('http://example.test/api/hello/');
  });

  it('throws a network ApiError when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(getJson('/api/hello/')).rejects.toMatchObject({
      userMessage: USER_MESSAGES.network,
    });
  });

  it('maps HTTP status codes to safe messages', async () => {
    const cases = [
      { status: 404, message: USER_MESSAGES.notFound },
      { status: 405, message: USER_MESSAGES.methodNotAllowed },
      { status: 500, message: USER_MESSAGES.serverError },
    ] as const;

    for (const { status, message } of cases) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status,
          headers: { get: () => 'text/plain' },
        }),
      );

      await expect(getJson('/api/hello/')).rejects.toMatchObject({
        userMessage: message,
        status,
      });
    }
  });

  it('uses backend error envelope message when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: USER_MESSAGES.notFound,
            details: {},
          },
        }),
      }),
    );

    await expect(getJson('/api/hello/')).rejects.toMatchObject({
      userMessage: USER_MESSAGES.notFound,
      code: 'NOT_FOUND',
      status: 404,
    });
  });
});
