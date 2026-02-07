import { buildPrompt } from './build-prompt';

describe('buildPrompt', () => {
  it('builds prompt for extract-text action without instructions', () => {
    const result = buildPrompt({
      urls: ['https://example.com'],
      action: 'extract-text',
      instructions: '',
    });

    expect(result).toBe(
      'Extract the main text content from the following website:\nhttps://example.com'
    );
  });

  it('builds prompt for extract-text action with instructions', () => {
    const result = buildPrompt({
      urls: ['https://example.com'],
      action: 'extract-text',
      instructions: 'Only the main article body',
    });

    expect(result).toBe(
      'Extract the main text content from the following website:\nhttps://example.com\n\nAdditional instructions: Only the main article body'
    );
  });

  it('builds prompt for extract-products action', () => {
    const result = buildPrompt({
      urls: ['https://shop.io'],
      action: 'extract-products',
      instructions: '',
    });

    expect(result).toBe(
      'Extract product data (names, prices, descriptions) from the following website:\nhttps://shop.io'
    );
  });

  it('builds prompt for custom action with instructions', () => {
    const result = buildPrompt({
      urls: ['https://example.com'],
      action: 'custom',
      instructions: 'Get all headings',
    });

    expect(result).toBe('Visit the following website:\nhttps://example.com\n\nGet all headings');
  });

  it('builds prompt for custom action without instructions', () => {
    const result = buildPrompt({
      urls: ['https://example.com'],
      action: 'custom',
      instructions: '',
    });

    expect(result).toBe('Visit the following website:\nhttps://example.com');
  });

  it('uses only the first URL', () => {
    const result = buildPrompt({
      urls: ['https://first.com', 'https://second.com'],
      action: 'summarize',
      instructions: '',
    });

    expect(result).toContain('https://first.com');
    expect(result).not.toContain('https://second.com');
  });

  it('returns empty string for empty urls', () => {
    expect(buildPrompt({ urls: [], action: 'extract-text', instructions: '' })).toBe('');
  });

  it('trims whitespace from instructions', () => {
    const result = buildPrompt({
      urls: ['https://example.com'],
      action: 'extract-text',
      instructions: '  some instructions  ',
    });

    expect(result).toContain('Additional instructions: some instructions');
  });
});
