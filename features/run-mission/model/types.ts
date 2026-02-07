export type ScrapeAction =
  | 'extract-text'
  | 'extract-products'
  | 'extract-contacts'
  | 'extract-links'
  | 'summarize'
  | 'custom';

export interface ScrapeActionOption {
  value: ScrapeAction;
  label: string;
  hint: string;
  promptTemplate: string;
}

export const SCRAPE_ACTIONS: ScrapeActionOption[] = [
  {
    value: 'extract-text',
    label: 'Extract text content',
    hint: 'e.g., "Only the main article body"',
    promptTemplate: 'Extract the main text content from the following website:',
  },
  {
    value: 'extract-products',
    label: 'Extract product data',
    hint: 'e.g., "Include prices and availability"',
    promptTemplate:
      'Extract product data (names, prices, descriptions) from the following website:',
  },
  {
    value: 'extract-contacts',
    label: 'Extract contact info',
    hint: 'e.g., "Find emails and phone numbers"',
    promptTemplate:
      'Extract contact information (emails, phone numbers, addresses) from the following website:',
  },
  {
    value: 'extract-links',
    label: 'Extract links',
    hint: 'e.g., "Only external links"',
    promptTemplate: 'Extract and categorize all links from the following website:',
  },
  {
    value: 'summarize',
    label: 'Summarize page',
    hint: 'e.g., "Focus on key facts"',
    promptTemplate: 'Provide a comprehensive summary of the following website:',
  },
  {
    value: 'custom',
    label: 'Custom instructions',
    hint: 'Describe what you want the agent to do...',
    promptTemplate: '',
  },
];

export interface ScrapeJob {
  url: string;
  action: ScrapeAction;
  instructions: string;
}

export interface MissionConfig {
  urls: string[];
  action: ScrapeAction;
  instructions: string;
}
