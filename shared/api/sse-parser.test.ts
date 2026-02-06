import { createSSETransformStream } from './sse-parser';
import type { SSEEvent } from './types';

async function collectEvents(chunks: string[]): Promise<SSEEvent[]> {
  const transform = createSSETransformStream();
  const writer = transform.writable.getWriter();
  const reader = transform.readable.getReader();

  const events: SSEEvent[] = [];

  const readAll = (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      events.push(value);
    }
  })();

  for (const chunk of chunks) {
    await writer.write(chunk);
  }
  await writer.close();
  await readAll;

  return events;
}

describe('createSSETransformStream', () => {
  it('parses a single event in one chunk', async () => {
    const events = await collectEvents(['data: {"type":"token","content":"Hello"}\n\n']);

    expect(events).toEqual([{ data: '{"type":"token","content":"Hello"}' }]);
  });

  it('parses multiple events in one chunk', async () => {
    const events = await collectEvents([
      'data: {"type":"token","content":"A"}\n\ndata: {"type":"token","content":"B"}\n\n',
    ]);

    expect(events).toEqual([
      { data: '{"type":"token","content":"A"}' },
      { data: '{"type":"token","content":"B"}' },
    ]);
  });

  it('handles event split across two chunks', async () => {
    const events = await collectEvents(['data: {"type":"token","con', 'tent":"Split"}\n\n']);

    expect(events).toEqual([{ data: '{"type":"token","content":"Split"}' }]);
  });

  it('handles event split across three chunks', async () => {
    const events = await collectEvents(['data: {"type":', '"token","content":', '"Three"}\n\n']);

    expect(events).toEqual([{ data: '{"type":"token","content":"Three"}' }]);
  });

  it('ignores comment lines', async () => {
    const events = await collectEvents([
      ': this is a comment\ndata: {"type":"token","content":"kept"}\n\n',
    ]);

    expect(events).toEqual([{ data: '{"type":"token","content":"kept"}' }]);
  });

  it('parses event and id fields', async () => {
    const events = await collectEvents(['event: message\nid: 42\ndata: hello\n\n']);

    expect(events).toEqual([{ event: 'message', id: '42', data: 'hello' }]);
  });

  it('handles multi-line data fields', async () => {
    const events = await collectEvents(['data: line1\ndata: line2\n\n']);

    expect(events).toEqual([{ data: 'line1\nline2' }]);
  });

  it('flushes remaining buffer on close', async () => {
    const events = await collectEvents(['data: final']);

    expect(events).toEqual([{ data: 'final' }]);
  });

  it('skips blocks with no data field', async () => {
    const events = await collectEvents(['event: ping\n\ndata: real\n\n']);

    expect(events).toEqual([{ data: 'real' }]);
  });

  it('handles empty chunks between events', async () => {
    const events = await collectEvents(['data: first\n\n', '', 'data: second\n\n']);

    expect(events).toEqual([{ data: 'first' }, { data: 'second' }]);
  });
});
