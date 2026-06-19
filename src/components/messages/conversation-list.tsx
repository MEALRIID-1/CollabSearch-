'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { getInitials, truncateText, formatRelative } from '@/lib/utils/format';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useConversations } from '@/lib/hooks/use-messages';
import { usersApi } from '@/lib/api/users';
import { messagesApi } from '@/lib/api/messages';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { Conversation, User } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';

interface ConversationListProps {
  activeUserId?: number;
  activeConversationId?: number;
  onSelectConversation: (userId: number) => void;
  onStartConversation: (userId: number) => void;
  onSelectGroup?: (conversationId: number, conversationName?: string) => void;
}

export function ConversationList(props: ConversationListProps) {
  const { activeUserId, onSelectConversation, onStartConversation } = props;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const currentUser = useAuthStore((state) => state.user);
  const { data: conversations, isLoading } = useConversations();
  const { data: usersData, isLoading: isUsersLoading, isError: isUsersError } = useQuery<PaginatedResponse<User>>({
    queryKey: ['message-new-conversation-users', search],
    queryFn: () => usersApi.list({ search: search.trim() || undefined }),
    enabled: dialogOpen,
  });
  const router = useRouter();
  const { data: groupConversations } = useQuery({
    queryKey: ['group-conversations'],
    queryFn: () => messagesApi.getGroupConversations(),
  });
  const [filter, setFilter] = useState<'all' | 'groups' | 'private'>('all');

  const recipients = (usersData?.data ?? []).filter(
    (user: User) => user.id !== currentUser?.id
  );

  const handleStartConversation = (userId: number) => {
    setDialogOpen(false);
    onStartConversation(userId);
  };

  const handleToggleMember = (id: number) => {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    try {
      const conv = await messagesApi.createGroup({ group_name: groupName.trim(), participant_ids: selectedMembers });
      setDialogOpen(false);
      // navigate to messages with conversation id (force reload so parent picks it up)
      window.location.assign(`/messages?conversation=${conv.id}`);
    } catch (err) {
      console.error('Erreur création groupe', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner text="Chargement..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div>
          <p className="text-sm font-semibold">Conversations</p>
          <p className="text-xs text-muted-foreground">Recherchez un membre ou sélectionnez un chat existant.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={filter === 'all' ? 'secondary' : 'ghost'} onClick={() => setFilter('all')}>Tous</Button>
          <Button size="sm" variant={filter === 'groups' ? 'secondary' : 'ghost'} onClick={() => setFilter('groups')}>Groupes</Button>
          <Button size="sm" variant={filter === 'private' ? 'secondary' : 'ghost'} onClick={() => setFilter('private')}>Privés</Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nouvelle conversation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isGroupMode ? 'Nouvelle conversation de groupe' : 'Nouvelle conversation'}</DialogTitle>
              <DialogDescription>
                {isGroupMode ? 'Donnez un nom au groupe et sélectionnez les membres.' : 'Recherchez un membre et commencez une discussion.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <input id="groupMode" type="checkbox" className="mr-2" checked={isGroupMode} onChange={(e) => setIsGroupMode(e.target.checked)} />
                <label htmlFor="groupMode" className="text-sm">Créer un groupe</label>
              </div>
              {isGroupMode && (
                <div className="space-y-2">
                  <Input placeholder="Nom du groupe" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                </div>
              )}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              {isUsersLoading ? (
                <div className="flex items-center justify-center py-10">
                  <LoadingSpinner text="Recherche des membres..." />
                </div>
              ) : isUsersError ? (
                <div className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-destructive">
                  Impossible de charger les membres. Vérifiez que vous êtes bien connecté.
                </div>
              ) : recipients.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                  Aucun membre trouvé.
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {recipients.map((user) => (
                    isGroupMode ? (
                      <label key={user.id} className="w-full rounded-lg border p-3 flex items-center gap-3 text-left transition hover:bg-muted/70 cursor-pointer">
                        <input type="checkbox" className="mr-2" checked={selectedMembers.includes(user.id)} onChange={() => handleToggleMember(user.id)} />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
                          <AvatarFallback className="bg-[#2563EB] text-white text-sm">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </label>
                    ) : (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleStartConversation(user.id)}
                        className="w-full rounded-lg border p-3 text-left transition hover:bg-muted/70"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
                            <AvatarFallback className="bg-[#2563EB] text-white text-sm">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </button>
                    )
                  ))}
                </div>
              )}
              {isGroupMode && (
                <div className="flex justify-end">
                  <Button size="sm" variant="default" onClick={handleCreateGroup} disabled={selectedMembers.length === 0}>
                    Créer le groupe
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner text="Chargement..." />
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <div className="flex-1 p-4 text-center text-sm text-muted-foreground">
          Aucune conversation
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="space-y-0.5 p-2">
            {filter !== 'private' && Array.isArray(groupConversations) && groupConversations.length > 0 && (
              <div className="space-y-0.5">
                <p className="px-3 text-xs text-muted-foreground">Groupes</p>
                {groupConversations.map((g: any) => {
                  const groupLastMessage = g.messages?.[0] ?? g.last_message;

                  return (
                    <button
                      key={`group-${g.id}`}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                        (g.id === (props.activeConversationId ?? -1)) ? 'bg-[#2563EB]/10 border border-[#2563EB]/20' : 'hover:bg-muted/50'
                      )}
                      onClick={() => props.onSelectGroup?.(g.id, g.group_name)}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[#6B7280] text-white text-sm">
                            {g.group_name?.slice(0,2) ?? 'GR'}
                          </AvatarFallback>
                        </Avatar>
                        {g.unread_count > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-[#ef4444] text-white border-2 border-white">
                            {g.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn('text-sm font-medium truncate')}>
                            {g.group_name} <Badge className="ml-2">Groupe</Badge>
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {groupLastMessage ? formatRelative(groupLastMessage.created_at) : 'date invalide'}
                          </span>
                        </div>
                        <p className={cn('text-xs truncate', g.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                          {truncateText(groupLastMessage?.content ?? '', 40)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {filter !== 'groups' && conversations.map((conversation: Conversation) => {
              const isActive = conversation.user.id === activeUserId;
              const { user, last_message, unread_count } = conversation;

              return (
                <button
                  key={user.id}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    isActive ? 'bg-[#2563EB]/10 border border-[#2563EB]/20' : 'hover:bg-muted/50'
                  )}
                  onClick={() => onSelectConversation(user.id)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
                      <AvatarFallback className="bg-[#2563EB] text-white text-sm">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {unread_count > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-[#ef4444] text-white border-2 border-white">
                        {unread_count}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm font-medium truncate', isActive && 'text-[#2563EB]')}>
                        {user.full_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {formatRelative(last_message.created_at)}
                      </span>
                    </div>
                    <p className={cn(
                      'text-xs truncate',
                      unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}>
                      {truncateText(last_message.content ?? '', 40)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
