import apiClient from './client';
import type {
  AdminDashboardData,
  TeamLeadDashboardData,
  ResearcherDashboardData,
  InstitutionDashboardData,
  ProductivityEntry,
  TaskStatusEntry,
  HeatmapEntry,
  PublicationTrendEntry,
  BudgetProjectEntry,
  HealthScore,
  ActivityLogEntry,
} from '@/types/models';
import type { PaginatedResponse } from '@/types/api';

export const dashboardApi = {
  // ── Role dashboards ────────────────────────────────────────────────────────
  async getAdminStats(): Promise<AdminDashboardData> {
    const r = await apiClient.get('/api/v1/dashboard/admin');
    return r.data;
  },

  async getTeamLeadStats(): Promise<TeamLeadDashboardData> {
    const r = await apiClient.get('/api/v1/dashboard/team-lead');
    return r.data;
  },

  async getResearcherStats(): Promise<ResearcherDashboardData> {
    const r = await apiClient.get('/api/v1/dashboard/researcher');
    return r.data;
  },

  async getInstitutionStats(): Promise<InstitutionDashboardData> {
    const r = await apiClient.get('/api/v1/dashboard/institution');
    return r.data;
  },

  // ── Chart data ─────────────────────────────────────────────────────────────
  async getProductivity(period: 'week' | 'month' | 'quarter' = 'month'): Promise<ProductivityEntry[]> {
    const r = await apiClient.get('/api/v1/stats/productivity', { params: { period } });
    return r.data.data ?? [];
  },

  async getTasksByStatus(projectId?: number): Promise<TaskStatusEntry[]> {
    const r = await apiClient.get('/api/v1/stats/tasks-by-status', { params: { project_id: projectId } });
    return r.data.data ?? [];
  },

  async getActivityHeatmap(weeks = 12): Promise<HeatmapEntry[]> {
    const r = await apiClient.get('/api/v1/stats/activity-heatmap', { params: { weeks } });
    return r.data.data ?? [];
  },

  async getPublicationsTrend(months = 12): Promise<PublicationTrendEntry[]> {
    const r = await apiClient.get('/api/v1/stats/publications', { params: { months } });
    return r.data.data ?? [];
  },

  async getBudgetByProject(): Promise<BudgetProjectEntry[]> {
    const r = await apiClient.get('/api/v1/stats/budget');
    return r.data.data ?? [];
  },

  async getHealthScore(): Promise<HealthScore> {
    const r = await apiClient.get('/api/v1/stats/health-score');
    return r.data;
  },

  async getActivityFeed(params?: {
    page?: number;
    user_id?: number;
    action?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }): Promise<{ data: ActivityLogEntry[]; meta: PaginatedResponse<unknown>['meta'] }> {
    const r = await apiClient.get('/api/v1/stats/activity-feed', { params });
    return { data: r.data.data ?? [], meta: r.data.meta };
  },
};
