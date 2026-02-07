import {
  isValidUrl,
  isDuplicateUrl,
  validateUrlInput,
  isDuplicateJob,
  validateJobInput,
  canSubmit,
} from './validation';
import type { ScrapeJob } from './types';

describe('isValidUrl', () => {
  it('accepts http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('accepts https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('rejects URLs without protocol', () => {
    expect(isValidUrl('example.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('rejects random text', () => {
    expect(isValidUrl('not a url')).toBe(false);
  });

  it('trims whitespace', () => {
    expect(isValidUrl('  https://example.com  ')).toBe(true);
  });
});

describe('isDuplicateUrl', () => {
  it('detects exact duplicate', () => {
    expect(isDuplicateUrl('https://example.com', ['https://example.com'])).toBe(true);
  });

  it('detects case-insensitive duplicate', () => {
    expect(isDuplicateUrl('https://Example.COM', ['https://example.com'])).toBe(true);
  });

  it('detects trailing-slash duplicate', () => {
    expect(isDuplicateUrl('https://example.com/', ['https://example.com'])).toBe(true);
  });

  it('returns false for unique URL', () => {
    expect(isDuplicateUrl('https://other.com', ['https://example.com'])).toBe(false);
  });

  it('returns false for empty list', () => {
    expect(isDuplicateUrl('https://example.com', [])).toBe(false);
  });
});

describe('isDuplicateJob', () => {
  const jobs: ScrapeJob[] = [
    { url: 'https://example.com', action: 'extract-text', instructions: '' },
  ];

  it('detects duplicate when same URL and same action', () => {
    expect(isDuplicateJob('https://example.com', 'extract-text', jobs)).toBe(true);
  });

  it('allows same URL with different action', () => {
    expect(isDuplicateJob('https://example.com', 'summarize', jobs)).toBe(false);
  });

  it('detects case-insensitive URL duplicate', () => {
    expect(isDuplicateJob('https://Example.COM', 'extract-text', jobs)).toBe(true);
  });

  it('detects trailing-slash URL duplicate', () => {
    expect(isDuplicateJob('https://example.com/', 'extract-text', jobs)).toBe(true);
  });

  it('returns false for empty jobs list', () => {
    expect(isDuplicateJob('https://example.com', 'extract-text', [])).toBe(false);
  });
});

describe('validateUrlInput', () => {
  it('returns valid for a good URL', () => {
    expect(validateUrlInput('https://example.com', [])).toEqual({ valid: true });
  });

  it('returns invalid with error for bad URL', () => {
    expect(validateUrlInput('example.com', [])).toEqual({
      valid: false,
      urlError: 'URL must start with http:// or https://',
    });
  });

  it('returns invalid with error for duplicate URL', () => {
    expect(validateUrlInput('https://example.com', ['https://example.com'])).toEqual({
      valid: false,
      urlError: 'URL already added',
    });
  });

  it('returns invalid without error for empty input', () => {
    expect(validateUrlInput('', [])).toEqual({ valid: false });
  });

  it('returns invalid without error for whitespace-only input', () => {
    expect(validateUrlInput('   ', [])).toEqual({ valid: false });
  });
});

describe('validateJobInput', () => {
  it('returns valid for a good URL with non-custom action', () => {
    expect(validateJobInput('https://example.com', 'extract-text', '', [])).toEqual({
      valid: true,
    });
  });

  it('returns invalid with error for bad URL', () => {
    expect(validateJobInput('example.com', 'extract-text', '', [])).toEqual({
      valid: false,
      urlError: 'URL must start with http:// or https://',
    });
  });

  it('returns invalid with error for duplicate job (same URL + action)', () => {
    const jobs: ScrapeJob[] = [
      { url: 'https://example.com', action: 'extract-text', instructions: '' },
    ];
    expect(validateJobInput('https://example.com', 'extract-text', '', jobs)).toEqual({
      valid: false,
      urlError: 'Job already added',
    });
  });

  it('allows same URL with different action', () => {
    const jobs: ScrapeJob[] = [
      { url: 'https://example.com', action: 'extract-text', instructions: '' },
    ];
    expect(validateJobInput('https://example.com', 'summarize', '', jobs)).toEqual({ valid: true });
  });

  it('returns invalid with instructionsError for custom action without instructions', () => {
    expect(validateJobInput('https://example.com', 'custom', '', [])).toEqual({
      valid: false,
      instructionsError: 'Instructions required for custom action',
    });
  });

  it('returns valid for custom action with instructions', () => {
    expect(validateJobInput('https://example.com', 'custom', 'Do something', [])).toEqual({
      valid: true,
    });
  });

  it('returns invalid without error for empty input', () => {
    expect(validateJobInput('', 'extract-text', '', [])).toEqual({ valid: false });
  });

  it('returns invalid without error for whitespace-only input', () => {
    expect(validateJobInput('   ', 'extract-text', '', [])).toEqual({ valid: false });
  });
});

describe('canSubmit', () => {
  it('returns true with jobs', () => {
    const jobs: ScrapeJob[] = [
      { url: 'https://example.com', action: 'extract-text', instructions: '' },
    ];
    expect(canSubmit(jobs)).toBe(true);
  });

  it('returns false with no jobs', () => {
    expect(canSubmit([])).toBe(false);
  });
});
