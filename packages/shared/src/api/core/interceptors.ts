import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { applyCsrfHeader } from './csrf';
import { normalizeAxiosError } from './errors';
import { logApiEvent } from './logging';
import type { ApiClientConfig } from './types';

export function registerInterceptors(
  axiosInstance: AxiosInstance,
  clientConfig: ApiClientConfig,
): void {
  axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    let next = config;
    next = applyCsrfHeader(next, clientConfig.csrf);

    if (clientConfig.requestInterceptors) {
      for (const interceptor of clientConfig.requestInterceptors) {
        next = await interceptor(next);
      }
    }

    return next;
  });

  axiosInstance.interceptors.response.use(
    async (response: AxiosResponse) => {
      let next = response;
      if (clientConfig.responseInterceptors) {
        for (const interceptor of clientConfig.responseInterceptors) {
          next = await interceptor(next);
        }
      }
      return next;
    },
    (error: unknown) => {
      const apiError = normalizeAxiosError(error, clientConfig.serviceName);
      logApiEvent({
        serviceName: clientConfig.serviceName,
        url: apiError.debug?.url,
        method: apiError.debug?.method,
        status: apiError.status,
        code: apiError.code,
        kind: apiError.isNetworkError ? 'network' : apiError.isTimeout ? 'timeout' : 'http',
        headers: apiError.debug?.headers,
      });
      return Promise.reject(apiError);
    },
  );
}
