import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export type MockAdapterHandler = (
  config: InternalAxiosRequestConfig,
) => AxiosResponse | Promise<AxiosResponse>;

export function createMockAdapter(handler: MockAdapterHandler): AxiosAdapter {
  return (config) => {
    const result = handler(config);
    return Promise.resolve(result);
  };
}

export function mockJsonResponse(
  config: InternalAxiosRequestConfig,
  options: {
    status?: number;
    data?: unknown;
    headers?: Record<string, string>;
  },
): AxiosResponse {
  const status = options.status ?? 200;
  return {
    data: options.data ?? {},
    status,
    statusText: status >= 400 ? 'Error' : 'OK',
    headers: options.headers ?? { 'content-type': 'application/json' },
    config,
  };
}
