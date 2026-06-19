'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { ChatChannelList } from '@/components/chat/channel-list';
import { ConversationPanel } from '@/components/chat/conversation-panel';
import { Card } from '@/components/ui/card';

export default function ChatPage() {
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Chat de groupe</h1>
          <p className="text-muted-foreground mt-1">Discutez en temps réel avec votre équipe sur des canaux dédiés.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-220px)]">
          <Card className="lg:col-span-1 overflow-hidden border shadow-sm">
            <ChatChannelList
              activeChannelId={activeChannelId ?? undefined}
              onSelectChannel={(id) => setActiveChannelId(id)}
            />
          </Card>

          <Card className="lg:col-span-3 overflow-hidden border shadow-sm">
            {activeChannelId ? (
              <ConversationPanel channelId={activeChannelId} />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                Sélectionnez un canal pour commencer à discuter.
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
