import type { MissionConfig } from './types';
import { SCRAPE_ACTIONS } from './types';

export function buildPrompt(config: MissionConfig): string {
  const { urls, action, instructions } = config;
  const url = urls[0];
  if (!url) return '';

  const option = SCRAPE_ACTIONS.find((a) => a.value === action);
  if (!option) return '';

  const parts: string[] = [];

  if (action === 'custom') {
    parts.push(`Visit the following website:\n${url}`);
    if (instructions.trim()) {
      parts.push(instructions.trim());
    }
  } else {
    parts.push(`${option.promptTemplate}\n${url}`);
    if (instructions.trim()) {
      parts.push(`Additional instructions: ${instructions.trim()}`);
    }
  }

  return parts.join('\n\n');
}
