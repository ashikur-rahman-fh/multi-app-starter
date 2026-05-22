import { createApiClient } from '../core/create-api-client';
import { env } from '../core/env';

export const backendMainApi = createApiClient({
  serviceName: 'backend-main',
  baseURL: env.backendMainApiUrl,
  timeoutMs: 10_000,
  withCredentials: false,
});
