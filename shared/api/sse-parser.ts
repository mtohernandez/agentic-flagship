import type { SSEEvent } from './types';

export function createSSETransformStream(): TransformStream<string, SSEEvent> {
  let buffer = '';

  return new TransformStream<string, SSEEvent>({
    transform(chunk, controller) {
      buffer += chunk;

      const parts = buffer.split('\n\n');
      // Last part may be incomplete — keep it in the buffer
      buffer = parts.pop()!;

      for (const part of parts) {
        const event = parseSSEBlock(part);
        if (event) {
          controller.enqueue(event);
        }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        const event = parseSSEBlock(buffer);
        if (event) {
          controller.enqueue(event);
        }
      }
    },
  });
}

function parseSSEBlock(block: string): SSEEvent | null {
  const lines = block.split('\n');
  let data = '';
  let event: string | undefined;
  let id: string | undefined;
  let hasData = false;

  for (const line of lines) {
    if (line.startsWith(':')) {
      // Comment line — skip
      continue;
    }
    if (line.startsWith('data: ')) {
      data += (hasData ? '\n' : '') + line.slice(6);
      hasData = true;
    } else if (line.startsWith('data:')) {
      data += (hasData ? '\n' : '') + line.slice(5);
      hasData = true;
    } else if (line.startsWith('event: ')) {
      event = line.slice(7);
    } else if (line.startsWith('event:')) {
      event = line.slice(6);
    } else if (line.startsWith('id: ')) {
      id = line.slice(4);
    } else if (line.startsWith('id:')) {
      id = line.slice(3);
    }
  }

  if (!hasData) return null;

  const result: SSEEvent = { data };
  if (event) result.event = event;
  if (id) result.id = id;
  return result;
}
