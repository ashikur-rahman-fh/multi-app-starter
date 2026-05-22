import { describe, expect, it, vi } from 'vitest';
import { logApiEvent, redactHeadersForDebug } from './logging';

describe('logging', () => {
  it('redacts sensitive headers', () => {
    const redacted = redactHeadersForDebug({
      Authorization: 'Bearer secret',
      Cookie: 'session=abc',
      'X-CSRFToken': 'token',
      Accept: 'application/json',
    });

    expect(redacted).toEqual({
      Authorization: '[redacted]',
      Cookie: '[redacted]',
      'X-CSRFToken': '[redacted]',
      Accept: 'application/json',
    });
  });

  it('does not log in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logApiEvent({ serviceName: 'test', url: '/x' });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    vi.unstubAllEnvs();
  });
});
