import Axios from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { createApiClient } from './create-api-client';
import { isApiError, USER_MESSAGES } from './errors';
import { createMockAdapter, mockJsonResponse } from './test-adapter';

const BASE = 'https://api.example.test';

function successAdapter(data: unknown = { ok: true }) {
  return createMockAdapter((config) => mockJsonResponse(config, { data }));
}

describe('createApiClient', () => {
  afterEach(() => {
    // no env stubs in these tests
  });

  it('performs a successful GET request', async () => {
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      adapter: successAdapter({ message: 'ok' }),
    });

    const result = await client.get<{ message: string }>('/api/hello/');
    expect(result).toEqual({ message: 'ok' });
  });

  it('performs a successful POST request with typed body', async () => {
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      adapter: createMockAdapter((config) => {
        const raw: unknown = config.data;
        let body: { name: string } = { name: '' };
        if (typeof raw === 'object' && raw !== null && 'name' in raw) {
          const record = raw as Record<string, unknown>;
          body = { name: String(record.name) };
        } else if (typeof raw === 'string') {
          const parsed: unknown = JSON.parse(raw);
          if (typeof parsed === 'object' && parsed !== null && 'name' in parsed) {
            const record = parsed as Record<string, unknown>;
            body = { name: String(record.name) };
          }
        }
        return mockJsonResponse(config, { data: { greeting: `Hi ${body.name}` } });
      }),
    });

    const result = await client.post<{ greeting: string }, { name: string }>('/api/greet/', {
      name: 'Ada',
    });
    expect(result).toEqual({ greeting: 'Hi Ada' });
  });

  it('uses request() with typed response', async () => {
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      adapter: successAdapter({ status: 'ok' }),
    });

    const result = await client.request<{ status: string }>({
      method: 'GET',
      url: '/api/health/',
    });
    expect(result).toEqual({ status: 'ok' });
  });

  it('configures baseURL on the axios instance', async () => {
    let capturedBase = '';
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      adapter: createMockAdapter((config) => {
        capturedBase = config.baseURL ?? '';
        return mockJsonResponse(config, { data: {} });
      }),
    });

    await client.get('/path');
    expect(capturedBase).toBe(BASE);
  });

  it('throws when baseURL is empty', () => {
    expect(() =>
      createApiClient({
        serviceName: 'test',
        baseURL: '   ',
      }),
    ).toThrow(/baseURL is required/);
  });

  it('throws when baseURL is invalid', () => {
    expect(() =>
      createApiClient({
        serviceName: 'test',
        baseURL: 'not-a-url',
      }),
    ).toThrow(/not a valid URL/);
  });

  it('applies timeout configuration', async () => {
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      timeoutMs: 5000,
      adapter: createMockAdapter((config) => {
        expect(config.timeout).toBe(5000);
        return mockJsonResponse(config, { data: {} });
      }),
    });

    await client.get('/api/hello/');
  });

  it('unwraps envelope responses when configured', async () => {
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      unwrapEnvelope: true,
      adapter: successAdapter({ success: true, data: { id: 1 } }),
    });

    const result = await client.get<{ id: number }>('/api/items/');
    expect(result).toEqual({ id: 1 });
  });

  it('never exposes raw Axios errors', async () => {
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      adapter: createMockAdapter((config) =>
        mockJsonResponse(config, {
          status: 500,
          data: { detail: 'Internal stack trace at /secret/path' },
        }),
      ),
    });

    await expect(client.get('/api/hello/')).rejects.toSatisfy((error: unknown) => {
      expect(isApiError(error)).toBe(true);
      if (isApiError(error)) {
        expect(error.message).toBe(USER_MESSAGES.serverError);
        expect(error.message).not.toContain('/secret/path');
      }
      return true;
    });
  });
});

describe('createApiClient HTTP errors', () => {
  const cases = [
    { status: 400, message: USER_MESSAGES.badRequest, flag: null },
    { status: 401, message: USER_MESSAGES.unauthorized, flag: 'isUnauthorized' as const },
    { status: 403, message: USER_MESSAGES.forbidden, flag: 'isForbidden' as const },
    { status: 404, message: USER_MESSAGES.notFound, flag: 'isNotFound' as const },
    { status: 422, message: USER_MESSAGES.validation, flag: 'isValidationError' as const },
    { status: 429, message: USER_MESSAGES.rateLimited, flag: null },
    { status: 500, message: USER_MESSAGES.serverError, flag: 'isServerError' as const },
  ] as const;

  for (const { status, message, flag } of cases) {
    it(`normalizes ${status} errors`, async () => {
      const client = createApiClient({
        serviceName: 'test',
        baseURL: BASE,
        adapter: createMockAdapter((config) =>
          mockJsonResponse(config, { status, data: { detail: 'raw backend' } }),
        ),
      });

      await expect(client.get('/api/hello/')).rejects.toMatchObject({
        message,
        status,
        serviceName: 'test',
        ...(flag ? { [flag]: true } : {}),
      });
    });
  }

  it('uses backend error envelope message when present', async () => {
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      adapter: createMockAdapter((config) =>
        mockJsonResponse(config, {
          status: 404,
          data: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: USER_MESSAGES.notFound,
              details: {},
            },
          },
        }),
      ),
    });

    await expect(client.get('/api/hello/')).rejects.toMatchObject({
      message: USER_MESSAGES.notFound,
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it('normalizes network errors', async () => {
    const networkError = new Axios.AxiosError('Network Error', 'ERR_NETWORK');
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      adapter: () => Promise.reject(networkError),
    });

    await expect(client.get('/api/hello/')).rejects.toMatchObject({
      message: USER_MESSAGES.network,
      isNetworkError: true,
    });
  });

  it('normalizes timeout errors', async () => {
    const timeoutError = new Axios.AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED');
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      adapter: () => Promise.reject(timeoutError),
    });

    await expect(client.get('/api/hello/')).rejects.toMatchObject({
      message: USER_MESSAGES.timeout,
      isTimeout: true,
    });
  });
});

describe('createApiClient withCredentials', () => {
  it('passes withCredentials when enabled', async () => {
    const client = createApiClient({
      serviceName: 'test',
      baseURL: BASE,
      withCredentials: true,
      adapter: createMockAdapter((config) => {
        expect(config.withCredentials).toBe(true);
        return mockJsonResponse(config, { data: {} });
      }),
    });

    await client.get('/api/hello/');
  });
});
