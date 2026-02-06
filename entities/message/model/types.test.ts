// vi.resetModules() is needed because types.ts has a module-level messageIdCounter
// that persists across tests. Dynamic import after resetModules gives each test a fresh counter.

describe('createUserMessage', () => {
  let createUserMessage!: typeof import('./types').createUserMessage;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    vi.resetModules();
    const mod = await import('./types');
    createUserMessage = mod.createUserMessage;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a user message with the given content', () => {
    const message = createUserMessage('Hello, agent!');

    expect(message.role).toBe('user');
    expect(message.content).toBe('Hello, agent!');
  });

  it('generates unique IDs with incrementing counter', () => {
    const message1 = createUserMessage('First');
    const message2 = createUserMessage('Second');

    expect(message1.id).not.toBe(message2.id);
    expect(message1.id).toMatch(/^msg-1-/);
    expect(message2.id).toMatch(/^msg-2-/);
  });

  it('sets timestamp to current date', () => {
    const message = createUserMessage('Test');

    expect(message.timestamp).toEqual(new Date('2025-01-15T12:00:00Z'));
  });

  it('includes msg prefix in id', () => {
    const message = createUserMessage('Test');

    expect(message.id).toMatch(/^msg-\d+-\d+$/);
  });
});

describe('createAgentMessage', () => {
  let createAgentMessage!: typeof import('./types').createAgentMessage;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    vi.resetModules();
    const mod = await import('./types');
    createAgentMessage = mod.createAgentMessage;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('generates unique IDs with incrementing counter', () => {
    const message1 = createAgentMessage();
    const message2 = createAgentMessage();

    expect(message1.id).not.toBe(message2.id);
    expect(message1.id).toMatch(/^msg-1-/);
    expect(message2.id).toMatch(/^msg-2-/);
  });

  it('sets timestamp to current date', () => {
    const message = createAgentMessage();

    expect(message.timestamp).toEqual(new Date('2025-01-15T12:00:00Z'));
  });

  it('includes msg prefix in id', () => {
    const message = createAgentMessage();

    expect(message.id).toMatch(/^msg-\d+-\d+$/);
  });
});
