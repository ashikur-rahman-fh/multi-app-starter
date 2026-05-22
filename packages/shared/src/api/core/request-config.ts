import type { AxiosRequestConfig } from 'axios';
import type { ApiClientConfig, ApiRequestConfig } from './types';

export function validateBaseUrl(baseURL: string, serviceName: string): string {
  const trimmed = baseURL?.trim();
  if (!trimmed) {
    throw new Error(`[api:${serviceName}] baseURL is required but was empty.`);
  }
  try {
    new URL(trimmed);
  } catch {
    throw new Error(`[api:${serviceName}] baseURL is not a valid URL: ${trimmed}`);
  }
  return trimmed.replace(/\/$/, '');
}

export function normalizePath(url: string): string {
  return url.startsWith('/') ? url : `/${url}`;
}

export function toAxiosRequestConfig<TBody>(
  clientConfig: ApiClientConfig,
  requestConfig: ApiRequestConfig<TBody> & { url: string; method: string },
): AxiosRequestConfig<TBody> {
  const headers: Record<string, string> = {
    ...clientConfig.defaultHeaders,
    ...requestConfig.headers,
  };

  return {
    method: requestConfig.method,
    url: normalizePath(requestConfig.url),
    params: requestConfig.params,
    data: requestConfig.data,
    headers,
    timeout: requestConfig.timeoutMs ?? clientConfig.timeoutMs,
    withCredentials: requestConfig.withCredentials ?? clientConfig.withCredentials,
  };
}
