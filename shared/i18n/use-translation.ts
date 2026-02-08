'use client';

import { useContext } from 'react';
import { I18nContext } from './i18n-context';
import type { I18nContextValue } from './i18n-context';

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return ctx;
}
