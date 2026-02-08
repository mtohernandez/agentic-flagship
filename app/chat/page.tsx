'use client';

import { useRunMission } from '@/features/run-mission';
import { ChatPanel } from '@/widgets/chat-panel';
import { ThemeToggle } from '@/components/theme-toggle';
import { DevToolbar } from '@/components/dev/DevToolbar';
import { useDevToolbar } from '@/components/dev/useDevToolbar';

export default function ChatPage() {
  const { messages, isExecuting, runMission, clearConversation } = useRunMission();
  const toolbar = useDevToolbar();

  return (
    <main className="relative flex flex-col h-screen bg-background text-foreground">
      <div className="absolute top-3 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex justify-center overflow-hidden">
        <div className="w-full max-w-2xl flex flex-col h-full">
          <ChatPanel
            messages={toolbar.devMessages ?? messages}
            isLoading={toolbar.devIsLoading ?? isExecuting}
            onSendMessage={runMission}
            onClear={clearConversation}
          />
        </div>
      </div>
      {process.env.NODE_ENV === 'development' && <DevToolbar toolbar={toolbar} />}
    </main>
  );
}
