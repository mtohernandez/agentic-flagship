import { streamAgentMission, type AgentStreamCallbacks } from './agent-stream';

describe('streamAgentMission', () => {
  const createMockCallbacks = (): AgentStreamCallbacks & {
    tokens: string[];
    thoughts: string[];
    errors: Error[];
    completeCalls: number;
  } => ({
    tokens: [],
    thoughts: [],
    errors: [],
    completeCalls: 0,
    onToken: vi.fn(function (this: { tokens: string[] }, content: string) {
      this.tokens.push(content);
    }),
    onThought: vi.fn(function (this: { thoughts: string[] }, content: string) {
      this.thoughts.push(content);
    }),
    onComplete: vi.fn(function (this: { completeCalls: number }) {
      this.completeCalls++;
    }),
    onError: vi.fn(function (this: { errors: Error[] }, error: Error) {
      this.errors.push(error);
    }),
  });

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
});
