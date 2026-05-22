import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import type { CsrfConfig } from './types';

const DEFAULT_COOKIE_NAME = 'csrftoken';
const DEFAULT_HEADER_NAME = 'X-CSRFToken';

let csrfMissingWarned = false;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function resolveCsrfToken(config: CsrfConfig | undefined): string | null {
  if (!config?.enabled) {
    return null;
  }
  if (config.tokenProvider) {
    const token = config.tokenProvider();
    return token?.trim() ? token : null;
  }
  const cookieName = config.cookieName ?? DEFAULT_COOKIE_NAME;
  return readCookie(cookieName);
}

export function applyCsrfHeader(
  axiosConfig: InternalAxiosRequestConfig,
  csrfConfig: CsrfConfig | undefined,
): InternalAxiosRequestConfig {
  if (!csrfConfig?.enabled) {
    return axiosConfig;
  }

  const token = resolveCsrfToken(csrfConfig);
  if (!token) {
    if (process.env.NODE_ENV !== 'production' && !csrfMissingWarned) {
      csrfMissingWarned = true;
      console.warn(
        '[api] CSRF is enabled but no token was found; request will proceed without CSRF header.',
      );
    }
    return axiosConfig;
  }

  const headerName = csrfConfig.headerName ?? DEFAULT_HEADER_NAME;
  const headers = AxiosHeaders.from(axiosConfig.headers);
  headers.set(headerName, token);
  axiosConfig.headers = headers;
  return axiosConfig;
}

export function resetCsrfWarningForTests(): void {
  csrfMissingWarned = false;
}
