'use client';
import {
  ListTodo, AlertTriangle, FileText, FolderKanban, CheckCircle2, Flame,
} from 'lucide-react';
import { KpiGrid } from './kpis/KpiGrid';
import { TaskStatusDonut } from './charts/TaskStatusDonut';
import { WeeklyTasksBar } from './charts/WeeklyTasksBar';
import { UpcomingMeeting } from './widgets/UpcomingMeeting';
import { PersonalStreak } from './widgets/PersonalStreak';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useResearcherDashboard } from '@/lib/hooks/use-dashboard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/use-notifications';

export function ResearcherDashboard({ userId }: { userId?: number }) {
  const { data, isLoading } = useResearcherDashboard();
  const { data: notifData } = useNotifications({ page: 1 });
  const notifications = (Array.isArray(notifData) ? notifData : []).slice(0, 5);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner text="Chargement…" size="lg" /></div>;
  }

  const kpis = data?.kpis;

  const kpiItems = kpis ? [
    {
      icon: ListTodo,
      label: 'Mes tâches',
      value: kpis.tasks.total,
      sub: `${kpis.tasks.in_progress} en cours`,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-50',
    },
    {
      icon: AlertTriangle,
      label: 'En retard',
      value: kpis.tasks.overdue,
      iconColor: kpis.tasks.overdue > 0 ? 'text-red-600' : 'text-emerald-600',
      iconBgColor: kpis.tasks.overdue > 0 ? 'bg-red-50' : 'bg-emerald-50',
      alert: kpis.tasks.overdue > 0,
    },
    {
      icon: CheckCircle2,
      label: 'Validées cette semaine',
      value: kpis.tasks.completed_this_week,
      iconColor: 'text-emerald-600',
      iconBgColor: 'bg-emerald-50',
    },
    {
      icon: FileText,
      label: 'Mes publications',
      value: kpis.publications,
      iconColor: 'text-violet-600',
      iconBgColor: 'bg-violet-50',
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* KPIs + streak */}
      <div className="space-y-4">
        <KpiGrid items={kpiItems} cols={4} />
        {kpis && <PersonalStreak streak={kpis.streak_days} />}
      </div>

      {/* Row 1 : Tâches par statut + Weekly bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskStatusDonut title="Mes tâches par statut" />
        <WeeklyTasksBar data={data?.weekly_tasks ?? []} isLoading={isLoading} />
      </div>

      {/* Row 2 : Réunion + Notifications récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingMeeting />

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Notifications récentes</CardTitle>
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-blue-600">
                  Voir tout <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune notification</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-xs font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
