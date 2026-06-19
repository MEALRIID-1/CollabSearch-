'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ConversationList } from '@/components/messages/conversation-list';
import { ConversationPanel } from '@/components/messages/conversation-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Card } from '@/components/ui/card';

function MessagesContent() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('user');
  const conversationParam = searchParams.get('conversation');
  const [activeUserId, setActiveUserId] = useState<number | null>(userIdParam ? Number(userIdParam) : null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(conversationParam ? Number(conversationParam) : null);
  const [activeConversationName, setActiveConversationName] = useState<string | null>(null);

  useEffect(() => {
    setActiveUserId(userIdParam ? Number(userIdParam) : null);
    setActiveConversationId(conversationParam ? Number(conversationParam) : null);
  }, [userIdParam, conversationParam]);

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Communiquez avec les membres de votre équipe
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Conversation list */}
          <Card className="lg:col-span-1 overflow-hidden border shadow-sm">
            <ConversationList
              activeUserId={activeUserId ?? undefined}
              activeConversationId={activeConversationId ?? undefined}
              onSelectConversation={(id) => {
                setActiveConversationId(null);
                setActiveConversationName(null);
                setActiveUserId(id);
              }}
              onStartConversation={(id) => {
                setActiveConversationId(null);
                setActiveConversationName(null);
                setActiveUserId(id);
              }}
              onSelectGroup={(conversationId, groupName) => {
                setActiveUserId(null);
                setActiveConversationId(conversationId);
                setActiveConversationName(groupName ?? null);
              }}
            />
          </Card>

          {/* Conversation panel */}
          <Card className="lg:col-span-2 overflow-hidden border shadow-sm">
            {activeConversationId ? (
              <ConversationPanel conversationId={activeConversationId} conversationName={activeConversationName ?? undefined} />
            ) : activeUserId ? (
              <ConversationPanel userId={activeUserId} />
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="Sélectionnez une conversation"
                description="Choisissez une conversation dans la liste ou commencez une nouvelle discussion"
              />
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner text="Chargement des messages..." size="lg" />
          </div>
        </AppLayout>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
