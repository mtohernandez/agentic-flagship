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
    const response = await fetch(
      `http://localhost:8000/run-mission?prompt=${encodeURIComponent(prompt)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.replace('data: ', ''));

          if (data.type === 'token') {
            callbacks.onToken(data.content);
          } else if (data.type === 'thought') {
            callbacks.onThought(data.content);
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    callbacks.onComplete();
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}
