import { apiStream } from './client';
import { HttpError } from './errors';
import type { SSEEvent } from './types';

describe('apiStream', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
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

    const stream = await apiStream('/stream');
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

  it('makes a GET request by default', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {}\n\n'));
        controller.close();
      },
    });

    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(body, { status: 200 }));

    await apiStream('/stream');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/stream',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('throws HttpError for non-ok stream response', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' })
    );

    await expect(apiStream('/stream')).rejects.toThrow(HttpError);
  });

  it('throws StreamError when response has no body', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));

    await expect(apiStream('/stream')).rejects.toThrow('No response body');
  });
});
