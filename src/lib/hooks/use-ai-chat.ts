import { useState, useCallback, useEffect, useRef } from 'react';
import { aiApi, AiConversation, AiMessageResponse, AiMemoryItem, AiSource } from '@/lib/api/ai';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  reasoning?: string | null;
  confidence_score?: number | null;
  sources?: AiSource[] | null;
  advisor_insights?: string | null;
  is_clarification?: boolean;
  clarification_question?: string | null;
  timestamp: Date;
}

interface UseAiChatOptions {
  projectId?: number;
  autoLoadConversations?: boolean;
}

export function useAiChat(options: UseAiChatOptions = {}) {
  const { projectId, autoLoadConversations = true } = options;
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  // ─── Conversations State ────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  // ─── Messages State ─────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // ─── Settings State ─────────────────────────────────────────────────────────
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  // ─── Memory State ───────────────────────────────────────────────────────────
  const [memoryItems, setMemoryItems] = useState<AiMemoryItem[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(false);

  // ─── Memory Notifications ──────────────────────────────────────────────────
  const [memoryNotifications, setMemoryNotifications] = useState<string[]>([]);

  // ─── Thinking stage ────────────────────────────────────────────────────────
  const [thinkingStage, setThinkingStage] = useState<string>('');

  const hasFetchedConversations = useRef(false);

  // ─── Fetch all conversations ────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const data = await aiApi.getConversations();
      setConversations(data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoadConversations && !hasFetchedConversations.current && isAuthenticated && !authLoading) {
      hasFetchedConversations.current = true;
      fetchConversations();
    }
  }, [autoLoadConversations, fetchConversations, isAuthenticated, authLoading]);

  // ─── Load messages for a conversation ───────────────────────────────────────
  const loadConversation = useCallback(async (conversationId: number) => {
    setActiveConversationId(conversationId);
    setMessagesLoading(true);
    try {
      const data = await aiApi.getMessages(conversationId);
      const mapped: ChatMessage[] = data.messages.map((m: AiMessageResponse) => ({
        id: `db-${m.id}`,
        sender: m.role,
        text: m.content,
        reasoning: m.reasoning,
        confidence_score: m.confidence_score,
        sources: m.sources,
        advisor_insights: m.metadata?.advisor_insights || null,
        is_clarification: m.is_clarification,
        clarification_question: m.clarification_question,
        timestamp: new Date(m.created_at),
      }));
      setMessages(mapped);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // ─── Create a new conversation ──────────────────────────────────────────────
  const createConversation = useCallback(async (title?: string) => {
    try {
      const data = await aiApi.createConversation(title, projectId);
      const newConv = data.conversation;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
      return newConv;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  }, [projectId]);

  // ─── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      let conversationId = activeConversationId;

      // Auto-create conversation if none is active
      if (!conversationId) {
        const newConv = await createConversation();
        if (!newConv) return;
        conversationId = newConv.id;
      }

      // Add user message immediately (optimistic)
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Simulate thinking stages
      setThinkingStage('Analyse de la demande…');
      const stageTimer1 = setTimeout(() => setThinkingStage('Recherche dans CollabSearch…'), 1200);
      const stageTimer2 = setTimeout(
        () => setThinkingStage(webSearchEnabled ? 'Recherche web…' : 'Construction de la réponse…'),
        2500
      );
      const stageTimer3 = setTimeout(() => setThinkingStage('Vérification et auto-évaluation…'), 4000);

      try {
        const data = await aiApi.sendMessageInConversation(
          conversationId,
          text,
          projectId,
          webSearchEnabled
        );

        const msg = data.message;
        const assistantMsg: ChatMessage = {
          id: `db-${msg.id}`,
          sender: 'assistant',
          text: msg.content,
          reasoning: msg.reasoning,
          confidence_score: msg.confidence_score,
          sources: msg.sources,
          advisor_insights: msg.metadata?.advisor_insights || null,
          is_clarification: msg.is_clarification,
          clarification_question: msg.clarification_question,
          timestamp: new Date(msg.created_at),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Handle memory notifications
        if (data.memory_notifications && data.memory_notifications.length > 0) {
          setMemoryNotifications(data.memory_notifications);
          // Auto-clear after 5s
          setTimeout(() => setMemoryNotifications([]), 5000);
        }

        fetchConversations();
      } catch (err: any) {
        const errorMsg: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: "Désolé, j'ai rencontré une erreur lors du traitement de votre demande. Veuillez vérifier votre connexion ou réessayer plus tard.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        setIsLoading(false);
        setThinkingStage('');
      }
    },
    [activeConversationId, projectId, webSearchEnabled, createConversation, fetchConversations]
  );

  // ─── Archive conversation ──────────────────────────────────────────────────
  const archiveConversation = useCallback(async (id: number) => {
    try {
      await aiApi.archiveConversation(id);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: c.status === 'archived' ? 'active' : 'archived' } : c
        )
      );
    } catch (err) {
      console.error('Failed to archive conversation:', err);
    }
  }, []);

  // ─── Delete conversation ───────────────────────────────────────────────────
  const deleteConversation = useCallback(async (id: number) => {
    try {
      await aiApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [activeConversationId]);

  // ─── Export conversation ───────────────────────────────────────────────────
  const exportConversation = useCallback(async (format: 'markdown' | 'json' = 'markdown') => {
    if (!activeConversationId) return;
    try {
      const data = await aiApi.exportConversation(activeConversationId, format);
      // Trigger download
      const blob = new Blob([data.content], { type: data.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export conversation:', err);
    }
  }, [activeConversationId]);

  // ─── Memory management ────────────────────────────────────────────────────
  const fetchMemory = useCallback(async () => {
    setMemoryLoading(true);
    try {
      const data = await aiApi.getMemory();
      setMemoryItems(data.memory);
    } catch (err) {
      console.error('Failed to load memory:', err);
    } finally {
      setMemoryLoading(false);
    }
  }, []);

  const deleteMemoryItem = useCallback(async (id: number) => {
    try {
      await aiApi.deleteMemory(id);
      setMemoryItems((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete memory item:', err);
    }
  }, []);

  // ─── Start new chat ────────────────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  return {
    // Conversations
    conversations,
    conversationsLoading,
    activeConversationId,
    fetchConversations,
    loadConversation,
    createConversation,
    archiveConversation,
    deleteConversation,
    startNewChat,
    exportConversation,

    // Messages
    messages,
    isLoading,
    messagesLoading,
    sendMessage,
    thinkingStage,

    // Settings
    webSearchEnabled,
    setWebSearchEnabled,

    // Memory
    memoryItems,
    memoryLoading,
    fetchMemory,
    deleteMemoryItem,
    memoryNotifications,
  };
}
