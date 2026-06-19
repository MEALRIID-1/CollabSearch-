// Types pour CollabSearch - Modèles de données

export type UserRole = 'administrator' | 'team_lead' | 'researcher' | 'institution';

export type ProjectStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'active' | 'archived';

export type TaskStatus = 'todo' | 'in_progress' | 'submitted' | 'validated' | 'refused';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type PublicationType = 'article' | 'conference' | 'these' | 'rapport' | 'livre';

export type BudgetCategory = 'personnel' | 'materiel' | 'mission' | 'publication' | 'autre';

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: number;
  full_name: string;
  initials: string;
  email: string;
  first_name: string;
  last_name: string;
  institution: string | null;
  specialty: string | null;
  orcid: string | null;
  avatar: string | null;
  is_active: boolean;
  deleted_at?: string | null;
  roles: UserRole[];
  custom_role?: {
    uuid: string;
    name: string;
    color: string;
    slug: string;
  } | null;
  /** Flat list of permission keys from the user's assigned custom role. */
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  status: ProjectStatus;
  start_date: string;
  end_date: string | null;
  budget_allocated: number;
  budget_used: number;
  lead_id: number;
  lead: User;
  reference: string | null;
  laboratory: string | null;
  funding_source: string | null;
  keywords: string[];
  members: User[];
  milestones: Milestone[];
  tasks_count: number;
  publications_count: number;
  budget_percentage: number;
  is_budget_alert: boolean;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: number | null;
  assignee: User | null;
  milestone_id: number | null;
  comments: TaskComment[];
  attachments: Attachment[];
  /** Vrai si l'utilisateur connecté est administrateur ou chef d'équipe (calculé côté backend). */
  can_review?: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  user: User;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
}

