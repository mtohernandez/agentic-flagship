import type { ReactNode } from 'react';
import { I18nProvider } from './i18n-context';

export function I18nTestWrapper({ children }: { children: ReactNode }) {
  return <I18nProvider initialLocale="en">{children}</I18nProvider>;
}
