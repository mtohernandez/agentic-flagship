import { streamAgentMission, type AgentStreamCallbacks } from './agent';

// Mock the client module
vi.mock('../client', () => ({
  apiStream: vi.fn(),
}));

import { apiStream } from '../client';

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

  it('calls onThought for thought events', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([{ data: '{"type":"thought","content":"Thinking..."}' }])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.onThought).toHaveBeenCalledWith('Thinking...');
    expect(callbacks.thoughts).toContain('Thinking...');
  });

  it('calls onComplete when stream ends', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(
      createMockSSEStream([{ data: '{"type":"token","content":"Done"}' }])
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
        { data: '{"type":"token","content":"Hello "}' },
        { data: '{"type":"token","content":"world"}' },
      ])
    );

    await streamAgentMission('test prompt', callbacks);

    expect(callbacks.tokens).toEqual(['Hello ', 'world']);
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

  it('sends POST with prompt in JSON body', async () => {
    const callbacks = createMockCallbacks();
    vi.mocked(apiStream).mockResolvedValueOnce(createMockSSEStream([]));

    await streamAgentMission('test with spaces', callbacks);

    expect(apiStream).toHaveBeenCalledWith('/agent/run-mission', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test with spaces' }),
    });
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

    expect(apiStream).toHaveBeenCalledWith('/agent/run-mission', {
      method: 'POST',
      body: JSON.stringify({ prompt: '' }),
    });
  });
});
