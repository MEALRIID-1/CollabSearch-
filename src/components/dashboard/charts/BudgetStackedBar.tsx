'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBudgetByProject } from '@/lib/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils/format';

export function BudgetStackedBar() {
  const { data = [], isLoading } = useBudgetByProject();

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Budget par projet</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="title"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                formatter={(v: unknown, name: unknown) => [
                  formatCurrency(Number(v)),
                  name === 'allocated' ? 'Alloué' : name === 'spent' ? 'Dépensé' : 'Dépassement',
                ]}
              />
              <Legend
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
                formatter={(v) => v === 'allocated' ? 'Alloué' : v === 'spent' ? 'Dépensé' : 'Dépassement'}
              />
              <Bar dataKey="allocated" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" fill="#10b981" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.over > 0 ? '#ef4444' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
