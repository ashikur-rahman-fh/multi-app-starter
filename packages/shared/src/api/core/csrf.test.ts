import Axios, { type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCsrfHeader, resetCsrfWarningForTests, resolveCsrfToken } from './csrf';
import { createApiClient } from './create-api-client';
import { createMockAdapter, mockJsonResponse } from './test-adapter';

describe('resolveCsrfToken', () => {
  afterEach(() => {
    resetCsrfWarningForTests();
    vi.unstubAllGlobals();
  });

  it('returns null when CSRF is disabled by default', () => {
    expect(resolveCsrfToken(undefined)).toBeNull();
    expect(resolveCsrfToken({ enabled: false })).toBeNull();
  });

  it('reads token from a custom token provider', () => {
    expect(
      resolveCsrfToken({
        enabled: true,
        tokenProvider: () => 'abc123',
      }),
    ).toBe('abc123');
  });

  it('reads token from document cookie with configurable name', () => {
    vi.stubGlobal('document', {
      cookie: 'csrftoken=from-cookie; other=x',
    });
    expect(
      resolveCsrfToken({
        enabled: true,
        cookieName: 'csrftoken',
      }),
    ).toBe('from-cookie');
  });
});

describe('applyCsrfHeader', () => {
  afterEach(() => {
    resetCsrfWarningForTests();
  });

  it('does not add header when CSRF is disabled', () => {
    const base = {
      headers: new Axios.AxiosHeaders(),
      method: 'GET',
      url: '/test',
    } as InternalAxiosRequestConfig;

    const result = applyCsrfHeader(base, { enabled: false });
    expect(result.headers.get('X-CSRFToken')).toBeUndefined();
  });

  it('adds header when enabled and token exists', () => {
    const base = {
      headers: new Axios.AxiosHeaders(),
      method: 'POST',
      url: '/test',
    } as InternalAxiosRequestConfig;

    const result = applyCsrfHeader(base, {
      enabled: true,
      tokenProvider: () => 'token-value',
      headerName: 'X-Custom-CSRF',
    });
    expect(result.headers.get('X-Custom-CSRF')).toBe('token-value');
  });
});

describe('createApiClient CSRF integration', () => {
  it('does not send CSRF header when disabled', async () => {
    let capturedHeader: string | undefined;
    const client = createApiClient({
      serviceName: 'test',
      baseURL: 'https://api.example.test',
      adapter: createMockAdapter((config) => {
        capturedHeader = config.headers.get('X-CSRFToken') as string | undefined;
        return mockJsonResponse(config, { data: {} });
      }),
    });

    await client.post('/api/hello/', {});
    expect(capturedHeader).toBeUndefined();
  });

  it('sends CSRF header when enabled and token exists', async () => {
    let capturedHeader: string | undefined;
    const client = createApiClient({
      serviceName: 'test',
      baseURL: 'https://api.example.test',
      csrf: {
        enabled: true,
        tokenProvider: () => 'csrf-token',
        headerName: 'X-CSRFToken',
      },
      adapter: createMockAdapter((config) => {
        capturedHeader = config.headers.get('X-CSRFToken') as string | undefined;
        return mockJsonResponse(config, { data: {} });
      }),
    });

    await client.post('/api/hello/', {});
    expect(capturedHeader).toBe('csrf-token');
  });
});
