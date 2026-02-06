import type { Message, UserMessage, AgentMessage, MessageStatus } from '@/shared/types';

export type { Message, UserMessage, AgentMessage, MessageStatus };

let messageIdCounter = 0;

export function createUserMessage(content: string): UserMessage {
  return {
    id: `msg-${++messageIdCounter}-${Date.now()}`,
    role: 'user',
    content,
    timestamp: new Date(),
  };
}

export function createAgentMessage(
  content: string = '',
  status: MessageStatus = 'pending'
): AgentMessage {
  return {
    id: `msg-${++messageIdCounter}-${Date.now()}`,
    role: 'agent',
    content,
    status,
    thoughts: [],
    timestamp: new Date(),
  };
}
