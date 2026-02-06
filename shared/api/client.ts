import { API_BASE_URL, DEFAULT_TIMEOUT_MS, STREAM_TIMEOUT_MS } from './config';
import { NetworkError, TimeoutError, HttpError, StreamError } from './errors';
import { createSSETransformStream } from './sse-parser';
import type {
  ApiRequestConfig,
  ApiClientConfig,
  RequestContext,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  SSEEvent,
} from './types';

let globalConfig: ApiClientConfig = {};

export function configureApiClient(config: ApiClientConfig): void {
  globalConfig = config;
}

export async function apiFetch<T>(path: string, config: ApiRequestConfig = {}): Promise<T> {
  const timeoutMs = config.timeout ?? DEFAULT_TIMEOUT_MS;
  const url = `${API_BASE_URL}${path}`;

  const context: RequestContext = {
    path: url,
    config,
    startTime: Date.now(),
  };

  try {
    const processedConfig = await runRequestInterceptors(url, config);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchConfig: RequestInit = {
      ...processedConfig,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...processedConfig.headers,
      },
    };

    let response: Response;
    try {
      response = await fetchWithRetry(url, fetchConfig, config);
    } catch (error) {
      clearTimeout(timeoutId);
      throw mapFetchError(error, timeoutMs);
    }

    clearTimeout(timeoutId);

    response = await runResponseInterceptors(response, context);

    if (!response.ok) {
      const body = await response.text().catch(() => undefined);
      throw new HttpError(response.status, response.statusText, body);
    }

    const data = await response.json();
    if (config.validate) {
      return config.validate(data) as T;
    }
    return data as T;
  } catch (error) {
    await runErrorInterceptors(error, context);
    throw error;
  }
}

export function apiStream(
  path: string,
  config: ApiRequestConfig = {}
): Promise<ReadableStream<SSEEvent>> {
  const timeoutMs = config.timeout ?? STREAM_TIMEOUT_MS;
  const url = `${API_BASE_URL}${path}`;

  const context: RequestContext = {
    path: url,
    config,
    startTime: Date.now(),
  };

  return (async () => {
    try {
      const processedConfig = await runRequestInterceptors(url, config);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const fetchConfig: RequestInit = {
        ...processedConfig,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...processedConfig.headers,
        },
      };

      let response: Response;
      try {
        response = await fetch(url, fetchConfig);
      } catch (error) {
        clearTimeout(timeoutId);
        throw mapFetchError(error, timeoutMs);
      }

      clearTimeout(timeoutId);

      response = await runResponseInterceptors(response, context);

      if (!response.ok) {
        const body = await response.text().catch(() => undefined);
        throw new HttpError(response.status, response.statusText, body);
      }

      if (!response.body) {
        throw new StreamError('No response body');
      }

      return response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(createSSETransformStream());
    } catch (error) {
      await runErrorInterceptors(error, context);
      throw error;
    }
  })();
}

async function fetchWithRetry(
  url: string,
  fetchConfig: RequestInit,
  apiConfig: ApiRequestConfig
): Promise<Response> {
  const maxRetries = apiConfig.retry?.maxRetries ?? 0;
  const baseDelay = apiConfig.retry?.baseDelayMs ?? 1000;
  const maxDelay = apiConfig.retry?.maxDelayMs ?? 30_000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchConfig);

      if (response.ok || attempt === maxRetries) {
        return response;
      }

      // Only retry on 5xx or 429
      if (response.status >= 500 || response.status === 429) {
        lastError = new HttpError(response.status, response.statusText);
      } else {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) throw error;
    }

    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw lastError;
}

function mapFetchError(error: unknown, timeoutMs: number): Error {
  if (error instanceof Error && error.name === 'AbortError') {
    return new TimeoutError(timeoutMs);
  }
  if (error instanceof Error) {
    return new NetworkError(error.message);
  }
  return new NetworkError();
}

async function runRequestInterceptors(
  path: string,
  config: ApiRequestConfig
): Promise<ApiRequestConfig> {
  const interceptors: RequestInterceptor[] = [
    ...(globalConfig.requestInterceptors ?? []),
    ...(config.interceptors?.request ?? []),
  ];

  let result = config;
  for (const interceptor of interceptors) {
    result = await interceptor(path, result);
  }
  return result;
}

async function runResponseInterceptors(
  response: Response,
  context: RequestContext
): Promise<Response> {
  const interceptors: ResponseInterceptor[] = [
    ...(globalConfig.responseInterceptors ?? []),
    ...(context.config.interceptors?.response ?? []),
  ];

  let result = response;
  for (const interceptor of interceptors) {
    result = await interceptor(result, context);
  }
  return result;
}

async function runErrorInterceptors(error: unknown, context: RequestContext): Promise<void> {
  const interceptors: ErrorInterceptor[] = [
    ...(globalConfig.errorInterceptors ?? []),
    ...(context.config.interceptors?.error ?? []),
  ];

  for (const interceptor of interceptors) {
    await interceptor(error, context);
  }
}
