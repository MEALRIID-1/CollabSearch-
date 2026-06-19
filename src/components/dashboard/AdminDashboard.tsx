'use client';
import {
  Users, FolderKanban, ListTodo, FileText, Calendar,
  DollarSign, TrendingUp, Activity,
} from 'lucide-react';
import { KpiGrid } from './kpis/KpiGrid';
import { ProductivityBarChart } from './charts/ProductivityBarChart';
import { TaskStatusDonut } from './charts/TaskStatusDonut';
import { ActivityHeatmap } from './charts/ActivityHeatmap';
import { PublicationsTrendLine } from './charts/PublicationsTrendLine';
import { BudgetStackedBar } from './charts/BudgetStackedBar';
import { HealthScoreGauge } from './charts/HealthScoreGauge';
import { ActivityFeed } from './activity/ActivityFeed';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useAdminDashboard } from '@/lib/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils/format';

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner text="Chargement du tableau de bord…" size="lg" /></div>;
  }

  const kpis = data?.kpis;

  const kpiItems = kpis ? [
    {
      icon: Users,
      label: 'Membres actifs',
      value: kpis.users.active,
      sub: `${kpis.users.inactive} inactifs · ${kpis.users.total} total`,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-50',
    },
    {
      icon: FolderKanban,
      label: 'Projets en cours',
      value: kpis.projects.active,
      sub: `${kpis.projects.pending} en attente · ${kpis.projects.total} total`,
      iconColor: 'text-violet-600',
      iconBgColor: 'bg-violet-50',
    },
    {
      icon: ListTodo,
      label: 'Tâches en attente',
      value: kpis.tasks.pending,
      sub: `${kpis.tasks.overdue} en retard · ${kpis.tasks.completed_this_month} validées ce mois`,
      iconColor: kpis.tasks.overdue > 0 ? 'text-red-500' : 'text-emerald-600',
      iconBgColor: kpis.tasks.overdue > 0 ? 'bg-red-50' : 'bg-emerald-50',
      alert: kpis.tasks.overdue > 0,
    },
    {
      icon: FileText,
      label: 'Publications',
      value: kpis.publications.total,
      sub: `${kpis.publications.submitted_month} ce mois`,
      iconColor: 'text-amber-600',
      iconBgColor: 'bg-amber-50',
    },
    {
      icon: DollarSign,
      label: 'Budget alloué',
      value: formatCurrency(kpis.budget.allocated),
      sub: `${formatCurrency(kpis.budget.spent)} dépensés`,
      iconColor: 'text-emerald-600',
      iconBgColor: 'bg-emerald-50',
    },
    {
      icon: TrendingUp,
      label: 'Complétion moy.',
      value: `${kpis.completion_rate}%`,
      iconColor: 'text-cyan-600',
      iconBgColor: 'bg-cyan-50',
    },
    {
      icon: Calendar,
      label: 'Réunions cette semaine',
      value: kpis.meetings_this_week,
      iconColor: 'text-indigo-600',
      iconBgColor: 'bg-indigo-50',
    },
    {
      icon: Activity,
      label: 'Score de santé',
      value: `${data?.health.score ?? 0}/100`,
      iconColor: 'text-rose-600',
      iconBgColor: 'bg-rose-50',
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <KpiGrid items={kpiItems} cols={4} />

      {/* Row 1 : Productivité + Donut statuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductivityBarChart />
        <TaskStatusDonut />
      </div>

      {/* Row 2 : Heatmap + Publications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityHeatmap />
        <PublicationsTrendLine />
      </div>

      {/* Row 3 : Budget + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BudgetStackedBar />
        </div>
        {data?.health && <HealthScoreGauge data={data.health} />}
      </div>

      {/* Activity feed */}
      <ActivityFeed />
    </div>
  );
}
