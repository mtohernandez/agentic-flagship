import { apiStream } from './client';
import { API_ROUTES } from './config';
import type { SSEEvent } from './types';

export interface AgentStreamCallbacks {
  onToken: (content: string) => void;
  onToolStart: (toolName: string) => void;
  onToolEnd: (toolName: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export async function streamAgentMission(
  prompt: string,
  callbacks: AgentStreamCallbacks
): Promise<void> {
  let doneReceived = false;

  try {
    const stream = await apiStream(
      API_ROUTES.agent.runMission + '?prompt=' + encodeURIComponent(prompt)
    );

    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      handleSSEEvent(value, callbacks, () => {
        doneReceived = true;
      });
    }

    if (!doneReceived) {
      callbacks.onComplete();
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

function handleSSEEvent(
  event: SSEEvent,
  callbacks: AgentStreamCallbacks,
  markDone: () => void
): void {
  try {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'token':
        callbacks.onToken(data.content);
        break;
      case 'tool_start':
        callbacks.onToolStart(data.content);
        break;
      case 'tool_end':
        callbacks.onToolEnd(data.content);
        break;
      case 'done':
        markDone();
        callbacks.onComplete();
        break;
      case 'error':
        callbacks.onError(new Error(data.content));
        break;
    }
  } catch {
    // Skip malformed JSON
  }
}
