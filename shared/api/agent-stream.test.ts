import { streamAgentMission, type AgentStreamCallbacks } from './agent-stream';

describe('streamAgentMission', () => {
  const createMockCallbacks = (): AgentStreamCallbacks & {
    tokens: string[];
    thoughts: string[];
    errors: Error[];
    completeCalls: number;
  } => {
    const tokens: string[] = [];
    const thoughts: string[] = [];
    const errors: Error[] = [];
    let completeCalls = 0;

    return {
      get tokens() {
        return tokens;
      },
      get thoughts() {
        return thoughts;
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
      onThought: vi.fn((content: string) => {
        thoughts.push(content);
      }),
      onComplete: vi.fn(() => {
        completeCalls++;
      }),
      onError: vi.fn((error: Error) => {
        errors.push(error);
      }),
    };
  };

  const createMockResponse = (chunks: string[]) => {
    let chunkIndex = 0;
    return {
      ok: true,
      body: {
        getReader: () => ({
          read: async () => {
            if (chunkIndex < chunks.length) {
              const chunk = chunks[chunkIndex++];
              return { done: false, value: new TextEncoder().encode(chunk) };
            }
            return { done: true, value: undefined };
          },
        }),
      },
    } as unknown as Response;
  };

  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
  });

  it('calls onToken for token events', async () => {
    const callbacks = createMockCallbacks();
    const mockResponse = createMockResponse(['data: {"type":"token","content":"Hello"}\n\n']);
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onToken).toHaveBeenCalledWith('Hello');
    expect(callbacks.tokens).toContain('Hello');
  });

  it('calls onThought for thought events', async () => {
    const callbacks = createMockCallbacks();
    const mockResponse = createMockResponse([
      'data: {"type":"thought","content":"Thinking..."}\n\n',
    ]);
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onThought).toHaveBeenCalledWith('Thinking...');
    expect(callbacks.thoughts).toContain('Thinking...');
  });

  it('calls onComplete when stream ends', async () => {
    const callbacks = createMockCallbacks();
    const mockResponse = createMockResponse(['data: {"type":"token","content":"Done"}\n\n']);
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onComplete).toHaveBeenCalled();
    expect(callbacks.completeCalls).toBe(1);
  });

  it('calls onError for HTTP errors', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onError).toHaveBeenCalled();
    expect(callbacks.errors[0].message).toContain('500');
  });

  it('calls onError when no response body', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      body: null,
    } as Response);

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onError).toHaveBeenCalled();
    expect(callbacks.errors[0].message).toBe('No response body');
  });

  it('calls onError for fetch failures', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onError).toHaveBeenCalled();
    expect(callbacks.errors[0].message).toBe('Network error');
  });

  it('handles multiple chunks correctly', async () => {
    const callbacks = createMockCallbacks();
    const mockResponse = createMockResponse([
      'data: {"type":"token","content":"Hello "}\n\n',
      'data: {"type":"token","content":"world"}\n\n',
    ]);
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.tokens).toEqual(['Hello ', 'world']);
  });

  it('skips malformed JSON', async () => {
    const callbacks = createMockCallbacks();
    const mockResponse = createMockResponse([
      'data: not valid json\n\ndata: {"type":"token","content":"Valid"}\n\n',
    ]);
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.tokens).toEqual(['Valid']);
    expect(callbacks.onError).not.toHaveBeenCalled();
  });

  it('encodes prompt in URL', async () => {
    const callbacks = createMockCallbacks();
    const mockResponse = createMockResponse([]);
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    await streamAgentMission('test with spaces', callbacks);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/run-mission?prompt=test%20with%20spaces'
    );
  });

  // TODO: This test documents current (incorrect) behavior where SSE events split
  // across two read() calls are silently dropped because the parser splits on \n\n
  // within each chunk independently. When buffering is fixed, this test should be
  // updated to expect the token.
  it('drops SSE event split across two read() calls', async () => {
    const callbacks = createMockCallbacks();
    const mockResponse = createMockResponse(['data: {"type":"token","con', 'tent":"Split"}\n\n']);
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.tokens).toEqual([]);
    expect(callbacks.onComplete).toHaveBeenCalled();
  });

  it('silently ignores unknown event types', async () => {
    const callbacks = createMockCallbacks();
    const mockResponse = createMockResponse([
      'data: {"type":"metadata","content":"ignored"}\n\ndata: {"type":"token","content":"kept"}\n\n',
    ]);
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.tokens).toEqual(['kept']);
    expect(callbacks.onError).not.toHaveBeenCalled();
  });

  it('encodes empty string prompt in URL', async () => {
    const callbacks = createMockCallbacks();
    const mockResponse = createMockResponse([]);
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    await streamAgentMission('', callbacks);

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/run-mission?prompt=');
  });
});
