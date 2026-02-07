'use client';

import { useState, useCallback, useRef } from 'react';
import { streamAgentMission } from '@/shared/api';
import type { Message, AgentMessage } from '@/entities/message';
import { createUserMessage, createAgentMessage } from '@/entities/message';
import { createThought } from '@/entities/agent';

export function useRunMission() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const currentAgentMessageId = useRef<string | null>(null);

  const runMission = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isExecuting) return;

      // Add user message immediately
      const userMessage = createUserMessage(prompt);
      setMessages((prev) => [...prev, userMessage]);

      // Create streaming agent message placeholder
      const agentMessage = createAgentMessage('', 'streaming');
      currentAgentMessageId.current = agentMessage.id;
      setMessages((prev) => [...prev, agentMessage]);

      setIsExecuting(true);

      let accumulatedContent = '';

      await streamAgentMission(prompt, {
        onToken: (content) => {
          accumulatedContent += content;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === agentMessage.id ? { ...msg, content: accumulatedContent } : msg
            )
          );
        },
        onToolStart: (toolName) => {
          const thought = createThought(toolName, 'action', 'executing');
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== agentMessage.id || msg.role !== 'agent') return msg;
              const agentMsg = msg as AgentMessage;
              return {
                ...agentMsg,
                thoughts: [...agentMsg.thoughts, thought],
                activeThoughtId: thought.id,
              };
            })
          );
        },
        onToolEnd: (toolName) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== agentMessage.id || msg.role !== 'agent') return msg;
              const agentMsg = msg as AgentMessage;
              const updatedThoughts = agentMsg.thoughts.map((t) => {
                if (t.content === toolName && t.status === 'executing') {
                  return { ...t, status: 'complete' as const };
                }
                return t;
              });
              const stillExecuting = updatedThoughts.find((t) => t.status === 'executing');
              return {
                ...agentMsg,
                thoughts: updatedThoughts,
                activeThoughtId: stillExecuting?.id ?? undefined,
              };
            })
          );
        },
        onComplete: () => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== agentMessage.id || msg.role !== 'agent') return msg;
              const agentMsg = msg as AgentMessage;
              // Mark all thoughts as complete
              const completedThoughts = agentMsg.thoughts.map((t) => ({
                ...t,
                status: 'complete' as const,
              }));
              return {
                ...agentMsg,
                status: 'complete' as const,
                thoughts: completedThoughts,
                activeThoughtId: undefined,
              };
            })
          );
          currentAgentMessageId.current = null;
          setIsExecuting(false);
        },
        onError: (error) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== agentMessage.id) return msg;
              if (msg.role === 'agent') {
                const agentMsg = msg as AgentMessage;
                const completedThoughts = agentMsg.thoughts.map((t) => ({
                  ...t,
                  status: 'complete' as const,
                }));
                return {
                  ...agentMsg,
                  content: `Error: ${error.message}`,
                  status: 'error' as const,
                  thoughts: completedThoughts,
                  activeThoughtId: undefined,
                };
              }
              return { ...msg, content: `Error: ${error.message}`, status: 'error' as const };
            })
          );
          currentAgentMessageId.current = null;
          setIsExecuting(false);
        },
      });
    },
    [isExecuting]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    currentAgentMessageId.current = null;
  }, []);

  return {
    messages,
    isExecuting,
    runMission,
    clearConversation,
  };
}
