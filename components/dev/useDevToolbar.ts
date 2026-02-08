'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createUserMessage, createAgentMessage } from '@/entities/message';
import { createThought } from '@/entities/agent';
import type { Message, AgentMessage } from '@/shared/types';
import {
  MOCK_USER_MESSAGE,
  MOCK_AGENT_PENDING,
  MOCK_AGENT_STREAMING,
  MOCK_AGENT_STREAMING_WITH_THOUGHTS,
  MOCK_AGENT_COMPLETE,
  MOCK_AGENT_COMPLETE_WITH_THOUGHTS,
  MOCK_AGENT_ERROR,
  MOCK_FULL_CONVERSATION,
} from '@/shared/mocks/messages';

const SCENARIOS: Record<string, Message[]> = {
  empty: [],
  full: [...MOCK_FULL_CONVERSATION],
  user: [MOCK_USER_MESSAGE],
  'agent-pending': [MOCK_USER_MESSAGE, MOCK_AGENT_PENDING],
  'agent-streaming': [MOCK_USER_MESSAGE, MOCK_AGENT_STREAMING],
  'agent-streaming-thoughts': [MOCK_USER_MESSAGE, MOCK_AGENT_STREAMING_WITH_THOUGHTS],
  'agent-complete': [MOCK_USER_MESSAGE, MOCK_AGENT_COMPLETE],
  'agent-complete-thoughts': [MOCK_USER_MESSAGE, MOCK_AGENT_COMPLETE_WITH_THOUGHTS],
  'agent-error': [MOCK_USER_MESSAGE, MOCK_AGENT_ERROR],
};

export interface UseDevToolbarReturn {
  // Panel
  isOpen: boolean;
  toggleOpen: () => void;

  // Override (null when inactive — page.tsx falls through to real data via ??)
  isActive: boolean;
  toggleActive: () => void;
  devMessages: Message[] | null;
  devIsLoading: boolean | null;

  // Actions
  loadScenario: (key: string) => void;
  addMessage: (msg: Message) => void;
  addCustomUserMessage: (text: string) => void;
  simulateStream: () => void;
  isSimulating: boolean;
  toggleLoading: () => void;
  clear: () => void;
}

export function useDevToolbar(): UseDevToolbarReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [devMessages, setDevMessages] = useState<Message[]>([]);
  const [devIsLoading, setDevIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(clearTimeout);
    };
  }, []);

  const clearTimeouts = useCallback(() => {
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];
  }, []);

  const toggleOpen = useCallback(() => setIsOpen((v) => !v), []);

  const toggleActive = useCallback(() => {
    setIsActive((v) => {
      if (v) {
        // Deactivating — clear dev state
        clearTimeouts();
        setIsSimulating(false);
      }
      return !v;
    });
  }, [clearTimeouts]);

  const loadScenario = useCallback(
    (key: string) => {
      const scenario = SCENARIOS[key];
      if (!scenario) return;
      clearTimeouts();
      setIsSimulating(false);
      setDevMessages([...scenario]);
      setDevIsLoading(
        key === 'agent-pending' || key === 'agent-streaming' || key === 'agent-streaming-thoughts'
      );
      setIsActive(true);
    },
    [clearTimeouts]
  );

  const addMessage = useCallback((msg: Message) => {
    setDevMessages((prev) => [...prev, msg]);
    setIsActive(true);
  }, []);

  const addCustomUserMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      addMessage(createUserMessage(trimmed));
    },
    [addMessage]
  );

  const simulateStream = useCallback(() => {
    const agent = createAgentMessage('', 'streaming');
    const agentId = agent.id;
    setDevMessages((prev) => [...prev, agent]);
    setDevIsLoading(true);
    setIsSimulating(true);
    setIsActive(true);

    const t1 = setTimeout(() => {
      setDevMessages((prev) =>
        prev.map((m) => {
          if (m.id !== agentId) return m;
          const a = m as AgentMessage;
          const th = createThought('Analyzing the request…', 'thought', 'complete');
          return { ...a, thoughts: [th], content: 'Working on it…' };
        })
      );
    }, 1000);

    const t2 = setTimeout(() => {
      setDevMessages((prev) =>
        prev.map((m) => {
          if (m.id !== agentId) return m;
          const a = m as AgentMessage;
          const th = createThought('Fetching data from API…', 'action', 'executing');
          return {
            ...a,
            thoughts: [...a.thoughts, th],
            activeThoughtId: th.id,
            content: 'Fetching data…',
          };
        })
      );
    }, 2000);

    const t3 = setTimeout(() => {
      setDevMessages((prev) =>
        prev.map((m) => {
          if (m.id !== agentId) return m;
          const a = m as AgentMessage;
          const lastThought = a.thoughts[a.thoughts.length - 1];
          const updatedThoughts = a.thoughts.map((t) =>
            t.id === lastThought?.id ? { ...t, status: 'complete' as const } : t
          );
          const result = createThought('Done — received 200 OK.', 'result', 'complete');
          return {
            ...a,
            thoughts: [...updatedThoughts, result],
            activeThoughtId: undefined,
            content: 'Here is the result of the operation. Everything completed successfully!',
            status: 'complete' as const,
          };
        })
      );
      setDevIsLoading(false);
      setIsSimulating(false);
    }, 3000);

    timeoutIds.current.push(t1, t2, t3);
  }, []);

  const toggleLoading = useCallback(() => {
    setDevIsLoading((v) => !v);
    setIsActive(true);
  }, []);

  const clear = useCallback(() => {
    clearTimeouts();
    setDevMessages([]);
    setDevIsLoading(false);
    setIsSimulating(false);
  }, [clearTimeouts]);

  return {
    isOpen,
    toggleOpen,
    isActive,
    toggleActive,
    devMessages: isActive ? devMessages : null,
    devIsLoading: isActive ? devIsLoading : null,
    loadScenario,
    addMessage,
    addCustomUserMessage,
    simulateStream,
    isSimulating,
    toggleLoading,
    clear,
  };
}
