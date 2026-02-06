import { API_BASE_URL, STREAM_TIMEOUT_MS } from './config';
import { HttpError, StreamError } from './errors';
import { createSSETransformStream } from './sse-parser';
import type { SSEEvent } from './types';

export async function apiStream(
  path: string,
  timeout = STREAM_TIMEOUT_MS
): Promise<ReadableStream<SSEEvent>> {
  const url = `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const body = await response.text().catch(() => undefined);
    throw new HttpError(response.status, response.statusText, body);
  }

  if (!response.body) {
    throw new StreamError('No response body');
  }

  return response.body.pipeThrough(new TextDecoderStream()).pipeThrough(createSSETransformStream());
}
