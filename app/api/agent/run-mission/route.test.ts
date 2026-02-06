import { NextRequest } from 'next/server';
import { POST } from './route';

vi.mock('@/shared/api/server-config', () => ({
  getBackendUrl: vi.fn(() => 'http://localhost:8000'),
}));

describe('POST /api/agent/run-mission', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
  });

  it('proxies prompt to backend and returns SSE stream', async () => {
    const sseBody = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"type":"token","content":"Hello"}\n\n')
        );
        controller.close();
      },
    });

    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(sseBody, { status: 200 }));

    const req = new NextRequest('http://localhost:3000/api/agent/run-mission', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test prompt' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/run-mission',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ prompt: 'test prompt' }),
      })
    );
  });

  it('returns 502 when backend is down', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const req = new NextRequest('http://localhost:3000/api/agent/run-mission', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(502);
  });
});
