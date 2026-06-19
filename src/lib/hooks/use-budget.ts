import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '@/lib/api/budget';
import type { CreateBudgetLineRequest } from '@/types/api';

export function useBudgetLines(projectId: number, params?: { category?: string }) {
  return useQuery({
    queryKey: ['budget-lines', projectId, params],
    queryFn: () => budgetApi.getLines(projectId, params),
    enabled: !!projectId,
  });
}

export function useBudgetSummary(projectId: number) {
  return useQuery({
    queryKey: ['budget-summary', projectId],
    queryFn: () => budgetApi.getSummary(projectId),
    enabled: !!projectId,
  });
}

export function useBudgetAlert(projectId: number) {
  return useQuery({
    queryKey: ['budget-alert', projectId],
    queryFn: () => budgetApi.checkAlert(projectId),
    enabled: !!projectId,
  });
}

export function useCreateBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: CreateBudgetLineRequest }) =>
      budgetApi.createLine(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['budget-lines', projectId],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ['budget-summary', projectId] });
    },
  });
}

export function useUpdateBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateBudgetLineRequest> }) =>
      budgetApi.updateLine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['budget-lines'],
        exact: false,
      });
      queryClient.invalidateQueries({ 
        queryKey: ['budget-summary'],
        exact: false,
      });
    },
  });
}

export function useDeleteBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetApi.deleteLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['budget-lines'],
        exact: false,
      });
      queryClient.invalidateQueries({ 
        queryKey: ['budget-summary'],
        exact: false,
      });
    },
  });
}
