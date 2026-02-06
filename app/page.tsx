'use client';

import { useRunMission } from '@/features/run-mission';
import { ChatPanel } from '@/widgets/chat-panel';

export default function Home() {
  const { messages, isExecuting, runMission, clearConversation } = useRunMission();

  return (
    <main className="flex h-screen bg-background text-foreground p-6 justify-center">
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
