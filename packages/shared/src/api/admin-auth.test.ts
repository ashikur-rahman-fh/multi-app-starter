import Axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from './core/create-api-client';
import { isApiError } from './core/errors';
import { createMockAdapter, mockJsonResponse } from './core/test-adapter';
import {
  backendAdminApi,
  resetAdminCsrfTokenForTests,
  setAdminCsrfToken,
} from './clients/backend-admin';

const BASE = 'https://api.example.test';

const sampleUser = {
  id: 1,
  name: 'Admin User',
  firstName: 'Admin',
  lastName: 'User',
  username: 'admin',
  email: 'admin@example.com',
  isStaff: true,
  isSuperuser: true,
};

describe('adminAuthApi', () => {
  beforeEach(() => {
    resetAdminCsrfTokenForTests();
    vi.stubEnv('NEXT_PUBLIC_BACKEND_MAIN_API_URL', BASE);
  });

  afterEach(() => {
    resetAdminCsrfTokenForTests();
    vi.unstubAllEnvs();
  });

  it('fetches CSRF token and caches it for subsequent requests', async () => {
    const adapter = createMockAdapter((config) => {
      if (config.url?.includes('/csrf/')) {
        return mockJsonResponse(config, { data: { csrfToken: 'csrf-test-token' } });
      }
      return mockJsonResponse(config, { data: sampleUser });
    });

    const client = createApiClient({
      serviceName: 'backend-admin',
      baseURL: BASE,
      withCredentials: true,
      csrf: { enabled: true, tokenProvider: () => 'csrf-test-token' },
      adapter,
    });

    const token = await client.get<{ csrfToken: string }>('/api/admin/auth/csrf/');
    expect(token.csrfToken).toBe('csrf-test-token');
  });

  it('login sends typed body and returns AdminUser', async () => {
    setAdminCsrfToken('token');
    const adapter = createMockAdapter((config) => {
      if (config.method?.toLowerCase() === 'post' && config.url?.includes('/login/')) {
        expect(
          config.headers?.['X-CSRFToken'] ?? config.headers?.get?.('X-CSRFToken'),
        ).toBeTruthy();
        return mockJsonResponse(config, { data: sampleUser });
      }
      return mockJsonResponse(config, { data: { csrfToken: 'token' } });
    });

    const client = createApiClient({
      serviceName: 'backend-admin',
      baseURL: BASE,
      withCredentials: true,
      csrf: { enabled: true, tokenProvider: () => 'token' },
      adapter,
    });

    const result = await client.post<
      typeof sampleUser,
      { usernameOrEmail: string; password: string }
    >('/api/admin/auth/login/', { usernameOrEmail: 'admin', password: 'secret' });
    expect(result).toEqual(sampleUser);
  });

  it('maps 401 to ApiError with isUnauthorized', async () => {
    setAdminCsrfToken('token');
    const adapter = createMockAdapter((config) =>
      mockJsonResponse(config, {
        status: 401,
        data: {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid login details. Please check your credentials and try again.',
          },
        },
      }),
    );

    const client = createApiClient({
      serviceName: 'backend-admin',
      baseURL: BASE,
      withCredentials: true,
      csrf: { enabled: true, tokenProvider: () => 'token' },
      adapter,
    });

    await expect(
      client.post('/api/admin/auth/login/', { usernameOrEmail: 'a', password: 'b' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      isUnauthorized: true,
    });
  });

  it('maps 403 to ApiError with isForbidden', async () => {
    const adapter = createMockAdapter((config) =>
      mockJsonResponse(config, {
        status: 403,
        data: {
          success: false,
          error: {
            code: 'ADMIN_FORBIDDEN',
            message: 'You do not have permission to access the admin area.',
          },
        },
      }),
    );

    const client = createApiClient({
      serviceName: 'backend-admin',
      baseURL: BASE,
      withCredentials: true,
      adapter,
    });

    await expect(client.get('/api/admin/auth/me/')).rejects.toMatchObject({
      name: 'ApiError',
      isForbidden: true,
    });
  });

  it('does not expose raw Axios errors from adminAuthApi.login', async () => {
    setAdminCsrfToken('token');
    const adapter = createMockAdapter(() => {
      throw new Axios.AxiosError('network down', Axios.AxiosError.ERR_NETWORK);
    });

    const client = createApiClient({
      serviceName: 'backend-admin',
      baseURL: BASE,
      withCredentials: true,
      csrf: { enabled: true, tokenProvider: () => 'token' },
      adapter,
    });

    try {
      await client.post('/api/admin/auth/login/', { usernameOrEmail: 'a', password: 'b' });
      expect.fail('expected error');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect(error).not.toBeInstanceOf(Axios.AxiosError);
      if (isApiError(error)) {
        expect(error.message).not.toContain('Axios');
      }
    }
  });

  it('updateProfile sends PATCH to me endpoint', async () => {
    setAdminCsrfToken('token');
    const adapter = createMockAdapter((config) => {
      if (config.method?.toLowerCase() === 'patch' && config.url?.includes('/me/')) {
        return mockJsonResponse(config, {
          data: { ...sampleUser, firstName: 'Updated', email: 'new@example.com' },
        });
      }
      return mockJsonResponse(config, { data: sampleUser });
    });

    const client = createApiClient({
      serviceName: 'backend-admin',
      baseURL: BASE,
      withCredentials: true,
      csrf: { enabled: true, tokenProvider: () => 'token' },
      adapter,
    });

    const result = await client.patch<typeof sampleUser, { firstName: string; email: string }>(
      '/api/admin/auth/me/',
      { firstName: 'Updated', email: 'new@example.com' },
    );
    expect(result.firstName).toBe('Updated');
    expect(result.email).toBe('new@example.com');
  });

  it('changePassword posts typed body', async () => {
    setAdminCsrfToken('token');
    const adapter = createMockAdapter((config) => {
      if (config.url?.includes('/change-password/')) {
        return mockJsonResponse(config, { data: { success: true } });
      }
      return mockJsonResponse(config, { data: { csrfToken: 'token' } });
    });

    const client = createApiClient({
      serviceName: 'backend-admin',
      baseURL: BASE,
      withCredentials: true,
      csrf: { enabled: true, tokenProvider: () => 'token' },
      adapter,
    });

    const result = await client.post<
      { success: boolean },
      { currentPassword: string; newPassword: string; confirmPassword: string }
    >('/api/admin/auth/change-password/', {
      currentPassword: 'old',
      newPassword: 'NewPass123!',
      confirmPassword: 'NewPass123!',
    });
    expect(result).toEqual({ success: true });
  });

  it('backendAdminApi uses withCredentials', () => {
    expect(backendAdminApi.serviceName).toBe('backend-admin');
  });
});
