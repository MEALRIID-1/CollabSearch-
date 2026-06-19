// Constantes de l'application CollabSearch

export const APP_NAME = 'CollabSearch';
export const APP_DESCRIPTION = 'Plateforme de gestion d\'équipes de recherche scientifique';

// Rôles utilisateur
export const USER_ROLES = {
  administrator: {
    label: 'Administrateur',
    color: '#ef4444',
    bgColor: 'bg-red-100 text-red-800',
  },
  team_lead: {
    label: 'Chef d\'équipe',
    color: '#2563eb',
    bgColor: 'bg-blue-100 text-blue-800',
  },
  researcher: {
    label: 'Chercheur',
    color: '#10b981',
    bgColor: 'bg-emerald-100 text-emerald-800',
  },
  institution: {
    label: 'Institution',
    color: '#8b5cf6',
    bgColor: 'bg-violet-100 text-violet-800',
  },
} as const;

// Statuts de projet
export const PROJECT_STATUSES = {
  draft: { label: 'Brouillon', color: '#94a3b8', bgColor: 'bg-slate-100 text-slate-800' },
  submitted: { label: 'Soumis', color: '#f59e0b', bgColor: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approuvé', color: '#10b981', bgColor: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejeté', color: '#ef4444', bgColor: 'bg-red-100 text-red-800' },
  active: { label: 'Actif', color: '#2563eb', bgColor: 'bg-blue-100 text-blue-800' },
  archived: { label: 'Archivé', color: '#6b7280', bgColor: 'bg-gray-100 text-gray-800' },
} as const;

// Colonnes Kanban
export const KANBAN_COLUMNS = {
  todo:        { label: 'À faire',  color: '#94a3b8', bgColor: 'bg-slate-50' },
  in_progress: { label: 'En cours', color: '#3b82f6', bgColor: 'bg-blue-50' },
  submitted:   { label: 'Soumis',   color: '#f59e0b', bgColor: 'bg-amber-50' },
  validated:   { label: 'Validé',   color: '#10b981', bgColor: 'bg-emerald-50' },
  refused:     { label: 'Refusé',   color: '#ef4444', bgColor: 'bg-red-50' },
} as const;

// Priorités de tâche
export const TASK_PRIORITIES = {
  low: { label: 'Basse', color: '#94a3b8', bgColor: 'bg-slate-100 text-slate-800' },
  medium: { label: 'Moyenne', color: '#f59e0b', bgColor: 'bg-amber-100 text-amber-800' },
  high: { label: 'Haute', color: '#f97316', bgColor: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: '#ef4444', bgColor: 'bg-red-100 text-red-800' },
} as const;

// Types de publication
export const PUBLICATION_TYPES = {
  article: { label: 'Article', color: '#2563eb', bgColor: 'bg-blue-100 text-blue-800' },
  conference: { label: 'Conférence', color: '#8b5cf6', bgColor: 'bg-violet-100 text-violet-800' },
  these: { label: 'Thèse', color: '#10b981', bgColor: 'bg-emerald-100 text-emerald-800' },
  rapport: { label: 'Rapport', color: '#f59e0b', bgColor: 'bg-amber-100 text-amber-800' },
  livre: { label: 'Livre', color: '#ef4444', bgColor: 'bg-red-100 text-red-800' },
} as const;

// Catégories budgétaires
export const BUDGET_CATEGORIES = {
  personnel: { label: 'Personnel', color: '#2563eb', bgColor: 'bg-blue-100' },
  materiel: { label: 'Matériel', color: '#10b981', bgColor: 'bg-emerald-100' },
  mission: { label: 'Mission', color: '#f59e0b', bgColor: 'bg-amber-100' },
  publication: { label: 'Publication', color: '#8b5cf6', bgColor: 'bg-violet-100' },
  autre: { label: 'Autre', color: '#94a3b8', bgColor: 'bg-slate-100' },
} as const;

// Statuts de réunion
export const MEETING_STATUSES = {
  scheduled: { label: 'Planifiée', color: '#2563eb', bgColor: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'En cours', color: '#10b981', bgColor: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Terminée', color: '#6b7280', bgColor: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Annulée', color: '#ef4444', bgColor: 'bg-red-100 text-red-800' },
} as const;

// Seuil d'alerte budgétaire
export const BUDGET_ALERT_THRESHOLD = 80;

// Durée de cache en minutes
export const CACHE_DURATION = 5;

// Routes de l'API
export const API_ROUTES = {
  // Auth
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH: '/api/v1/auth/refresh',
  ME: '/api/v1/auth/me',
  UPDATE_PROFILE: '/api/v1/auth/profile',
  CHANGE_PASSWORD: '/api/v1/auth/change-password',

  // Projects
  PROJECTS: '/api/v1/projects',
  PROJECT_MEMBERS: (id: number) => `/api/v1/projects/${id}/members`,
  PROJECT_MILESTONES: (id: number) => `/api/v1/projects/${id}/milestones`,
  PROJECT_SUBMIT: (id: number) => `/api/v1/projects/${id}/submit`,
  PROJECT_APPROVE: (id: number) => `/api/v1/projects/${id}/approve`,
  PROJECT_REJECT: (id: number) => `/api/v1/projects/${id}/reject`,
  PROJECT_ARCHIVE: (id: number) => `/api/v1/projects/${id}/archive`,

  // Tasks
  TASKS: '/api/v1/tasks',
  PROJECT_TASKS: (projectId: number) => `/api/v1/projects/${projectId}/tasks`,
  TASK_UPDATE_STATUS: (id: number) => `/api/v1/tasks/${id}/status`,
  TASK_ASSIGN: (id: number) => `/api/v1/tasks/${id}/assign`,
  TASK_VALIDATE: (id: number) => `/api/v1/tasks/${id}/validate`,
  TASK_COMMENTS: (taskId: number) => `/api/v1/tasks/${taskId}/comments`,
  TASK_ATTACHMENTS: (taskId: number) => `/api/v1/tasks/${taskId}/attachments`,

  // Publications
  PUBLICATIONS: '/api/v1/publications',
  PUBLICATION_SEARCH: '/api/v1/publications/search',
  PUBLICATION_EXPORT_BIBTEX: '/api/v1/publications/export/bibtex',
  PUBLICATION_EXPORT_APA: '/api/v1/publications/export/apa',

  // Budget
  BUDGET_LINES: '/api/v1/budget-lines',
  PROJECT_BUDGET_LINES: (projectId: number) => `/api/v1/projects/${projectId}/budget-lines`,
  PROJECT_BUDGET: (projectId: number) => `/api/v1/projects/${projectId}/budget`,
  PROJECT_BUDGET_SUMMARY: (projectId: number) => `/api/v1/projects/${projectId}/budget-lines/summary`,
  PROJECT_BUDGET_ALERT: (projectId: number) => `/api/v1/projects/${projectId}/budget-lines/alert`,
  PROJECT_BUDGET_EXPORT: (projectId: number) => `/api/v1/projects/${projectId}/budget/export`,

  // Meetings
  MEETINGS: '/api/v1/meetings',
  MEETING_INVITE: (id: number) => `/api/v1/meetings/${id}/invite`,
  MEETING_ACCEPT: (id: number) => `/api/v1/meetings/${id}/accept`,
  MEETING_DECLINE: (id: number) => `/api/v1/meetings/${id}/decline`,
  MEETING_CALENDAR: '/api/v1/meetings/calendar',

  // Messages
  MESSAGES_SEND: '/api/v1/messages',
  MESSAGES_CONVERSATION: (userId: number) => `/api/v1/messages/conversation/${userId}`,
  MESSAGES_CONVERSATIONS: '/api/v1/messages/conversations',

  // Notifications
  NOTIFICATIONS: '/api/v1/notifications',
  NOTIFICATION_MARK_READ: (id: number) => `/api/v1/notifications/${id}/read`,
  NOTIFICATION_MARK_ALL_READ: '/api/v1/notifications/read-all',
  NOTIFICATION_UNREAD_COUNT: '/api/v1/notifications/unread-count',

  // Users
  USERS: '/api/v1/users',

  // Admin
  ADMIN_DASHBOARD: '/api/v1/admin/dashboard',
  ADMIN_USERS: '/api/v1/admin/users',
  ADMIN_STATS: '/api/v1/admin/stats',

  // Reports
  REPORT_PROJECT: (projectId: number) => `/api/v1/reports/project/${projectId}`,
  REPORT_TEAM: '/api/v1/reports/team',
  REPORT_BUDGET: (projectId: number) => `/api/v1/reports/budget/${projectId}`,
} as const;
