export type ScrapeAction =
  | 'extract-text'
  | 'extract-products'
  | 'extract-contacts'
  | 'extract-links'
  | 'summarize'
  | 'custom';

import type { MissionTranslations } from '@/shared/i18n';

export interface ScrapeActionOption {
  value: ScrapeAction;
  labelKey: keyof MissionTranslations;
  hintKey: keyof MissionTranslations;
  promptTemplate: string;
}

export const SCRAPE_ACTIONS: ScrapeActionOption[] = [
  {
    value: 'extract-text',
    labelKey: 'extractTextLabel',
    hintKey: 'extractTextHint',
    promptTemplate: 'Extract the main text content from the following website:',
  },
  {
    value: 'extract-products',
    labelKey: 'extractProductsLabel',
    hintKey: 'extractProductsHint',
    promptTemplate:
      'Extract product data (names, prices, descriptions) from the following website:',
  },
  {
    value: 'extract-contacts',
    labelKey: 'extractContactsLabel',
    hintKey: 'extractContactsHint',
    promptTemplate:
      'Extract contact information (emails, phone numbers, addresses) from the following website:',
  },
  {
    value: 'extract-links',
    labelKey: 'extractLinksLabel',
    hintKey: 'extractLinksHint',
    promptTemplate: 'Extract and categorize all links from the following website:',
  },
  {
    value: 'summarize',
    labelKey: 'summarizeLabel',
    hintKey: 'summarizeHint',
    promptTemplate: 'Provide a comprehensive summary of the following website:',
  },
  {
    value: 'custom',
    labelKey: 'customLabel',
    hintKey: 'customHint',
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
