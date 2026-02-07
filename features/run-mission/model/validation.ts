import type { ScrapeAction, ScrapeJob } from './types';

const URL_PATTERN = /^https?:\/\/.+/i;

export function isValidUrl(url: string): boolean {
  return URL_PATTERN.test(url.trim());
}

function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, '');
}

export function isDuplicateUrl(url: string, existing: string[]): boolean {
  const normalized = normalizeUrl(url);
  return existing.some((u) => normalizeUrl(u) === normalized);
}

export function isDuplicateJob(url: string, action: ScrapeAction, jobs: ScrapeJob[]): boolean {
  const normalized = normalizeUrl(url);
  return jobs.some((j) => normalizeUrl(j.url) === normalized && j.action === action);
}

export function validateUrlInput(
  url: string,
  existing: string[]
): { valid: boolean; urlError?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false };
  if (!isValidUrl(trimmed))
    return { valid: false, urlError: 'URL must start with http:// or https://' };
  if (isDuplicateUrl(trimmed, existing)) return { valid: false, urlError: 'URL already added' };
  return { valid: true };
}

export function validateJobInput(
  url: string,
  action: ScrapeAction,
  instructions: string,
  jobs: ScrapeJob[]
): { valid: boolean; urlError?: string; instructionsError?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false };
  if (!isValidUrl(trimmed))
    return { valid: false, urlError: 'URL must start with http:// or https://' };
  if (isDuplicateJob(trimmed, action, jobs)) return { valid: false, urlError: 'Job already added' };
  if (action === 'custom' && !instructions.trim())
    return { valid: false, instructionsError: 'Instructions required for custom action' };
  return { valid: true };
}

export function canSubmit(jobs: ScrapeJob[]): boolean {
  return jobs.length > 0;
}
