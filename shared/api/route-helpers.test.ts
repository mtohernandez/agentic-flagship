import { NextRequest } from 'next/server';
import { createProxyHandler } from './route-helpers';

// Mock server-config
vi.mock('./server-config', () => ({
  getBackendUrl: vi.fn(() => 'http://localhost:8000'),
  getAgentApiKey: vi.fn(() => 'test-api-key'),
}));

// Import the mocked module
import { getBackendUrl, getAgentApiKey } from './server-config';

describe('createProxyHandler', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
    vi.mocked(getBackendUrl).mockReturnValue('http://localhost:8000');
    vi.mocked(getAgentApiKey).mockReturnValue('test-api-key');
  });

  it('proxies GET request with query params to upstream and streams response', async () => {
    const sseBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"token"}\n\n'));
        controller.close();
      },
    });

    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(sseBody, { status: 200 }));

    const handler = createProxyHandler({
      upstream: '/run-mission',
      method: 'GET',
      stream: true,
    });

    const req = new NextRequest('http://localhost:3000/api/agent/run-mission?prompt=test', {
      method: 'GET',
    });
    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/run-mission?prompt=test',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('includes X-API-Key header in all proxied requests', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const handler = createProxyHandler({
      upstream: '/health',
      method: 'GET',
    });

    const req = new NextRequest('http://localhost:3000/api/health', { method: 'GET' });
    await handler(req);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const headers = fetchCall[1]?.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe('test-api-key');
  });

  it('includes X-API-Key header in POST requests', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const handler = createProxyHandler({
      upstream: '/submit',
      method: 'POST',
    });

    const req = new NextRequest('http://localhost:3000/api/submit', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    await handler(req);

    const fetchCall = vi.mocked(global.fetch).mock.calls[0];
    const headers = fetchCall[1]?.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe('test-api-key');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('forwards query params for GET requests', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const handler = createProxyHandler({
      upstream: '/search',
      method: 'GET',
    });

    const req = new NextRequest('http://localhost:3000/api/search?q=hello&page=1', {
      method: 'GET',
    });
    const response = await handler(req);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/search?q=hello&page=1',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns 502 when backend is unreachable', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const handler = createProxyHandler({
      upstream: '/run-mission',
      method: 'GET',
      stream: true,
    });

    const req = new NextRequest('http://localhost:3000/api/agent/run-mission?prompt=test', {
      method: 'GET',
    });
    const response = await handler(req);

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe('Backend unavailable');
  });

  it('forwards backend error status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' })
    );

    const handler = createProxyHandler({
      upstream: '/run-mission',
      method: 'GET',
    });

    const req = new NextRequest('http://localhost:3000/api/agent/run-mission?prompt=test', {
      method: 'GET',
    });
    const response = await handler(req);

    expect(response.status).toBe(500);
  });

  it('returns 500 when backend URL is not configured', async () => {
    vi.mocked(getBackendUrl).mockImplementation(() => {
      throw new Error('BACKEND_URL not set');
    });

    const handler = createProxyHandler({
      upstream: '/run-mission',
      method: 'GET',
    });

    const req = new NextRequest('http://localhost:3000/api/agent/run-mission?prompt=test', {
      method: 'GET',
    });
    const response = await handler(req);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Backend not configured');
  });

  it('returns 500 when API key is not configured', async () => {
    vi.mocked(getAgentApiKey).mockImplementation(() => {
      throw new Error('AGENT_API_KEY not set');
    });

    const handler = createProxyHandler({
      upstream: '/run-mission',
      method: 'GET',
    });

    const req = new NextRequest('http://localhost:3000/api/agent/run-mission?prompt=test', {
      method: 'GET',
    });
    const response = await handler(req);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Backend not configured');
  });

  it('returns JSON for non-stream responses', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const handler = createProxyHandler({
      upstream: '/health',
      method: 'GET',
    });

    const req = new NextRequest('http://localhost:3000/api/health', { method: 'GET' });
    const response = await handler(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('forwards POST body for non-GET requests', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const handler = createProxyHandler({
      upstream: '/submit',
      method: 'POST',
    });

    const req = new NextRequest('http://localhost:3000/api/submit', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    await handler(req);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      })
    );
  });
});
