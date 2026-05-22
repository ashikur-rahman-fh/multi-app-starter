import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBackendMainApiUrl } from './env';

describe('getBackendMainApiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns configured URL when set', () => {
    vi.stubEnv('NEXT_PUBLIC_BACKEND_MAIN_API_URL', 'https://api.example.com');
    expect(getBackendMainApiUrl()).toBe('https://api.example.com');
  });

  it('throws in production when unset', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_BACKEND_MAIN_API_URL', '');
    expect(() => getBackendMainApiUrl()).toThrow(/NEXT_PUBLIC_BACKEND_MAIN_API_URL/);
  });

  it('falls back to localhost:8080 in development when unset', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_BACKEND_MAIN_API_URL', '');
    expect(getBackendMainApiUrl()).toBe('http://localhost:8080');
  });
});
