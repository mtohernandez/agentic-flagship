import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from './server-config';

export interface ProxyHandlerOptions {
  upstream: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  stream?: boolean;
  transformRequest?: (req: NextRequest) => Promise<RequestInit>;
}

export function createProxyHandler(options: ProxyHandlerOptions) {
  return async (req: NextRequest): Promise<NextResponse | Response> => {
    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      return NextResponse.json({ error: 'Backend not configured' }, { status: 500 });
    }

    const url = `${backendUrl}${options.upstream}`;

    let fetchInit: RequestInit = { method: options.method };

    if (options.transformRequest) {
      fetchInit = {
        ...fetchInit,
        ...(await options.transformRequest(req)),
      };
    } else if (options.method !== 'GET') {
      // Forward JSON body by default for non-GET
      try {
        const body = await req.json();
        fetchInit.headers = { 'Content-Type': 'application/json' };
        fetchInit.body = JSON.stringify(body);
      } catch {
        // No body to forward
      }
    }

    let response: Response;
    try {
      response = await fetch(url, fetchInit);
    } catch {
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => 'Unknown error');
      return NextResponse.json({ error: body }, { status: response.status });
    }

    if (options.stream && response.body) {
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  };
}
