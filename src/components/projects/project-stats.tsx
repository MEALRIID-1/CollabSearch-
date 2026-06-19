'use client';

import { CheckCircle2, Clock, ListTodo, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils/format';
import { useKanban } from '@/lib/hooks/use-tasks';
import type { Project } from '@/types/models';

interface ProjectStatsProps {
  project: Project;
}

export function ProjectStats({ project }: ProjectStatsProps) {
  const { data: kanban } = useKanban(project.id);

  const validatedCount = kanban?.validated?.length ?? 0;
  const inProgressCount = kanban?.in_progress?.length ?? 0;
  const totalCount = kanban
    ? Object.values(kanban).reduce((sum, tasks) => sum + tasks.length, 0)
    : (project.tasks_count ?? 0);

  const progressPercent = totalCount > 0
    ? Math.round((validatedCount / totalCount) * 100)
    : 0;

  const stats = [
    {
      label: 'Total taches',
      value: totalCount,
      icon: ListTodo,
      color: 'text-[#2563EB]',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Validees',
      value: validatedCount,
      icon: CheckCircle2,
      color: 'text-[#10B981]',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'En cours',
      value: inProgressCount,
      icon: Clock,
      color: 'text-[#f59e0b]',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Budget utilise',
      value: formatCurrency(project.budget_used),
      icon: DollarSign,
      color: 'text-[#8b5cf6]',
      bgColor: 'bg-violet-50',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Barre de progression globale */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progression du projet</span>
            <span className="text-sm font-bold text-[#2563EB]">{progressPercent}%</span>
          </div>
          <Progress
            value={progressPercent}
            className="h-3 bg-gray-100"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            {validatedCount} tache{validatedCount > 1 ? 's' : ''} validee{validatedCount > 1 ? 's' : ''} sur {totalCount}
          </p>
        </CardContent>
      </Card>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
