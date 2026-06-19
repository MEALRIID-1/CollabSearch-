'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBudgetSummary } from '@/lib/hooks/use-budget';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { AlertTriangle } from 'lucide-react';

interface BudgetGaugeProps {
  projectId: number;
}

export function BudgetGauge({ projectId }: BudgetGaugeProps) {
  const { data: summary, isLoading } = useBudgetSummary(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSpinner text="Chargement..." />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const percentage = summary.percentage_used;
  const gaugeColor =
    percentage < 60 ? '#10B981' : percentage < 80 ? '#f59e0b' : '#ef4444';
  const gaugeBgColor =
    percentage < 60 ? 'bg-emerald-500' : percentage < 80 ? 'bg-amber-500' : 'bg-red-500';
  const statusLabel =
    percentage < 60 ? 'Sain' : percentage < 80 ? 'Attention' : 'Critique';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Consommation du budget
          {summary.alert && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Circular gauge */}
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#e5e7eb"
                strokeWidth="10"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke={gaugeColor}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(percentage / 100) * 314} 314`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: gaugeColor }}>
                {formatPercentage(percentage, 0)}
              </span>
              <span className="text-xs text-muted-foreground">{statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Amount details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dépensé</span>
            <span className="font-medium" style={{ color: gaugeColor }}>
              {formatCurrency(summary.total_spent)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Alloué</span>
            <span className="font-medium">{formatCurrency(summary.total_allocated)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Restant</span>
            <span className={cn('font-medium', summary.remaining < 0 && 'text-red-600')}>
              {formatCurrency(summary.remaining)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
