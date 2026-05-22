import { createApiClient } from '../core/create-api-client';
import { env } from '../core/env';

let cachedCsrfToken: string | null = null;

export function setAdminCsrfToken(token: string | null): void {
  cachedCsrfToken = token;
}

export function getAdminCsrfToken(): string | null {
  return cachedCsrfToken;
}

export function resetAdminCsrfTokenForTests(): void {
  cachedCsrfToken = null;
}

export const backendAdminApi = createApiClient({
  serviceName: 'backend-admin',
  baseURL: env.backendMainApiUrl,
  timeoutMs: 10_000,
  withCredentials: true,
  csrf: {
    enabled: true,
    tokenProvider: () => cachedCsrfToken,
  },
});
