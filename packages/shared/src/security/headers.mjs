/** Placeholder when NEXT_PUBLIC_BACKEND_MAIN_API_URL is unset (e.g. next lint). Real prod builds validate via validate-backend-main-api-url.sh */
export const CSP_API_PLACEHOLDER = 'https://api.example.test';

const DEV_CONNECT_ORIGINS = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'ws://localhost:3000',
  'ws://127.0.0.1:3000',
  'ws://localhost:3001',
  'ws://127.0.0.1:3001',
];

/**
 * Build connect-src directive for CSP (exported for tests).
 * @param {{ apiBaseUrl?: string, isProduction?: boolean }} [options]
 */
export function buildConnectSrc(options = {}) {
  const production = options.isProduction ?? process.env.NODE_ENV === 'production';
  let apiBaseUrl = options.apiBaseUrl ?? process.env.NEXT_PUBLIC_BACKEND_MAIN_API_URL;

  if (production && !apiBaseUrl?.trim()) {
    apiBaseUrl = CSP_API_PLACEHOLDER;
  }

  const origins = new Set(["'self'"]);

  if (apiBaseUrl?.trim()) {
    try {
      const parsed = new URL(apiBaseUrl.trim());
      origins.add(`${parsed.protocol}//${parsed.host}`);
    } catch {
      if (production) {
        const parsed = new URL(CSP_API_PLACEHOLDER);
        origins.add(`${parsed.protocol}//${parsed.host}`);
      }
    }
  }

  if (!production) {
    for (const origin of DEV_CONNECT_ORIGINS) {
      origins.add(origin);
    }
  }

  return `connect-src ${[...origins].join(' ')}`;
}

/**
 * Build full Content-Security-Policy header value (exported for tests).
 * @param {{ apiBaseUrl?: string, isProduction?: boolean }} [options]
 */
export function buildContentSecurityPolicy(options = {}) {
  const production = options.isProduction ?? process.env.NODE_ENV === 'production';

  const scriptSrc = production
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    buildConnectSrc(options),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/** @type {import('next').Headers} */
export function securityHeaders() {
  const contentSecurityPolicy = buildContentSecurityPolicy();

  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      ],
    },
  ];
}
