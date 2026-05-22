import type {
  AxiosAdapter,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type CsrfConfig = {
  enabled: boolean;
  cookieName?: string;
  headerName?: string;
  tokenProvider?: () => string | null | undefined;
};

/**
 * Retry is disabled by default. When implemented, only safe/idempotent methods
 * (GET) should retry unless explicitly configured; never retry 401/403/422.
 */
export type RetryConfig = {
  enabled: false;
};

export type ApiClientConfig = {
  serviceName: string;
  baseURL: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
  withCredentials?: boolean;
  csrf?: CsrfConfig;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
  /** Test-only: inject a custom Axios adapter for deterministic unit tests. */
  adapter?: AxiosAdapter;
  unwrapEnvelope?: boolean;
  retry?: RetryConfig;
};

export type ApiRequestConfig<TBody = unknown> = {
  method?: HttpMethod;
  url?: string;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  data?: TBody;
  timeoutMs?: number;
  withCredentials?: boolean;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
  headers: Record<string, string>;
};

export type RequestInterceptor = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

export type ResponseInterceptor = (
  response: AxiosResponse,
) => AxiosResponse | Promise<AxiosResponse>;

export type ApiClient = {
  readonly serviceName: string;
  get<TResponse>(
    url: string,
    config?: Omit<ApiRequestConfig, 'method' | 'url' | 'data'>,
  ): Promise<TResponse>;
  post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: Omit<ApiRequestConfig<TBody>, 'method' | 'url' | 'data'>,
  ): Promise<TResponse>;
  put<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: Omit<ApiRequestConfig<TBody>, 'method' | 'url' | 'data'>,
  ): Promise<TResponse>;
  patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: Omit<ApiRequestConfig<TBody>, 'method' | 'url' | 'data'>,
  ): Promise<TResponse>;
  delete<TResponse>(
    url: string,
    config?: Omit<ApiRequestConfig, 'method' | 'url' | 'data'>,
  ): Promise<TResponse>;
  request<TResponse, TBody = unknown>(
    config: ApiRequestConfig<TBody> & { url: string; method: HttpMethod },
  ): Promise<TResponse>;
};

export type { AxiosAdapter, AxiosRequestConfig, InternalAxiosRequestConfig };
