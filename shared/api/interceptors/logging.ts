import type { ResponseInterceptor, ErrorInterceptor } from '../types';

const isDev = process.env.NODE_ENV === 'development';

export const loggingResponseInterceptor: ResponseInterceptor = (response, context) => {
  if (isDev) {
    const duration = Date.now() - context.startTime;
    const method = (context.config.method ?? 'GET').toUpperCase();
    console.log(`[API] ${method} ${context.path} -> ${response.status} (${duration}ms)`);
  }
  return response;
};

export const loggingErrorInterceptor: ErrorInterceptor = (error, context) => {
  if (isDev) {
    const duration = Date.now() - context.startTime;
    const method = (context.config.method ?? 'GET').toUpperCase();
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] ${method} ${context.path} FAILED (${duration}ms): ${message}`);
  }
  return error;
};
