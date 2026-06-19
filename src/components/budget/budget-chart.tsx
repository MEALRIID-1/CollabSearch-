'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BUDGET_CATEGORIES } from '@/lib/utils/constants';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { useBudgetSummary } from '@/lib/hooks/use-budget';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { BudgetCategory } from '@/types/models';

interface BudgetChartProps {
  projectId: number;
}

export function BudgetChart({ projectId }: BudgetChartProps) {
  const { data: summary, isLoading } = useBudgetSummary(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSpinner text="Chargement du graphique..." />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const chartData = Object.entries(summary.by_category)
    .filter(([, data]) => data.allocated > 0)
    .map(([key, data]) => ({
      name: BUDGET_CATEGORIES[key as BudgetCategory]?.label ?? key,
      value: data.allocated,
      spent: data.spent,
      remaining: data.remaining,
      percentage: data.percentage,
      color: BUDGET_CATEGORIES[key as BudgetCategory]?.color ?? '#94a3b8',
    }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[number] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border text-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-muted-foreground">
            Alloué : {formatCurrency(data.value)}
          </p>
          <p className="text-muted-foreground">
            Dépensé : {formatCurrency(data.spent)}
          </p>
          <p className="text-muted-foreground">
            Restant : {formatCurrency(data.remaining)}
          </p>
          <p className="font-medium mt-1">
            {formatPercentage(data.percentage)} utilisé
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
    if (!payload) return null;
    return (
      <div className="grid grid-cols-2 gap-2 mt-2">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <div className="min-w-0">
              <p className="font-medium truncate">{entry.name}</p>
              <p className="text-muted-foreground">
                {formatCurrency(entry.value)} · {formatPercentage(entry.percentage)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Répartition du budget</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <CustomLegend />
      </CardContent>
    </Card>
  );
}
