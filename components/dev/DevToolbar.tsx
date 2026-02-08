'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { UseDevToolbarReturn } from './useDevToolbar';

const SCENARIO_BUTTONS = [
  { key: 'full', label: 'Full Conv' },
  { key: 'empty', label: 'Empty' },
  { key: 'user', label: 'User' },
  { key: 'agent-pending', label: 'Pending' },
  { key: 'agent-streaming', label: 'Stream' },
  { key: 'agent-streaming-thoughts', label: 'Stream+Thoughts' },
  { key: 'agent-complete', label: 'Complete' },
  { key: 'agent-complete-thoughts', label: 'Complete+Thoughts' },
  { key: 'agent-error', label: 'Error' },
] as const;

interface DevToolbarProps {
  toolbar: UseDevToolbarReturn;
}

export function DevToolbar({ toolbar }: DevToolbarProps) {
  const [customInput, setCustomInput] = useState('');

  if (process.env.NODE_ENV !== 'development') return null;

  const handleSend = () => {
    toolbar.addCustomUserMessage(customInput);
    setCustomInput('');
  };

  if (!toolbar.isOpen) {
    return (
      <button
        onClick={toolbar.toggleOpen}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold shadow-lg border hover:bg-accent transition-colors"
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${toolbar.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
        />
        DEV
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-lg border bg-background shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-semibold">Dev Toolbar</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={toolbar.toggleOpen}>
          ×
        </Button>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm">Active</span>
        <div className="flex items-center gap-2">
          {toolbar.isActive && (
            <Badge variant="secondary" className="text-[10px]">
              overriding
            </Badge>
          )}
          <Switch checked={toolbar.isActive} onCheckedChange={toolbar.toggleActive} />
        </div>
      </div>

      {/* Scenarios */}
      <div className="p-3 space-y-2 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Scenarios
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SCENARIO_BUTTONS.map(({ key, label }) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => toolbar.loadScenario(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom message */}
      <div className="p-3 space-y-2 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Add Custom Message
        </span>
        <div className="flex gap-1.5">
          <Input
            placeholder="Type a message…"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="h-8 text-xs"
          />
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSend}>
            Send
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={toolbar.simulateStream}
            disabled={toolbar.isSimulating}
          >
            {toolbar.isSimulating ? 'Simulating…' : 'Simulate Stream'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={toolbar.toggleLoading}
          >
            Toggle Loading
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={toolbar.clear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
