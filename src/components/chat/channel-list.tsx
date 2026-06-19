'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatChannels, useCreateChatChannel } from '@/lib/hooks/use-chat-channels';
import type { ChatChannel } from '@/types/models';
import type { CreateChatChannelRequest } from '@/types/api';

interface ChatChannelListProps {
  activeChannelId?: number;
  onSelectChannel: (channelId: number) => void;
}

export function ChatChannelList({ activeChannelId, onSelectChannel }: ChatChannelListProps) {
  const { data: channels = [], isLoading, isError } = useChatChannels();
  const createChannel = useCreateChatChannel();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'project_general' | 'topic' | 'direct'>('topic');

  const handleCreateChannel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: CreateChatChannelRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
    };

    await createChannel.mutateAsync(payload);
    setName('');
    setDescription('');
    setType('topic');
    setShowForm(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Canaux</p>
          <p className="text-xs text-muted-foreground">Sélectionnez un canal ou créez-en un nouveau.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Nouveau canal'}
        </Button>
      </div>

      {showForm && (
        <Card className="m-4 rounded-lg border bg-background p-4 shadow-sm">
          <form className="space-y-3" onSubmit={handleCreateChannel}>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nom du canal</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Nom du canal"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Résumé court du canal"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as typeof type)}
                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="project_general">Projet général</option>
                <option value="topic">Thématique</option>
                <option value="direct">Direct</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={createChannel.isPending || !name.trim()}>
                Créer
              </Button>
            </div>
            {createChannel.isError && (
              <p className="text-xs text-destructive">Impossible de créer le canal. Réessayez.</p>
            )}
          </form>
        </Card>
      )}

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-2 py-3">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Chargement des canaux...
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Impossible de charger les canaux.
            </div>
          ) : channels.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted p-4 text-sm text-muted-foreground">
              Aucun canal disponible. Créez-en un pour démarrer.
            </div>
          ) : (
            <div className="space-y-2">
              {channels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isActive={channel.id === activeChannelId}
                  onClick={() => onSelectChannel(channel.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function ChannelCard({
  channel,
  isActive,
  onClick,
}: {
  channel: ChatChannel;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition ${
        isActive ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/80'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold truncate">{channel.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{channel.description || 'Canal sans description'}</p>
        </div>
        <span className="text-[11px] text-muted-foreground">{channel.type.replace('_', ' ')}</span>
      </div>
    </button>
  );
}
