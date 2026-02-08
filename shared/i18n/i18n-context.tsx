'use client';

import { createContext, useState, useEffect, useCallback } from 'react';
import type { Locale, Namespace, TranslationNamespaces } from './types';
import { translate } from './translations';
import { detectLocale } from './detect-locale';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: <N extends Namespace>(
    namespace: N,
    key: keyof TranslationNamespaces[N],
    params?: Record<string, string | number>
  ) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? detectLocale());

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    <N extends Namespace>(
      namespace: N,
      key: keyof TranslationNamespaces[N],
      params?: Record<string, string | number>
    ) => translate(locale, namespace, key, params),
    [locale]
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}
