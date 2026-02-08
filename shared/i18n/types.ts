export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export interface CommonTranslations {
  toggleDarkMode: string;
  switchLanguage: string;
}

export interface MissionTranslations {
  extractTextLabel: string;
  extractTextHint: string;
  extractProductsLabel: string;
  extractProductsHint: string;
  extractContactsLabel: string;
  extractContactsHint: string;
  extractLinksLabel: string;
  extractLinksHint: string;
  summarizeLabel: string;
  summarizeHint: string;
  customLabel: string;
  customHint: string;
  scrapeAction: string;
  urlInput: string;
  toggleInstructions: string;
  addJob: string;
  run: string;
  runCountLabel: string;
  runCountLabel_one: string;
  runCountLabel_other: string;
  clearChat: string;
  removeJob: string;
  additionalInstructions: string;
  cancel: string;
  cancelQueue: string;
  queueProgress: string;
}

export interface ValidationTranslations {
  urlInvalid: string;
  urlDuplicate: string;
  jobDuplicate: string;
  instructionsRequired: string;
}

export interface MessageTranslations {
  roleUser: string;
  roleAgent: string;
  defaultError: string;
  welcomeTitle: string;
  welcomeDescription: string;
}

export interface AgentTranslations {
  thinking: string;
  stillWorking: string;
  completedSteps: string;
  completedSteps_one: string;
  completedSteps_other: string;
  agentThinking: string;
  emptyResponseError: string;
  genericError: string;
}

export interface TranslationNamespaces {
  common: CommonTranslations;
  mission: MissionTranslations;
  validation: ValidationTranslations;
  message: MessageTranslations;
  agent: AgentTranslations;
}

export type Namespace = keyof TranslationNamespaces;
