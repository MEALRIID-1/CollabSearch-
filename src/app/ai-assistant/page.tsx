'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAiChat } from '@/lib/hooks/use-ai-chat';
import { AiChatMessage } from '@/components/ai/AiChatMessage';
import { AiMemoryPanel } from '@/components/ai/AiMemoryPanel';
import { AiThinkingIndicator } from '@/components/ai/AiThinkingIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  Archive,
  Trash2,
  Globe,
  GlobeOff,
  Search,
  PanelLeftClose,
  PanelLeft,
  Brain,
  Clock,
  Download,
  FileJson,
  FileText,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function AiAssistantPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [inputMessage, setInputMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'discussions' | 'memory'>('discussions');

  const { data: projectsData, isLoading: projectsLoading } = useProjects({ page: 1 });
  const projects = projectsData?.data ?? [];

  const {
    conversations,
    conversationsLoading,
    activeConversationId,
    loadConversation,
    archiveConversation,
    deleteConversation,
    startNewChat,
    exportConversation,
    messages,
    isLoading,
    messagesLoading,
    sendMessage,
    thinkingStage,
    webSearchEnabled,
    setWebSearchEnabled,
    memoryItems,
    memoryLoading,
    fetchMemory,
    deleteMemoryItem,
    memoryNotifications,
  } = useAiChat({ projectId: selectedProjectId, autoLoadConversations: true });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    const text = inputMessage;
    setInputMessage('');
    await sendMessage(text);
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const activeConversations = filteredConversations.filter((c) => c.status === 'active');
  const archivedConversations = filteredConversations.filter((c) => c.status === 'archived');

  const suggestions = selectedProjectId
    ? [
        'Fais-moi un résumé de ce projet.',
        'Quelles sont les tâches actives et qui doit les faire ?',
        'Y a-t-il des publications associées ?',
      ]
    : [
        'Comment rédiger une bonne méthodologie de recherche ?',
        'Quelles sont les meilleures pratiques pour organiser des tâches en Kanban ?',
        "Aide-moi à structurer mon abstract de thèse.",
      ];

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        {/* ═══════ Sidebar ═══════ */}
        <div
          className={cn(
            'flex flex-col border-r bg-gradient-to-b from-slate-50 to-white transition-all duration-300 ease-in-out shrink-0',
            sidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-r-0'
          )}
        >
          {/* Tab switcher */}
          <div className="flex border-b bg-white shrink-0">
            <button
              onClick={() => setSidebarTab('discussions')}
              className={cn(
                'flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5',
                sidebarTab === 'discussions'
                  ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/30'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Discussions
            </button>
            <button
              onClick={() => {
                setSidebarTab('memory');
                if (memoryItems.length === 0) fetchMemory();
              }}
              className={cn(
                'flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5',
                sidebarTab === 'memory'
                  ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/30'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Brain className="h-3.5 w-3.5" />
              Mémoire
            </button>
          </div>

          {/* Tab content */}
          {sidebarTab === 'discussions' ? (
            <>
              {/* Sidebar Header */}
              <div className="px-4 pt-3 pb-3 border-b bg-white/80 backdrop-blur-sm space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-500" />
                    Discussions
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={() => startNewChat()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs h-9 gap-1.5 shadow-md shadow-indigo-200/50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nouvelle discussion
                </Button>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-8 h-8 text-xs bg-gray-50 border-gray-200 focus-visible:ring-indigo-300"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 min-h-0 scrollbar-thin">
                {conversationsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <>
                    {activeConversations.length > 0 && (
                      <div className="space-y-0.5">
                        {activeConversations.map((conv) => (
                          <ConversationItem
                            key={conv.id}
                            title={conv.title}
                            updatedAt={conv.updated_at}
                            isActive={conv.id === activeConversationId}
                            topics={conv.context_metadata?.topics}
                            onClick={() => loadConversation(conv.id)}
                            onArchive={() => archiveConversation(conv.id)}
                            onDelete={() => deleteConversation(conv.id)}
                          />
                        ))}
                      </div>
                    )}

                    {archivedConversations.length > 0 && (
                      <div className="mt-4 space-y-0.5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                          <Archive className="h-3 w-3" />
                          Archivées
                        </p>
                        {archivedConversations.map((conv) => (
                          <ConversationItem
                            key={conv.id}
                            title={conv.title}
                            updatedAt={conv.updated_at}
                            isActive={conv.id === activeConversationId}
                            isArchived
                            onClick={() => loadConversation(conv.id)}
                            onArchive={() => archiveConversation(conv.id)}
                            onDelete={() => deleteConversation(conv.id)}
                          />
                        ))}
                      </div>
                    )}

                    {filteredConversations.length === 0 && (
                      <div className="text-center py-10 px-4">
                        <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">
                          {searchFilter ? 'Aucune discussion trouvée.' : 'Commencez en posant une question !'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            /* Memory Panel */
            <AiMemoryPanel
              items={memoryItems}
              loading={memoryLoading}
              onDelete={deleteMemoryItem}
              onLoad={fetchMemory}
            />
          )}
        </div>

        {/* ═══════ Main Chat Area ═══════ */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b bg-white shrink-0">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900">Assistant IA</h1>
                  <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Pipeline 10 étapes · Mode Conseiller
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Web Search Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={cn(
                  'text-xs h-8 gap-1.5',
                  webSearchEnabled
                    ? 'text-emerald-600 hover:bg-emerald-50'
                    : 'text-gray-400 hover:bg-gray-50'
                )}
              >
                {webSearchEnabled ? <Globe className="h-3.5 w-3.5" /> : <GlobeOff className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{webSearchEnabled ? 'Web ON' : 'Web OFF'}</span>
              </Button>

              {/* Export */}
              {activeConversationId && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportConversation('markdown')}
                    className="text-xs h-8 gap-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                    title="Exporter en Markdown"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">.md</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportConversation('json')}
                    className="text-xs h-8 gap-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                    title="Exporter en JSON"
                  >
                    <FileJson className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">.json</span>
                  </Button>
                </div>
              )}

              {/* Project Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap hidden md:inline">Projet :</span>
                {projectsLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Select
                    value={selectedProjectId ? String(selectedProjectId) : 'none'}
                    onValueChange={(val) => setSelectedProjectId(val === 'none' ? undefined : Number(val))}
                  >
                    <SelectTrigger className="w-44 text-xs h-8 bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Aucun (Général)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun projet (Général)</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Memory Notifications */}
          {memoryNotifications.length > 0 && (
            <div className="px-5 py-2 bg-gradient-to-r from-indigo-50 to-violet-50 border-b flex items-center gap-2 animate-in slide-in-from-top duration-300">
              <Bell className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <div className="flex flex-wrap gap-2">
                {memoryNotifications.map((n, idx) => (
                  <span key={idx} className="text-[11px] text-indigo-700 font-medium">{n}</span>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1 min-h-0 scrollbar-thin bg-gradient-to-b from-slate-50/50 to-white">
            {messagesLoading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : messages.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-500 shadow-lg shadow-indigo-100/50">
                    <Sparkles className="h-10 w-10" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Bonjour ! Comment puis-je vous aider ?
                </h3>
                <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
                  Je suis votre assistant IA CollabSearch avec un pipeline de raisonnement en 10 étapes,
                  détection d&apos;ambiguïté, mode conseiller, et mémoire persistante.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestion(s)}
                      className="text-left text-xs bg-white hover:bg-indigo-50/50 border border-gray-200 hover:border-indigo-300 text-gray-700 px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md group"
                    >
                      <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider block mb-1">
                        Suggestion
                      </span>
                      <span className="leading-relaxed">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <AiChatMessage
                    key={msg.id}
                    sender={msg.sender}
                    text={msg.text}
                    reasoning={msg.reasoning}
                    confidence_score={msg.confidence_score}
                    sources={msg.sources}
                    advisor_insights={msg.advisor_insights}
                    is_clarification={msg.is_clarification}
                    timestamp={msg.timestamp}
                  />
                ))}

                {isLoading && (
                  <AiThinkingIndicator
                    stage={thinkingStage}
                    webSearchEnabled={webSearchEnabled}
                  />
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="px-5 py-3 border-t bg-white flex gap-2 shrink-0">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                selectedProjectId
                  ? 'Posez une question sur ce projet…'
                  : 'Posez une question scientifique générale…'
              }
              disabled={isLoading}
              className="flex-1 focus-visible:ring-indigo-400 h-10 text-sm"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white h-10 px-5 shadow-md shadow-indigo-200/50"
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Conversation Item ────────────────────────────────────────────────────────

interface ConversationItemProps {
  title: string;
  updatedAt: string;
  isActive: boolean;
  isArchived?: boolean;
  topics?: string[];
  onClick: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function ConversationItem({
  title,
  updatedAt,
  isActive,
  isArchived = false,
  topics,
  onClick,
  onArchive,
  onDelete,
}: ConversationItemProps) {
  const [hovered, setHovered] = useState(false);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200',
        isActive
          ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
          : 'hover:bg-gray-50 border border-transparent',
        isArchived && 'opacity-60'
      )}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MessageSquare
        className={cn(
          'h-3.5 w-3.5 shrink-0',
          isActive ? 'text-indigo-500' : 'text-gray-400'
        )}
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', isActive ? 'text-indigo-900' : 'text-gray-700')}>
          {title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {timeAgo(updatedAt)}
          </p>
          {topics && topics.length > 0 && (
            <span className="text-[9px] text-indigo-400 truncate max-w-[100px]">
              · {topics.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </div>

      {hovered && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 animate-in fade-in duration-150">
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(); }}
            className="p-1 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
            title={isArchived ? 'Désarchiver' : 'Archiver'}
          >
            <Archive className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
