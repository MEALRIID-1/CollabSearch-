import apiClient from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AiAnalysisResponse {
  id: number;
  uuid: string;
  analysable_type: string;
  analysable_id: number;
  requested_by: number;
  type: 'meeting_summary' | 'publication_analysis' | 'keyword_extraction' | 'sentiment_analysis' | 'similarity_check';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input_tokens: number | null;
  output_tokens: number | null;
  model_used: string | null;
  result: Record<string, any> | null;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface AiConversation {
  id: number;
  user_id: number;
  project_id: number | null;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  context_summary: string | null;
  context_metadata: { topics?: string[]; message_count?: number; last_question?: string } | null;
  exported_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiSource {
  title: string;
  url: string;
}

export interface AiMessageResponse {
  id: number;
  ai_conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  reasoning: string | null;
  confidence_score: number | null;
  sources: AiSource[] | null;
  metadata: {
    advisor_insights?: string;
    memory_notifications?: string[];
  } | null;
  is_clarification: boolean;
  clarification_question: string | null;
  tokens_used: number | null;
  created_at: string;
  updated_at: string;
}

export interface AiMemoryItem {
  id: number;
  user_id: number;
  key: string;
  value: string;
  category: 'preference' | 'technology' | 'decision' | 'objective';
  created_at: string;
  updated_at: string;
}

export interface AiChatResponse {
  message: AiMessageResponse;
  memory_notifications: string[];
}

export interface AiExportResponse {
  content: string;
  filename: string;
  mime: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const aiApi = {
  // === Analysis ===

  async analyzeMeeting(meetingId: number, force = false): Promise<{ message: string; analysis: AiAnalysisResponse }> {
    const response = await apiClient.post(`/api/v1/meetings/${meetingId}/analyze`, { force });
    return response.data;
  },

  async analyzePublication(publicationId: number, force = false): Promise<{ message: string; analysis: AiAnalysisResponse }> {
    const response = await apiClient.post(`/api/v1/publications/${publicationId}/analyze`, { force });
    return response.data;
  },

  async getAnalysis(uuid: string): Promise<{ analysis: AiAnalysisResponse }> {
    const response = await apiClient.get(`/api/v1/ai/analyses/${uuid}`);
    return response.data;
  },

  // === Legacy chat (stateless) ===

  async chatAssistant(question: string, projectId?: number): Promise<{
    response: string;
    reasoning: string;
    confidence_score: number;
    sources: AiSource[];
    is_clarification: boolean;
    clarification_question: string | null;
    memory_notifications: string[];
  }> {
    const response = await apiClient.post('/api/v1/ai/chat', { question, project_id: projectId });
    return response.data;
  },

  // === Conversations ===

  async getConversations(): Promise<{ conversations: AiConversation[] }> {
    const response = await apiClient.get('/api/v1/ai/conversations');
    return response.data;
  },

  async createConversation(title?: string, projectId?: number): Promise<{ conversation: AiConversation }> {
    const response = await apiClient.post('/api/v1/ai/conversations', {
      title: title || 'Nouvelle discussion',
      project_id: projectId,
    });
    return response.data;
  },

  async archiveConversation(id: number): Promise<{ conversation: AiConversation; message: string }> {
    const response = await apiClient.put(`/api/v1/ai/conversations/${id}/archive`);
    return response.data;
  },

  async deleteConversation(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`/api/v1/ai/conversations/${id}`);
    return response.data;
  },

  async restoreConversation(id: number): Promise<{ conversation: AiConversation; message: string }> {
    const response = await apiClient.post(`/api/v1/ai/conversations/${id}/restore`);
    return response.data;
  },

  async exportConversation(id: number, format: 'markdown' | 'json' = 'markdown'): Promise<AiExportResponse> {
    const response = await apiClient.post(`/api/v1/ai/conversations/${id}/export`, { format });
    return response.data;
  },

  async getConversationSummary(id: number): Promise<{
    summary: string | null;
    context_metadata: Record<string, any> | null;
    message_count: number;
  }> {
    const response = await apiClient.get(`/api/v1/ai/conversations/${id}/summary`);
    return response.data;
  },

  // === Messages in a Conversation ===

  async getMessages(conversationId: number): Promise<{ messages: AiMessageResponse[] }> {
    const response = await apiClient.get(`/api/v1/ai/conversations/${conversationId}/messages`);
    return response.data;
  },

  async sendMessageInConversation(
    conversationId: number,
    question: string,
    projectId?: number,
    webSearchEnabled = true,
    currentPage?: string
  ): Promise<AiChatResponse> {
    const response = await apiClient.post(`/api/v1/ai/conversations/${conversationId}/chat`, {
      question,
      project_id: projectId,
      web_search_enabled: webSearchEnabled,
      current_page: currentPage ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    });
    return response.data;
  },

  // === Memory ===

  async getMemory(): Promise<{ memory: AiMemoryItem[] }> {
    const response = await apiClient.get('/api/v1/ai/memory');
    return response.data;
  },

  async saveMemory(
    key: string,
    value: string,
    category: 'preference' | 'technology' | 'decision' | 'objective'
  ): Promise<{ memory: AiMemoryItem; message: string }> {
    const response = await apiClient.post('/api/v1/ai/memory', { key, value, category });
    return response.data;
  },

  async deleteMemory(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/ai/memory/${id}`);
  },
};
