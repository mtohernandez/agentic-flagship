import { renderHook, act } from '@testing-library/react';
import { useRunMission } from './use-run-mission';
import * as agentStream from '@/shared/api/agent-stream';

vi.mock('@/shared/api/agent-stream', () => ({
  streamAgentMission: vi.fn(),
}));

describe('useRunMission', () => {
  beforeEach(() => {
    vi.mocked(agentStream.streamAgentMission).mockReset();
  });

  it('initializes with empty messages and not executing', () => {
    const { result } = renderHook(() => useRunMission());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isExecuting).toBe(false);
  });

  it('adds user message when running a mission', async () => {
    vi.mocked(agentStream.streamAgentMission).mockImplementation(async () => {});

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test prompt');
    });

    expect(result.current.messages[0]).toMatchObject({
      role: 'user',
      content: 'Test prompt',
    });
  });

  it('adds agent message placeholder when running a mission', async () => {
    vi.mocked(agentStream.streamAgentMission).mockImplementation(async () => {});

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test prompt');
    });

    expect(result.current.messages[1]).toMatchObject({
      role: 'agent',
      content: '',
      status: 'streaming',
    });
  });

  it('does not run mission with empty prompt', async () => {
    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('   ');
    });

    expect(result.current.messages).toEqual([]);
    expect(agentStream.streamAgentMission).not.toHaveBeenCalled();
  });

  it('does not run mission while already executing', async () => {
    let resolveStream: () => void;
    vi.mocked(agentStream.streamAgentMission).mockImplementation(
      () => new Promise((resolve) => (resolveStream = resolve))
    );

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('First prompt');
    });

    expect(result.current.isExecuting).toBe(true);

    await act(async () => {
      result.current.runMission('Second prompt');
    });

    // Only 2 messages (1 user + 1 agent from first call)
    expect(result.current.messages).toHaveLength(2);
    expect(agentStream.streamAgentMission).toHaveBeenCalledTimes(1);

    // Cleanup
    await act(async () => {
      resolveStream!();
    });
  });

  it('updates agent message content on token callback', async () => {
    vi.mocked(agentStream.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onToken('Hello');
      callbacks.onToken(' World');
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    const agentMessage = result.current.messages.find((m) => m.role === 'agent');
    expect(agentMessage?.content).toBe('Hello World');
  });

  it('adds thoughts on thought callback', async () => {
    vi.mocked(agentStream.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onThought('Thinking step 1');
      callbacks.onThought('Thinking step 2');
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    const agentMessage = result.current.messages.find((m) => m.role === 'agent');
    expect(agentMessage?.role).toBe('agent');
    if (agentMessage?.role === 'agent') {
      expect(agentMessage.thoughts).toHaveLength(2);
      expect(agentMessage.thoughts[0].content).toBe('Thinking step 1');
      expect(agentMessage.thoughts[1].content).toBe('Thinking step 2');
    }
  });

  it('marks agent message as complete on completion', async () => {
    vi.mocked(agentStream.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    const agentMessage = result.current.messages.find((m) => m.role === 'agent');
    expect(agentMessage?.role).toBe('agent');
    if (agentMessage?.role === 'agent') {
      expect(agentMessage.status).toBe('complete');
    }
  });

  it('sets isExecuting to false on completion', async () => {
    vi.mocked(agentStream.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    expect(result.current.isExecuting).toBe(false);
  });

  it('handles errors correctly', async () => {
    vi.mocked(agentStream.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onError(new Error('Test error'));
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    const agentMessage = result.current.messages.find((m) => m.role === 'agent');
    expect(agentMessage?.content).toBe('Error: Test error');
    if (agentMessage?.role === 'agent') {
      expect(agentMessage.status).toBe('error');
    }
    expect(result.current.isExecuting).toBe(false);
  });

  it('clears conversation', async () => {
    vi.mocked(agentStream.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    expect(result.current.messages.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearConversation();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('marks previous thoughts as complete when new thought arrives', async () => {
    vi.mocked(agentStream.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onThought('First thought');
      callbacks.onThought('Second thought');
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    const agentMessage = result.current.messages.find((m) => m.role === 'agent');
    if (agentMessage?.role === 'agent') {
      expect(agentMessage.thoughts[0].status).toBe('complete');
      expect(agentMessage.thoughts[1].status).toBe('complete');
    }
  });
});
