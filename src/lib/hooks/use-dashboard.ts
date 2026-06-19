import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';

// ── Role dashboards ──────────────────────────────────────────────────────────

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.getAdminStats(),
    staleTime: 0, // toujours refetch (pas de cache côté backend)
    refetchOnWindowFocus: true,
  });
}

export function useTeamLeadDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'team-lead'],
    queryFn: () => dashboardApi.getTeamLeadStats(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useResearcherDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'researcher'],
    queryFn: () => dashboardApi.getResearcherStats(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useInstitutionDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'institution'],
    queryFn: () => dashboardApi.getInstitutionStats(),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Charts ───────────────────────────────────────────────────────────────────

export function useProductivity(period: 'week' | 'month' | 'quarter' = 'month') {
  return useQuery({
    queryKey: ['stats', 'productivity', period],
    queryFn: () => dashboardApi.getProductivity(period),
    staleTime: 0,
  });
}

export function useTasksByStatus(projectId?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['stats', 'tasks-by-status', projectId],
    queryFn: () => dashboardApi.getTasksByStatus(projectId),
    staleTime: 0,
    enabled: options?.enabled ?? true,
  });
}

export function useActivityHeatmap(weeks = 12) {
  return useQuery({
    queryKey: ['stats', 'heatmap', weeks],
    queryFn: () => dashboardApi.getActivityHeatmap(weeks),
    staleTime: 0,
  });
}

export function usePublicationsTrend(months = 12) {
  return useQuery({
    queryKey: ['stats', 'publications', months],
    queryFn: () => dashboardApi.getPublicationsTrend(months),
    staleTime: 0,
  });
}

export function useBudgetByProject() {
  return useQuery({
    queryKey: ['stats', 'budget'],
    queryFn: () => dashboardApi.getBudgetByProject(),
    staleTime: 0,
  });
}

export function useHealthScore() {
  return useQuery({
    queryKey: ['stats', 'health'],
    queryFn: () => dashboardApi.getHealthScore(),
    staleTime: 0,
  });
}

// ── Activity feed (infinite scroll) ──────────────────────────────────────────

export function useActivityFeed(filters?: {
  user_id?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['stats', 'activity-feed', filters],
    queryFn: ({ pageParam = 1 }) =>
      dashboardApi.getActivityFeed({ ...filters, page: pageParam as number }),
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 0,
    refetchInterval: 30 * 1000, // rafraîchissement automatique toutes les 30s
  });
}
