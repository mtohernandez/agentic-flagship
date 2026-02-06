import type { AgentThought, AgentStatus, ThoughtType, ThoughtStatus } from '@/shared/types';

export type { AgentThought, AgentStatus, ThoughtType, ThoughtStatus };

let thoughtIdCounter = 0;

export function createThought(
  content: string,
  type: ThoughtType = 'thought',
  status: ThoughtStatus = 'pending'
): AgentThought {
  return {
    id: `thought-${++thoughtIdCounter}-${Date.now()}`,
    type,
    content,
    status,
    timestamp: new Date(),
  };
}
