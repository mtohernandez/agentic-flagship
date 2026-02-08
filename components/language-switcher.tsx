'use client';

import { RiTranslate2 } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/shared/i18n';
import { SUPPORTED_LOCALES } from '@/shared/i18n';
import type { Locale } from '@/shared/i18n';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
};

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  const nextLocale =
    SUPPORTED_LOCALES[(SUPPORTED_LOCALES.indexOf(locale) + 1) % SUPPORTED_LOCALES.length];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLocale(nextLocale)}
      aria-label={t('common', 'switchLanguage')}
      className="h-8 w-16 gap-0.5"
    >
      <RiTranslate2 className="h-4 w-4" />
      <span className="text-[9px] font-bold leading-none">{LOCALE_LABELS[locale]}</span>
    </Button>
  );
}
