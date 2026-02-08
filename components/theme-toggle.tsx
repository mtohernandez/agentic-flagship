'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { RiSunLine, RiMoonLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/shared/i18n';

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={t('common', 'toggleDarkMode')}
      className="relative h-8 w-8"
    >
      <RiSunLine
        className={`h-4 w-4 transition-all duration-300 ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
      />
      <RiMoonLine
        className={`absolute h-4 w-4 transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
      />
    </Button>
  );
}
