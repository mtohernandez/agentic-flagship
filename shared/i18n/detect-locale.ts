import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './types';
import type { Locale } from './types';

export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

  const browserLang = navigator.language.split('-')[0];
  const match = SUPPORTED_LOCALES.find((l) => l === browserLang);
  return match ?? DEFAULT_LOCALE;
}
