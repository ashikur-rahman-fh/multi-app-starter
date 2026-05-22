import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { ApiError, normalizeAxiosError } from './errors';
import { unwrapResponseData } from './response';
import { registerInterceptors } from './interceptors';
import { toAxiosRequestConfig, validateBaseUrl } from './request-config';
import type { ApiClient, ApiClientConfig, ApiRequestConfig, HttpMethod } from './types';

function assertSuccessResponse(
  response: AxiosResponse<unknown>,
  clientConfig: ApiClientConfig,
): void {
  if (response.status >= 200 && response.status < 300) {
    return;
  }
  const error = new AxiosError(
    'Request failed with status code ' + response.status,
    AxiosError.ERR_BAD_RESPONSE,
    response.config,
    response.request,
    response,
  );
  throw normalizeAxiosError(error, clientConfig.serviceName);
}

async function executeRequest<TResponse, TBody>(
  instance: AxiosInstance,
  clientConfig: ApiClientConfig,
  requestConfig: ApiRequestConfig<TBody> & { url: string; method: HttpMethod },
): Promise<TResponse> {
  const axiosConfig = toAxiosRequestConfig(clientConfig, {
    ...requestConfig,
    method: requestConfig.method,
    url: requestConfig.url,
  });
  try {
    const response = await instance.request<unknown>(axiosConfig);
    assertSuccessResponse(response, clientConfig);
    return unwrapResponseData<TResponse>(response.data, clientConfig.unwrapEnvelope ?? false);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw normalizeAxiosError(error, clientConfig.serviceName);
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const baseURL = validateBaseUrl(config.baseURL, config.serviceName);
  const timeoutMs = config.timeoutMs ?? 10_000;

  const instance = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: config.defaultHeaders,
    withCredentials: config.withCredentials ?? false,
    adapter: config.adapter,
  });

  registerInterceptors(instance, { ...config, timeoutMs });

  const client: ApiClient = {
    serviceName: config.serviceName,

    async get<TResponse>(
      url: string,
      requestConfig?: Omit<ApiRequestConfig, 'method' | 'url' | 'data'>,
    ) {
      return executeRequest<TResponse, never>(
        instance,
        { ...config, timeoutMs },
        {
          method: 'GET',
          url,
          ...requestConfig,
        },
      );
    },

    async post<TResponse, TBody = unknown>(
      url: string,
      body?: TBody,
      requestConfig?: Omit<ApiRequestConfig<TBody>, 'method' | 'url' | 'data'>,
    ) {
      return executeRequest<TResponse, TBody>(
        instance,
        { ...config, timeoutMs },
        {
          method: 'POST',
          url,
          data: body,
          ...requestConfig,
        },
      );
    },

    async put<TResponse, TBody = unknown>(
      url: string,
      body?: TBody,
      requestConfig?: Omit<ApiRequestConfig<TBody>, 'method' | 'url' | 'data'>,
    ) {
      return executeRequest<TResponse, TBody>(
        instance,
        { ...config, timeoutMs },
        {
          method: 'PUT',
          url,
          data: body,
          ...requestConfig,
        },
      );
    },

    async patch<TResponse, TBody = unknown>(
      url: string,
      body?: TBody,
      requestConfig?: Omit<ApiRequestConfig<TBody>, 'method' | 'url' | 'data'>,
    ) {
      return executeRequest<TResponse, TBody>(
        instance,
        { ...config, timeoutMs },
        {
          method: 'PATCH',
          url,
          data: body,
          ...requestConfig,
        },
      );
    },

    async delete<TResponse>(
      url: string,
      requestConfig?: Omit<ApiRequestConfig, 'method' | 'url' | 'data'>,
    ) {
      return executeRequest<TResponse, never>(
        instance,
        { ...config, timeoutMs },
        {
          method: 'DELETE',
          url,
          ...requestConfig,
        },
      );
    },

    async request<TResponse, TBody = unknown>(
      requestConfig: ApiRequestConfig<TBody> & { url: string; method: HttpMethod },
    ) {
      return executeRequest<TResponse, TBody>(instance, { ...config, timeoutMs }, requestConfig);
    },
  };

  return client;
}
