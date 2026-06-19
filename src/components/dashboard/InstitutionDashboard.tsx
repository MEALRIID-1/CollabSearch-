'use client';
import {
  FolderKanban, FileText, DollarSign, Users,
} from 'lucide-react';
import { KpiGrid } from './kpis/KpiGrid';
import { PublicationsTrendLine } from './charts/PublicationsTrendLine';
import { BudgetStackedBar } from './charts/BudgetStackedBar';
import { PendingApprovals } from './widgets/PendingApprovals';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useInstitutionDashboard } from '@/lib/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const PUB_COLORS = ['#2563EB', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const PUB_LABELS: Record<string, string> = {
  article: 'Article', conference: 'Conférence', these: 'Thèse', rapport: 'Rapport', livre: 'Livre',
};

export function InstitutionDashboard() {
  const { data, isLoading } = useInstitutionDashboard();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner text="Chargement…" size="lg" /></div>;
  }

  const kpis = data?.kpis;

  const kpiItems = kpis ? [
    {
      icon: FolderKanban,
      label: 'Projets actifs',
      value: kpis.projects.active,
      sub: `${kpis.projects.pending} en attente, ${kpis.projects.total} total`,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-50',
    },
    {
      icon: FileText,
      label: 'Publications totales',
      value: kpis.publications_total,
      iconColor: 'text-violet-600',
      iconBgColor: 'bg-violet-50',
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
      icon: Users,
      label: 'Chercheurs actifs',
      value: kpis.users_total,
      iconColor: 'text-cyan-600',
      iconBgColor: 'bg-cyan-50',
    },
  ] : [];

  const pubByDomain = (data?.publications ?? []).map((p: { type: string; count: number }, i: number) => ({
    ...p,
    label: PUB_LABELS[p.type] ?? p.type,
    fill: PUB_COLORS[i % PUB_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <KpiGrid items={kpiItems} cols={4} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingApprovals />

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Publications par type</CardTitle>
          </CardHeader>
          <CardContent>
            {pubByDomain.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pubByDomain} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {pubByDomain.map((entry: { type: string; count: number; label: string; fill: string }, i: number) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [Number(v), '']} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Projets soumis / approuvés (24 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.projects_trend ?? []).length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data?.projects_trend ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="submitted" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Soumis" />
                  <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Approuvés" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <BudgetStackedBar />
      </div>

      <PublicationsTrendLine months={12} />
    </div>
  );
}
