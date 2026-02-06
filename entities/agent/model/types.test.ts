import { createThought } from './types';

describe('createThought', () => {
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

  it('generates unique IDs for each thought', () => {
    const thought1 = createThought('First');
    const thought2 = createThought('Second');

    expect(thought1.id).not.toBe(thought2.id);
  });

  it('includes thought prefix in id', () => {
    const thought = createThought('Test');

    expect(thought.id).toMatch(/^thought-\d+-\d+$/);
  });

  it('sets timestamp to current date', () => {
    const before = new Date();
    const thought = createThought('Test');
    const after = new Date();

    expect(thought.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(thought.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('accepts complete status', () => {
    const thought = createThought('Done', 'thought', 'complete');

    expect(thought.status).toBe('complete');
  });
});
