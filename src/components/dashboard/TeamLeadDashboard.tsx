'use client';
import {
  FolderKanban, ClipboardCheck, AlertTriangle, FileText, DollarSign, Calendar,
} from 'lucide-react';
import { KpiGrid } from './kpis/KpiGrid';
import { TaskStatusDonut } from './charts/TaskStatusDonut';
import { WorkloadBarChart } from './charts/WorkloadBarChart';
import { GanttMilestones } from './charts/GanttMilestones';
import { BudgetAlertWidget } from './widgets/BudgetAlertWidget';
import { TasksToValidate } from './widgets/TasksToValidate';
import { UpcomingMeeting } from './widgets/UpcomingMeeting';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useTeamLeadDashboard } from '@/lib/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils/format';

export function TeamLeadDashboard() {
  const { data, isLoading } = useTeamLeadDashboard();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner text="Chargement…" size="lg" /></div>;
  }

  const kpis = data?.kpis;

  const kpiItems = kpis ? [
    {
      icon: FolderKanban,
      label: 'Mes projets',
      value: kpis.projects_count,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-50',
    },
    {
      icon: ClipboardCheck,
      label: 'Tâches à valider',
      value: kpis.tasks_to_validate,
      iconColor: kpis.tasks_to_validate > 0 ? 'text-amber-600' : 'text-emerald-600',
      iconBgColor: kpis.tasks_to_validate > 0 ? 'bg-amber-50' : 'bg-emerald-50',
      alert: kpis.tasks_to_validate > 0,
    },
    {
      icon: AlertTriangle,
      label: 'Tâches en retard',
      value: kpis.overdue_tasks,
      iconColor: kpis.overdue_tasks > 0 ? 'text-red-600' : 'text-emerald-600',
      iconBgColor: kpis.overdue_tasks > 0 ? 'bg-red-50' : 'bg-emerald-50',
      alert: kpis.overdue_tasks > 0,
    },
    {
      icon: FileText,
      label: 'Publications',
      value: kpis.publications_pending,
      iconColor: 'text-violet-600',
      iconBgColor: 'bg-violet-50',
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <KpiGrid items={kpiItems} cols={4} />

      {/* Row 1 : Tâches à valider + Réunion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TasksToValidate count={kpis?.tasks_to_validate ?? 0} />
        </div>
        <UpcomingMeeting />
      </div>

      {/* Row 2 : Donut + Charge travail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskStatusDonut
          title="Statuts des tâches (mes projets)"
          preloadedData={data?.tasks_by_status}
        />
        <WorkloadBarChart data={data?.workload ?? []} isLoading={isLoading} />
      </div>

      {/* Row 3 : Jalons + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GanttMilestones data={data?.milestones ?? []} isLoading={isLoading} />
        </div>
        {kpis && (
          <BudgetAlertWidget
            allocated={kpis.budget.allocated}
            spent={kpis.budget.spent}
          />
        )}
      </div>
    </div>
  );
}
