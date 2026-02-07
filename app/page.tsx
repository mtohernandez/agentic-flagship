'use client';

import { useRunMission } from '@/features/run-mission';
import { ChatPanel } from '@/widgets/chat-panel';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const { messages, isExecuting, runMission, clearConversation } = useRunMission();

  return (
    <main className="relative flex h-screen bg-background text-foreground p-6 justify-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-3xl">
        <ChatPanel
          messages={messages}
          isLoading={isExecuting}
          onSendMessage={runMission}
          onClear={clearConversation}
        />
      </div>
    </main>
  );
}
