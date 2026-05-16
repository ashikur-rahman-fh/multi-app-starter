import { describe, expect, it } from 'vitest';
import { buildConnectSrc, buildContentSecurityPolicy, CSP_API_PLACEHOLDER } from './headers.mjs';

/** Arbitrary production API URL — tests behavior for any https origin, not a fixed deploy domain. */
const SAMPLE_PRODUCTION_API = 'https://api.example.com';

function originFrom(url) {
  const { protocol, host } = new URL(url);
  return `${protocol}//${host}`;
}

describe('buildConnectSrc', () => {
  it('includes the origin from the configured API base URL in production', () => {
    const expectedOrigin = originFrom(SAMPLE_PRODUCTION_API);
    const directive = buildConnectSrc({
      apiBaseUrl: SAMPLE_PRODUCTION_API,
      isProduction: true,
    });

    expect(directive).toContain("'self'");
    expect(directive).toContain(expectedOrigin);
    expect(directive).not.toContain('localhost:8000');
  });

  it('includes dev API and HMR origins when not production', () => {
    const devApi = 'http://localhost:8000';
    const directive = buildConnectSrc({
      apiBaseUrl: devApi,
      isProduction: false,
    });

    expect(directive).toContain(originFrom(devApi));
    expect(directive).toContain('ws://localhost:3000');
    expect(directive).toContain('ws://localhost:3001');
    expect(directive).toContain('http://localhost:8080');
  });

  it('falls back to self and dev defaults when API URL is missing in development', () => {
    const missing = buildConnectSrc({ apiBaseUrl: '', isProduction: false });
    expect(missing).toContain("connect-src 'self'");
    expect(missing).toContain('http://127.0.0.1:8000');
  });

  it('uses the production placeholder when API URL is missing or invalid in production', () => {
    const placeholderOrigin = originFrom(CSP_API_PLACEHOLDER);

    const missing = buildConnectSrc({ apiBaseUrl: '', isProduction: true });
    expect(missing).toContain(placeholderOrigin);

    const invalid = buildConnectSrc({ apiBaseUrl: 'not-a-url', isProduction: true });
    expect(invalid).toContain("'self'");
    expect(invalid).toContain(placeholderOrigin);
  });
});

describe('buildContentSecurityPolicy', () => {
  it('embeds connect-src with the configured API origin', () => {
    const expectedOrigin = originFrom(SAMPLE_PRODUCTION_API);
    const policy = buildContentSecurityPolicy({
      apiBaseUrl: SAMPLE_PRODUCTION_API,
      isProduction: true,
    });

    expect(policy).toContain('connect-src');
    expect(policy).toContain(expectedOrigin);
    expect(policy).toContain("default-src 'self'");
  });

  it('uses the production placeholder when API URL is missing', () => {
    const policy = buildContentSecurityPolicy({ apiBaseUrl: '', isProduction: true });
    expect(policy).toContain(originFrom(CSP_API_PLACEHOLDER));
  });
});
