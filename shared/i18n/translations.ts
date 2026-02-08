import type { Locale, Namespace, TranslationNamespaces } from './types';
import { en } from './locales/en';
import { es } from './locales/es';

const translations: Record<Locale, TranslationNamespaces> = { en, es };

export function translate<N extends Namespace>(
  locale: Locale,
  namespace: N,
  key: keyof TranslationNamespaces[N],
  params?: Record<string, string | number>
): string {
  const ns = translations[locale][namespace];

  // Plural resolution: if params has `count`, try _one / _other suffix
  let resolvedKey = key as string;
  if (params && 'count' in params) {
    const count = params.count as number;
    const suffix = count === 1 ? '_one' : '_other';
    const pluralKey = `${resolvedKey}${suffix}`;
    if (pluralKey in ns) {
      resolvedKey = pluralKey;
    }
  }

  let value = (ns as unknown as Record<string, string>)[resolvedKey] ?? resolvedKey;

  // Interpolation: replace {variable} placeholders
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return value;
}

export function getTranslator(locale: Locale) {
  return <N extends Namespace>(
    namespace: N,
    key: keyof TranslationNamespaces[N],
    params?: Record<string, string | number>
  ) => translate(locale, namespace, key, params);
}
