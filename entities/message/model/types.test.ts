import { createUserMessage, createAgentMessage } from './types';

describe('createUserMessage', () => {
  it('creates a user message with the given content', () => {
    const message = createUserMessage('Hello, agent!');

    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello, agent!');
  });

  it('generates unique IDs for each message', () => {
    const message1 = createUserMessage('First');
    const message2 = createUserMessage('Second');

    expect(message1.id).not.toBe(message2.id);
  });

  it('sets timestamp to current date', () => {
    const before = new Date();
    const message = createUserMessage('Test');
    const after = new Date();

    expect(message.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(message.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('includes msg prefix in id', () => {
    const message = createUserMessage('Test');

    expect(message.id).toMatch(/^msg-\d+-\d+$/);
  });
});

describe('createAgentMessage', () => {
  it('creates an agent message with default values', () => {
    const message = createAgentMessage();

    expect(message.role).toBe('agent');
    expect(message.content).toBe('');
    expect(message.status).toBe('pending');
    expect(message.thoughts).toEqual([]);
  });

  it('creates an agent message with custom content and status', () => {
    const message = createAgentMessage('Thinking...', 'streaming');

    expect(message.content).toBe('Thinking...');
    expect(message.status).toBe('streaming');
  });

  it('generates unique IDs for each message', () => {
    const message1 = createAgentMessage();
    const message2 = createAgentMessage();

    expect(message1.id).not.toBe(message2.id);
  });

  it('sets timestamp to current date', () => {
    const before = new Date();
    const message = createAgentMessage();
    const after = new Date();

    expect(message.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(message.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('includes msg prefix in id', () => {
    const message = createAgentMessage();

    expect(message.id).toMatch(/^msg-\d+-\d+$/);
  });

  it('initializes with empty thoughts array', () => {
    const message = createAgentMessage('Content', 'complete');

    expect(Array.isArray(message.thoughts)).toBe(true);
    expect(message.thoughts).toHaveLength(0);
  });
});
