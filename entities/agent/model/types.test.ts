// vi.resetModules() is needed because types.ts has a module-level thoughtIdCounter
// that persists across tests. Dynamic import after resetModules gives each test a fresh counter.

describe('createThought', () => {
  let createThought!: typeof import('./types').createThought;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
    vi.resetModules();
    const mod = await import('./types');
    createThought = mod.createThought;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a thought with the given content', () => {
    const thought = createThought('Analyzing input...');

    expect(thought.content).toBe('Analyzing input...');
  });

  it('uses default type of thought', () => {
    const thought = createThought('Test');

    expect(thought.type).toBe('thought');
  });

  it('uses default status of pending', () => {
    const thought = createThought('Test');

    expect(thought.status).toBe('pending');
  });

  it('accepts custom type and status', () => {
    const thought = createThought('Running command...', 'action', 'executing');

    expect(thought.type).toBe('action');
    expect(thought.status).toBe('executing');
  });

  it('generates unique IDs with incrementing counter', () => {
    const thought1 = createThought('First');
    const thought2 = createThought('Second');

    expect(thought1.id).not.toBe(thought2.id);
    expect(thought1.id).toMatch(/^thought-1-/);
    expect(thought2.id).toMatch(/^thought-2-/);
  });

  it('includes thought prefix in id', () => {
    const thought = createThought('Test');

    expect(thought.id).toMatch(/^thought-\d+-\d+$/);
  });

  it('sets timestamp to current date', () => {
    const thought = createThought('Test');

    expect(thought.timestamp).toEqual(new Date('2025-01-15T12:00:00Z'));
  });
});
