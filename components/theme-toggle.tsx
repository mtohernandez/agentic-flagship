'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Switch } from '@/components/ui/switch';

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Light</span>
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Toggle dark mode"
      />
      <span className="text-sm text-muted-foreground">Dark</span>
    </div>
  );
}
