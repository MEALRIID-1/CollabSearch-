'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasksByStatus } from '@/lib/hooks/use-dashboard';

const STATUS_COLORS: Record<string, string> = {
  todo:        '#94a3b8',
  in_progress: '#3b82f6',
  submitted:   '#f59e0b',
  validated:   '#10b981',
  refused:     '#ef4444',
};

interface Props {
  projectId?: number;
  title?: string;
}

export function TaskStatusDonut({ projectId, title = 'Répartition des tâches' }: Props) {
  const { data = [], isLoading } = useTasksByStatus(projectId);
  const filtered = data.filter((d) => d.count > 0);
  const total = filtered.reduce((s, d) => s + d.count, 0);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Aucune tâche</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={filtered}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {filtered.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#cbd5e1'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: unknown) => { const n = Number(v); return [`${n} (${Math.round((n / total) * 100)}%)`, '']; }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
