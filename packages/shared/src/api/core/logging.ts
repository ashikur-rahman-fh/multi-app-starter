const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-csrftoken',
  'x-csrf-token',
]);

const SENSITIVE_BODY_KEYS = new Set(['password', 'token', 'secret', 'authorization']);

function redactHeaders(
  headers: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!headers) {
    return undefined;
  }
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADER_NAMES.has(key.toLowerCase())) {
      redacted[key] = '[redacted]';
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

function redactBody(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(redactBody);
  }
  const record = data as Record<string, unknown>;
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_BODY_KEYS.has(key.toLowerCase())) {
      redacted[key] = '[redacted]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactBody(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export type SafeApiLogDetail = {
  serviceName?: string;
  url?: string;
  method?: string;
  status?: number;
  code?: string;
  kind?: string;
  headers?: Record<string, unknown>;
  data?: unknown;
};

export function logApiEvent(detail: SafeApiLogDetail): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  console.error('[api]', {
    ...detail,
    headers: redactHeaders(detail.headers),
    data: redactBody(detail.data),
  });
}

export function redactHeadersForDebug(
  headers: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  return redactHeaders(headers);
}
