// Types API pour CollabSearch

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface PaginatedResponseWithConversation<T> extends PaginatedResponse<T> {
  conversation_with?: import('./models').User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  institution?: string;
}

export interface AuthResponse {
  user: import('./models').User;
  token: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  budget_allocated: number;
  members?: number[];
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget_allocated?: number;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: import('./models').TaskPriority;
  due_date?: string;
  assignee_id?: number;
  milestone_id?: number;
  project_id?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: import('./models').TaskStatus;
  priority?: import('./models').TaskPriority;
  due_date?: string;
  assignee_id?: number;
}

export interface CreatePublicationRequest {
  title: string;
  authors: string;
  type: import('./models').PublicationType;
  journal?: string;
  conference?: string;
  year: number;
  doi?: string;
  abstract: string;
  keywords?: string[];
  project_id?: number;
  file?: File;
}

export interface CreateBudgetLineRequest {
  category: import('./models').BudgetCategory;
  description: string;
  amount_planned: number;
  amount_spent?: number;
  date: string;
  justification?: string;
}

export interface CreateMeetingRequest {
  title: string;
  description: string;
  date: string;
  end_date: string;
  location?: string;
  link?: string;
  participants?: number[];
}

export interface SendMessageRequest {
  recipient_id: number;
  content?: string;
  attachment_ids?: number[];
}

export interface CreateChatChannelRequest {
  project_id?: number;
  name: string;
  description?: string;
  type: 'project_general' | 'topic' | 'direct';
  member_ids?: number[];
}

export interface SendChatMessageRequest {
  body?: string;
  type: 'text' | 'file' | 'system';
  parent_id?: number;
}

export interface AddChatReactionRequest {
  emoji: string;
}

export interface ReportParams {
  format?: 'pdf' | 'excel';
  date_from?: string;
  date_to?: string;
  project_id?: number;
}
