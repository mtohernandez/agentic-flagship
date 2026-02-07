import { renderHook, act } from '@testing-library/react';
import { useRunMission } from './use-run-mission';
import type { AgentMessage } from '@/entities/message';
import * as api from '@/shared/api';

vi.mock('@/shared/api', () => ({
  streamAgentMission: vi.fn(),
}));

describe('useRunMission', () => {
  beforeEach(() => {
    vi.mocked(api.streamAgentMission).mockReset();
  });

  it('initializes with empty messages and not executing', () => {
    const { result } = renderHook(() => useRunMission());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isExecuting).toBe(false);
  });

  it('adds user message when running a mission', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async () => {});

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
    vi.mocked(api.streamAgentMission).mockImplementation(async () => {});

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
    expect(api.streamAgentMission).not.toHaveBeenCalled();
  });

  it('does not run mission while already executing', async () => {
    let resolveStream: () => void;
    vi.mocked(api.streamAgentMission).mockImplementation(
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
    expect(api.streamAgentMission).toHaveBeenCalledTimes(1);

    // Cleanup
    await act(async () => {
      resolveStream!();
    });
  });

  it('updates agent message content on token callback', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
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

  it('adds thought on onToolStart callback', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onToolStart('fetch_page');
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    const agentMessage = result.current.messages.find((m) => m.role === 'agent');
    expect(agentMessage).toBeDefined();
    const agentMsg = agentMessage as AgentMessage;
    expect(agentMsg.thoughts).toHaveLength(1);
    expect(agentMsg.thoughts[0].content).toBe('fetch_page');
    expect(agentMsg.thoughts[0].type).toBe('action');
  });

  it('marks thought as complete on onToolEnd callback', async () => {
    let capturedCallbacks!: api.AgentStreamCallbacks;
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      capturedCallbacks = callbacks;
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    await act(async () => {
      capturedCallbacks.onToolStart('fetch_page');
    });

    let agentMsg = result.current.messages.find((m) => m.role === 'agent') as AgentMessage;
    expect(agentMsg.thoughts[0].status).toBe('executing');

    await act(async () => {
      capturedCallbacks.onToolEnd('fetch_page');
    });

    agentMsg = result.current.messages.find((m) => m.role === 'agent') as AgentMessage;
    expect(agentMsg.thoughts[0].status).toBe('complete');
  });

  it('handles tool start/end lifecycle with multiple tools', async () => {
    let capturedCallbacks!: api.AgentStreamCallbacks;
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      capturedCallbacks = callbacks;
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    // Start first tool
    await act(async () => {
      capturedCallbacks.onToolStart('fetch_page');
    });

    let agentMsg = result.current.messages.find((m) => m.role === 'agent') as AgentMessage;
    expect(agentMsg.thoughts).toHaveLength(1);
    expect(agentMsg.thoughts[0].status).toBe('executing');
    expect(agentMsg.activeThoughtId).toBe(agentMsg.thoughts[0].id);

    // End first tool
    await act(async () => {
      capturedCallbacks.onToolEnd('fetch_page');
    });

    agentMsg = result.current.messages.find((m) => m.role === 'agent') as AgentMessage;
    expect(agentMsg.thoughts[0].status).toBe('complete');
    expect(agentMsg.activeThoughtId).toBeUndefined();

    // Start second tool
    await act(async () => {
      capturedCallbacks.onToolStart('parse_html');
    });

    agentMsg = result.current.messages.find((m) => m.role === 'agent') as AgentMessage;
    expect(agentMsg.thoughts).toHaveLength(2);
    expect(agentMsg.thoughts[1].status).toBe('executing');
    expect(agentMsg.activeThoughtId).toBe(agentMsg.thoughts[1].id);

    // Complete all
    await act(async () => {
      capturedCallbacks.onComplete();
    });

    agentMsg = result.current.messages.find((m) => m.role === 'agent') as AgentMessage;
    expect(agentMsg.thoughts[0].status).toBe('complete');
    expect(agentMsg.thoughts[1].status).toBe('complete');
    expect(agentMsg.activeThoughtId).toBeUndefined();
  });

  it('marks agent message as complete on completion', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    const agentMessage = result.current.messages.find((m) => m.role === 'agent');
    expect(agentMessage).toBeDefined();
    expect(agentMessage!.role).toBe('agent');
    expect((agentMessage as AgentMessage).status).toBe('complete');
  });

  it('sets isExecuting to false on completion', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    expect(result.current.isExecuting).toBe(false);
  });

  it('handles errors correctly and completes executing thoughts', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onToolStart('fetch_page');
      callbacks.onError(new Error('Test error'));
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    const agentMessage = result.current.messages.find((m) => m.role === 'agent');
    expect(agentMessage).toBeDefined();
    expect(agentMessage!.content).toBe('Error: Test error');
    expect(agentMessage!.role).toBe('agent');
    const agentMsg = agentMessage as AgentMessage;
    expect(agentMsg.status).toBe('error');
    expect(agentMsg.thoughts[0].status).toBe('complete');
    expect(agentMsg.activeThoughtId).toBeUndefined();
    expect(result.current.isExecuting).toBe(false);
  });

  it('clears conversation', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
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

  it('marks all thoughts as complete on completion (safety net)', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onToolStart('fetch_page');
      callbacks.onToolStart('parse_html');
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    const agentMessage = result.current.messages.find((m) => m.role === 'agent');
    expect(agentMessage).toBeDefined();
    const agentMsg = agentMessage as AgentMessage;
    expect(agentMsg.thoughts[0].status).toBe('complete');
    expect(agentMsg.thoughts[1].status).toBe('complete');
  });

  it('sets activeThoughtId during onToolStart and clears on complete', async () => {
    let capturedCallbacks!: api.AgentStreamCallbacks;
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      capturedCallbacks = callbacks;
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('Test');
    });

    // Fire a tool start and check activeThoughtId is set
    await act(async () => {
      capturedCallbacks.onToolStart('fetch_page');
    });

    let agentMsg = result.current.messages.find((m) => m.role === 'agent') as AgentMessage;
    expect(agentMsg.activeThoughtId).toBeDefined();
    expect(agentMsg.activeThoughtId).toBe(agentMsg.thoughts[0].id);

    // Complete and verify activeThoughtId is cleared
    await act(async () => {
      capturedCallbacks.onComplete();
    });

    agentMsg = result.current.messages.find((m) => m.role === 'agent') as AgentMessage;
    expect(agentMsg.activeThoughtId).toBeUndefined();
  });

  it('clearConversation then re-run mission produces fresh state', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onToken('Response');
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('First');
    });

    act(() => {
      result.current.clearConversation();
    });

    expect(result.current.messages).toEqual([]);

    await act(async () => {
      result.current.runMission('Second');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('Second');
    expect(result.current.messages[1].content).toBe('Response');
  });

  it('accumulates messages across multiple sequential missions', async () => {
    vi.mocked(api.streamAgentMission).mockImplementation(async (_, callbacks) => {
      callbacks.onComplete();
    });

    const { result } = renderHook(() => useRunMission());

    await act(async () => {
      result.current.runMission('First');
    });

    await act(async () => {
      result.current.runMission('Second');
    });

    // 2 user messages + 2 agent messages = 4
    expect(result.current.messages).toHaveLength(4);
    expect(result.current.messages[0].content).toBe('First');
    expect(result.current.messages[2].content).toBe('Second');
  });
});
