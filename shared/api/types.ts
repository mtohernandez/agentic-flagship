export interface SSEEvent {
  event?: string;
  data: string;
  id?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  retry?: RetryConfig;
  validate?: (data: unknown) => unknown;
  interceptors?: {
    request?: RequestInterceptor[];
    response?: ResponseInterceptor[];
    error?: ErrorInterceptor[];
  };
}

export interface RequestContext {
  path: string;
  config: ApiRequestConfig;
  startTime: number;
}

export type RequestInterceptor = (
  path: string,
  config: ApiRequestConfig
) => ApiRequestConfig | Promise<ApiRequestConfig>;

export type ResponseInterceptor = (
  response: Response,
  context: RequestContext
) => Response | Promise<Response>;

export type ErrorInterceptor = (
  error: unknown,
  context: RequestContext
) => unknown | Promise<unknown>;

export interface ApiClientConfig {
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
  errorInterceptors?: ErrorInterceptor[];
}
