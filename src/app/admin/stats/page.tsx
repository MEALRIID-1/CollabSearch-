'use client';

import {
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { StatCard } from '@/components/shared/stat-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ReportGenerator } from '@/components/reports/report-generator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { USER_ROLES, PROJECT_STATUSES, PUBLICATION_TYPES } from '@/lib/utils/constants';
import type { UserRole, ProjectStatus, PublicationType } from '@/types/models';

const COLORS = ['#2563EB', '#10B981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function AdminStatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => usersApi.getDashboardStats(),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Chargement des statistiques..." size="lg" />
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    {
      icon: Users,
      value: formatNumber(stats?.total_projects ?? 0),
      label: 'Projets totaux',
      iconColor: 'text-[#2563EB]',
      iconBgColor: 'bg-blue-50',
    },
    {
      icon: FolderKanban,
      value: formatNumber(stats?.active_projects ?? 0),
      label: 'Projets actifs',
      iconColor: 'text-[#10B981]',
      iconBgColor: 'bg-emerald-50',
    },
    {
      icon: FileText,
      value: formatNumber(stats?.total_publications ?? 0),
      label: 'Publications',
      iconColor: 'text-[#8b5cf6]',
      iconBgColor: 'bg-violet-50',
    },
    {
      icon: DollarSign,
      value: formatCurrency(stats?.total_budget_allocated ?? 0),
      label: 'Budget total alloué',
      iconColor: 'text-[#f59e0b]',
      iconBgColor: 'bg-amber-50',
    },
  ];

  // Mock chart data for demonstration
  const projectStatusData = Object.entries(PROJECT_STATUSES).map(([key, { label }], index) => ({
    name: label,
    value: Math.floor(Math.random() * 20) + 1,
    color: COLORS[index % COLORS.length],
  }));

  const budgetData = [
    { name: 'Alloué', value: stats?.total_budget_allocated ?? 0 },
    { name: 'Dépensé', value: stats?.total_budget_spent ?? 0 },
    { name: 'Restant', value: (stats?.total_budget_allocated ?? 0) - (stats?.total_budget_spent ?? 0) },
  ];

  const monthlyData = [
    { month: 'Jan', projets: 4, publications: 2 },
    { month: 'Fév', projets: 3, publications: 5 },
    { month: 'Mar', projets: 6, publications: 3 },
    { month: 'Avr', projets: 5, publications: 4 },
    { month: 'Mai', projets: 7, publications: 6 },
    { month: 'Jun', projets: 4, publications: 8 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Statistiques</h1>
            <p className="text-muted-foreground mt-1">
              Tableau de bord d&apos;administration de la plateforme
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly activity chart */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activité mensuelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="projets" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="publications" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Project status distribution */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Répartition des projets par statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget overview */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Aperçu budgétaire global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-blue-50">
                <p className="text-2xl font-bold text-[#2563EB]">
                  {formatCurrency(stats?.total_budget_allocated ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Budget total alloué</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-amber-50">
                <p className="text-2xl font-bold text-[#f59e0b]">
                  {formatCurrency(stats?.total_budget_spent ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Budget total dépensé</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-emerald-50">
                <p className="text-2xl font-bold text-[#10B981]">
                  {formatCurrency((stats?.total_budget_allocated ?? 0) - (stats?.total_budget_spent ?? 0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Budget restant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report generator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportGenerator />

          {/* Quick stats summary */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Résumé rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Tâches totales</span>
                <span className="text-sm font-bold">{formatNumber(stats?.total_tasks ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Tâches terminées</span>
                <span className="text-sm font-bold">{formatNumber(stats?.completed_tasks ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Réunions à venir</span>
                <span className="text-sm font-bold">{formatNumber(stats?.upcoming_meetings ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Notifications non lues</span>
                <span className="text-sm font-bold">{formatNumber(stats?.unread_notifications ?? 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
