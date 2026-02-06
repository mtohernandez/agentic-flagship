import { apiFetch, apiStream, configureApiClient } from './client';
import { HttpError, NetworkError, TimeoutError } from './errors';
import type { SSEEvent } from './types';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
    configureApiClient({});
  });

  it('returns parsed JSON for successful response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1, name: 'Test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await apiFetch<{ id: number; name: string }>('/test');

    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('throws HttpError for non-ok response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response('Not Found', { status: 404, statusText: 'Not Found' })
    );

    try {
      await apiFetch('/missing');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(404);
    }
  });

  it('throws NetworkError for fetch failures', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(apiFetch('/fail')).rejects.toThrow(NetworkError);
  });

  it('throws TimeoutError when request times out', async () => {
    vi.useFakeTimers();

    vi.mocked(global.fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
          });
        })
    );

    const promise = apiFetch('/slow', { timeout: 100 });

    // Attach rejection handler before advancing timers to avoid unhandled rejection
    const resultPromise = expect(promise).rejects.toThrow(TimeoutError);

    await vi.advanceTimersByTimeAsync(150);

    await resultPromise;
    vi.useRealTimers();
  });

  it('retries on 5xx errors with exponential backoff', async () => {
    vi.useFakeTimers();

    vi.mocked(global.fetch)
      .mockResolvedValueOnce(new Response('Error', { status: 503, statusText: 'Unavailable' }))
      .mockResolvedValueOnce(new Response('Error', { status: 503, statusText: 'Unavailable' }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const promise = apiFetch('/retry', {
      retry: { maxRetries: 2, baseDelayMs: 100 },
    });

    // First retry delay: 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Second retry delay: 200ms
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('does not retry on 4xx errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response('Bad Request', { status: 400, statusText: 'Bad Request' })
    );

    await expect(apiFetch('/bad', { retry: { maxRetries: 2 } })).rejects.toThrow(HttpError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('runs interceptor pipeline in order', async () => {
    const order: string[] = [];

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: 'test' }), { status: 200 })
    );

    configureApiClient({
      requestInterceptors: [
        (path, config) => {
          order.push('global-request');
          return config;
        },
      ],
      responseInterceptors: [
        (response) => {
          order.push('global-response');
          return response;
        },
      ],
    });

    await apiFetch('/intercepted', {
      interceptors: {
        request: [
          (path, config) => {
            order.push('local-request');
            return config;
          },
        ],
        response: [
          (response) => {
            order.push('local-response');
            return response;
          },
        ],
      },
    });

    expect(order).toEqual(['global-request', 'local-request', 'global-response', 'local-response']);
  });

  it('calls validate function when provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ value: 42 }), { status: 200 })
    );

    const validate = vi.fn((data: unknown) => {
      const obj = data as { value: number };
      return { value: obj.value, validated: true };
    });

    const result = await apiFetch('/validate', { validate });

    expect(validate).toHaveBeenCalledWith({ value: 42 });
    expect(result).toEqual({ value: 42, validated: true });
  });

  it('runs error interceptors on failure', async () => {
    const errorSpy = vi.fn();
    vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError('Network failed'));

    configureApiClient({
      errorInterceptors: [errorSpy],
    });

    await expect(apiFetch('/fail')).rejects.toThrow(NetworkError);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.any(NetworkError),
      expect.objectContaining({ path: '/api/fail' })
    );
  });
});

describe('apiStream', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
    configureApiClient({});
  });

  it('returns a ReadableStream of SSEEvents', async () => {
    const sseData =
      'data: {"type":"token","content":"Hello"}\n\ndata: {"type":"token","content":"World"}\n\n';
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseData));
        controller.close();
      },
    });

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );

    const stream = await apiStream('/stream', { method: 'POST' });
    const reader = stream.getReader();
    const events: SSEEvent[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      events.push(value);
    }

    expect(events).toEqual([
      { data: '{"type":"token","content":"Hello"}' },
      { data: '{"type":"token","content":"World"}' },
    ]);
  });

  it('throws HttpError for non-ok stream response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' })
    );

    await expect(apiStream('/stream')).rejects.toThrow(HttpError);
  });

  it('throws StreamError when response has no body', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    // Response with null body — the body property is null
    await expect(apiStream('/stream')).rejects.toThrow('No response body');
  });
});