export interface Publication {
  id: number;
  title: string;
  authors: string;
  type: PublicationType;
  journal: string | null;
  conference: string | null;
  year: number;
  doi: string | null;
  abstract: string;
  keywords: string[];
  file_path: string | null;
  pdf_path?: string | null;
  project_id: number | null;
  project: Project | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetLine {
  id: number;
  project_id: number;
  category: BudgetCategory;
  description: string;
  amount_planned: number;
  amount_spent: number;
  amount_remaining: number;
  consumption_percentage: number;
  is_alert: boolean;
  is_over_budget: boolean;
  date: string;
  justification: string | null;
  reference_document: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetSummary {
  total_allocated: number;
  total_spent: number;
  remaining: number;
  percentage_used: number;
  alert: boolean;
  by_category: Record<BudgetCategory, {
    allocated: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
}

export interface MeetingParticipant {
  id: number;
  full_name: string;
  email: string;
  avatar: string | null;
  pivot_status: 'pending' | 'accepted' | 'declined';
}

export interface Meeting {
  id: number;
  title: string;
  description: string;
  date: string;
  end_date: string;
  location: string | null;
  link: string | null;
  is_online: boolean;
  status: MeetingStatus;
  organizer_id: number;
  organizer: User;
  participants: MeetingParticipant[];
  recording_url?: string | null;
  recording_transcript?: string | null;
  meeting_summary?: string | null;
  started_at?: string | null;
  actual_duration_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  sender: User;
  recipient_id: number;
  recipient: User;
  content: string | null;
  is_read: boolean;
  read_at: string | null;
  attachments?: MessageAttachment[];
  created_at: string;
}

export interface MessageAttachment {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  media_type: 'image' | 'file' | 'voice' | 'video' | 'link';
  size: number;
  url: string;
  link_url?: string;
  is_encrypted?: boolean;
  created_at: string;
}

export interface ChatReaction {
  id: number;
  message_id: number;
  emoji: string;
  user_id: number;
  user: User;
}

export interface ChatMessage {
  id: number;
  uuid: string;
  channel_id: number;
  sender_id: number;
  sender: User;
  parent_id?: number | null;
  body: string | null;
  type: 'text' | 'file' | 'system';
  is_edited: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  reactions?: ChatReaction[];
  created_at: string;
}

export interface ChatChannel {
  id: number;
  uuid: string;
  project_id: number | null;
  name: string;
  description: string | null;
  type: 'project_general' | 'topic' | 'direct';
  is_archived: boolean;
  created_by: number;
  creator: User;
  members: User[];
  messages_count?: number;
  messages?: ChatMessage[];
  updated_at: string;
  created_at: string;
}

export interface Conversation {
  user: User;
  last_message: Message;
  unread_count: number;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user: User;
  action: string;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  created_at: string;
}

// ── Roles & Permissions ────────────────────────────────────────────────────

export interface PermissionItem {
  key: string;
  label: string;
  granted: boolean;
}

export interface PermissionCatalogModule {
  module: string;
  label: string;
  icon: string;
  permissions: Omit<PermissionItem, 'granted'>[];
}

export interface CustomRole {
  uuid: string;
  name: string;
  color: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissionsCount: number;
  usersCount: number;
}

export interface CustomRoleDetail extends CustomRole {
  permissionKeys: string[];
  permissionsByModule: (PermissionCatalogModule & {
    permissions: Omit<PermissionItem, 'granted'>[];
  })[];
  users: {
    uuid: string;
    name: string;
    email: string;
    avatarPath: string | null;
  }[];
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  total_publications: number;
  total_budget_allocated: number;
  total_budget_spent: number;
  upcoming_meetings: number;
  unread_notifications: number;
}

// ── Dashboard Role-specific Types ─────────────────────────────────────

export interface AdminKPIs {
  users: { total: number; active: number; inactive: number };
  projects: { total: number; active: number; pending: number; archived: number };
  tasks: { pending: number; created_this_month: number; completed_this_month: number; overdue: number };
  publications: { total: number; submitted_month: number };
  budget: { allocated: number; spent: number };
  completion_rate: number;
  meetings_this_week: number;
}

export interface HealthScore {
  score: number;
  on_time_rate: number;
  budget_rate: number;
  pub_rate: number;
}

export interface AdminDashboardData {
  kpis: AdminKPIs;
  health: HealthScore;
}

export interface TeamLeadKPIs {
  projects_count: number;
  tasks_to_validate: number;
  overdue_tasks: number;
  publications_pending: number;
  next_meeting: Record<string, unknown> | null;
  budget: { allocated: number; spent: number };
}

export interface WorkloadEntry {
  name: string;
  assigned: number;
  completed: number;
}

export interface MilestoneEntry {
  id: number;
  title: string;
  project: string | null;
  due: string;
  done: boolean;
}

export interface TeamLeadDashboardData {
  kpis: TeamLeadKPIs;
  workload: WorkloadEntry[];
  milestones: MilestoneEntry[];
}

export interface ResearcherKPIs {
  tasks: {
    total: number;
    todo: number;
    in_progress: number;
    overdue: number;
    completed_this_week: number;
  };
  publications: number;
  streak_days: number;
  projects_count: number;
}

export interface WeeklyTaskEntry {
  week: string;
  count: number;
}

export interface ResearcherDashboardData {
  kpis: ResearcherKPIs;
  weekly_tasks: WeeklyTaskEntry[];
}

export interface InstitutionKPIs {
  projects: { active: number; pending: number; total: number };
  publications_total: number;
  budget: { allocated: number; spent: number };
  users_total: number;
}

export interface InstitutionDashboardData {
  kpis: InstitutionKPIs;
  publications: { type: string; count: number }[];
  projects_trend: { month: string; submitted: number; approved: number }[];
  budget_projects: BudgetProjectEntry[];
}

export interface ProductivityEntry {
  user_id: number;
  name: string;
  total: number;
}

export interface TaskStatusEntry {
  status: string;
  label: string;
  count: number;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface PublicationTrendEntry {
  month: string;
  count: number;
}

export interface BudgetProjectEntry {
  id: number;
  title: string;
  allocated: number;
  spent: number;
  over: number;
}

export interface ActivityLogEntry {
  id: number;
  user: { id: number; full_name: string; avatar: string | null };
  action: string;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  created_at: string;
}
