import { streamAgentMission, type AgentStreamCallbacks } from './stream-agent';

// Mock the client module
vi.mock('./client', () => ({
  apiStream: vi.fn(),
}));

import { apiStream } from './client';

describe('streamAgentMission', () => {
  const createMockCallbacks = (): AgentStreamCallbacks & {
    tokens: string[];
    toolStarts: string[];
    toolEnds: string[];
    errors: Error[];
    completeCalls: number;
  } => {
    const tokens: string[] = [];
    const toolStarts: string[] = [];
    const toolEnds: string[] = [];
    const errors: Error[] = [];
    let completeCalls = 0;

    return {
      get tokens() {
        return tokens;
      },
      get toolStarts() {
        return toolStarts;
      },
      get toolEnds() {
        return toolEnds;
      },
      get errors() {
        return errors;
      },
      get completeCalls() {
        return completeCalls;
      },
      onToken: vi.fn((content: string) => {
        tokens.push(content);
      }),
      onToolStart: vi.fn((toolName: string) => {
        toolStarts.push(toolName);
      }),
      onToolEnd: vi.fn((toolName: string) => {
        toolEnds.push(toolName);
      }),
      onComplete: vi.fn(() => {
        completeCalls++;
      }),
      onError: vi.fn((error: Error) => {
        errors.push(error);
      }),
    };
  };

  const createMockSSEStream = (events: Array<{ data: string }>) => {
    let index = 0;
    return new ReadableStream({
      pull(controller) {
        if (index < events.length) {
          controller.enqueue(events[index++]);
        } else {
          controller.close();
        }
      },
    });
  };

  beforeEach(() => {
    vi.mocked(apiStream).mockReset();
  });

  it('calls onToken for token events', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([{ data: '{"type":"token","content":"Hello"}' }])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onToken).toHaveBeenCalledWith('Hello');
    expect(callbacks.tokens).toContain('Hello');
  });

  it('calls onToolStart for tool_start events', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([{ data: '{"type":"tool_start","content":"fetch_page"}' }])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onToolStart).toHaveBeenCalledWith('fetch_page');
    expect(callbacks.toolStarts).toContain('fetch_page');
  });

  it('calls onToolEnd for tool_end events', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([{ data: '{"type":"tool_end","content":"fetch_page"}' }])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onToolEnd).toHaveBeenCalledWith('fetch_page');
    expect(callbacks.toolEnds).toContain('fetch_page');
  });

  it('calls onComplete for done events', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([{ data: '{"type":"done","content":""}' }])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onComplete).toHaveBeenCalled();
    expect(callbacks.completeCalls).toBe(1);
  });

  it('calls onError for error events', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([{ data: '{"type":"error","content":"Timeout exceeded"}' }])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onError).toHaveBeenCalled();
    expect(callbacks.errors[0].message).toBe('Timeout exceeded');
  });

  it('does not double-call onComplete when done event received', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([
        { data: '{"type":"token","content":"Hello"}' },
        { data: '{"type":"done","content":""}' },
      ])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.completeCalls).toBe(1);
  });

  it('calls onComplete on stream end if no done event received', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([{ data: '{"type":"token","content":"Hello"}' }])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onComplete).toHaveBeenCalled();
    expect(callbacks.completeCalls).toBe(1);
  });

  it('calls onError when apiStream fails', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'));

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onError).toHaveBeenCalled();
    expect(callbacks.errors[0].message).toContain('500');
  });

  it('calls onError for fetch failures', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockRejectedValueOnce(new Error('Network error'));

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onError).toHaveBeenCalled();
    expect(callbacks.errors[0].message).toBe('Network error');
  });

  it('handles multiple events correctly', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([
        { data: '{"type":"tool_start","content":"fetch_page"}' },
        { data: '{"type":"token","content":"Hello "}' },
        { data: '{"type":"token","content":"world"}' },
        { data: '{"type":"tool_end","content":"fetch_page"}' },
        { data: '{"type":"done","content":""}' },
      ])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.tokens).toEqual(['Hello ', 'world']);
    expect(callbacks.toolStarts).toEqual(['fetch_page']);
    expect(callbacks.toolEnds).toEqual(['fetch_page']);
    expect(callbacks.completeCalls).toBe(1);
  });

  it('skips malformed JSON', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([
        { data: 'not valid json' },
        { data: '{"type":"token","content":"Valid"}' },
      ])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.tokens).toEqual(['Valid']);
    expect(callbacks.onError).not.toHaveBeenCalled();
  });

  it('sends GET with prompt as query param', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(createMockSSEStream([]));

    await streamAgentMission('test with spaces', callbacks);

    expect(apiStream).toHaveBeenCalledWith(
      '/agent/run-mission?prompt=' + encodeURIComponent('test with spaces')
    );
  });

  it('silently ignores unknown event types', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([
        { data: '{"type":"metadata","content":"ignored"}' },
        { data: '{"type":"token","content":"kept"}' },
      ])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.tokens).toEqual(['kept']);
    expect(callbacks.onError).not.toHaveBeenCalled();
  });

  it('sends empty string prompt', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(createMockSSEStream([]));

    await streamAgentMission('', callbacks);

    expect(apiStream).toHaveBeenCalledWith('/agent/run-mission?prompt=' + encodeURIComponent(''));
  });
});
