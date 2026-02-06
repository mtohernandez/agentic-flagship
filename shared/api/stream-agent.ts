import { apiStream } from './client';
import { API_ROUTES } from './config';
import type { SSEEvent } from './types';

export interface AgentStreamCallbacks {
  onToken: (content: string) => void;
  onThought: (content: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export async function streamAgentMission(
  prompt: string,
  callbacks: AgentStreamCallbacks
): Promise<void> {
  try {
    const stream = await apiStream(
      API_ROUTES.agent.runMission + '?prompt=' + encodeURIComponent(prompt)
    );

    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      handleSSEEvent(value, callbacks);
    }

    callbacks.onComplete();
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

function handleSSEEvent(event: SSEEvent, callbacks: AgentStreamCallbacks): void {
  try {
    const data = JSON.parse(event.data);

    if (data.type === 'token') {
      callbacks.onToken(data.content);
    } else if (data.type === 'thought') {
      callbacks.onThought(data.content);
    }
  } catch {
    // Skip malformed JSON
  }
}
