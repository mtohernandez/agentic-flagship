// Message types
export type MessageRole = 'user' | 'agent';
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export interface BaseMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface UserMessage extends BaseMessage {
  role: 'user';
}

export interface AgentMessage extends BaseMessage {
  role: 'agent';
  status: MessageStatus;
  thoughts: AgentThought[];
  activeThoughtId?: string;
}

export type Message = UserMessage | AgentMessage;

// Agent thought types
export type ThoughtType = 'thought' | 'action' | 'result';
export type ThoughtStatus = 'pending' | 'executing' | 'complete';

export interface AgentThought {
  id: string;
  type: ThoughtType;
  content: string;
  status: ThoughtStatus;
  timestamp: Date;
}

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'complete' | 'error';
