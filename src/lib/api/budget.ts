import apiClient from './client';
import { API_ROUTES } from '@/lib/utils/constants';
import type { BudgetLine, BudgetSummary } from '@/types/models';
import type { CreateBudgetLineRequest, PaginatedResponse } from '@/types/api';

export const budgetApi = {
  async getLines(projectId: number, params?: { category?: string; page?: number }): Promise<PaginatedResponse<BudgetLine>> {
    const response = await apiClient.get<{
      budget_lines: BudgetLine[];
      meta: PaginatedResponse<BudgetLine>['meta'];
      links: PaginatedResponse<BudgetLine>['links'];
    }>(API_ROUTES.PROJECT_BUDGET_LINES(projectId), { params });
    return {
      data: response.data.budget_lines,
      meta: response.data.meta,
      links: response.data.links,
    };
  },

  async getSummary(projectId: number): Promise<BudgetSummary> {
    const response = await apiClient.get<{
      summary: {
        total_planned: number;
        total_spent: number;
        total_remaining: number;
        consumption_percentage: number;
        budget_allocated: number;
        budget_used: number;
        budget_remaining: number;
        project_consumption_percentage: number;
        by_category: Array<{
          category: string;
          category_label: string;
          total_planned: number;
          total_spent: number;
          total_remaining: number;
          lines_count: number;
        }>;
      };
    }>(API_ROUTES.PROJECT_BUDGET_SUMMARY(projectId));
    
    const summary = response.data.summary;
    const byCategoryMap: Record<string, any> = {};
    
    // Transform backend category structure to frontend structure
    summary.by_category.forEach((cat) => {
      const percentage = cat.total_planned > 0 
        ? Math.round((cat.total_spent / cat.total_planned) * 100)
        : 0;
      byCategoryMap[cat.category] = {
        allocated: cat.total_planned,
        spent: cat.total_spent,
        remaining: cat.total_remaining,
        percentage,
      };
    });
    
    return {
      total_allocated: summary.budget_allocated,
      total_spent: summary.budget_used,
      remaining: summary.budget_remaining,
      percentage_used: summary.project_consumption_percentage,
      alert: summary.budget_used > summary.budget_allocated,
      by_category: byCategoryMap,
    };
  },

  async checkAlert(projectId: number): Promise<{ alert: boolean; percentage: number }> {
    const response = await apiClient.get<{ has_alerts: boolean; alerts: Array<{ category: string; percentage: number }> }>(API_ROUTES.PROJECT_BUDGET_ALERT(projectId));
    const alerts = response.data.alerts;
    const maxPercentage = alerts.length > 0 ? Math.max(...alerts.map(a => a.percentage)) : 0;
    return {
      alert: response.data.has_alerts,
      percentage: maxPercentage,
    };
  },

  async createLine(projectId: number, data: CreateBudgetLineRequest): Promise<BudgetLine> {
    const response = await apiClient.post<{ budget_line: BudgetLine; message: string }>(API_ROUTES.PROJECT_BUDGET_LINES(projectId), data);
    return response.data.budget_line;
  },

  async updateLine(id: number, data: Partial<CreateBudgetLineRequest>): Promise<BudgetLine> {
    const response = await apiClient.put<{ budget_line: BudgetLine; message: string }>(`/api/v1/budget-lines/${id}`, data);
    return response.data.budget_line;
  },

  async deleteLine(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/budget-lines/${id}`);
  },

  async export(projectId: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const response = await apiClient.get(API_ROUTES.PROJECT_BUDGET_EXPORT(projectId), {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};
