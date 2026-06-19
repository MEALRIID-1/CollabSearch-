'use client';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublicationsTrend } from '@/lib/hooks/use-dashboard';

export function PublicationsTrendLine({ months = 12 }: { months?: number }) {
  const { data = [], isLoading } = usePublicationsTrend(months);

  const formatted = data.map((d) => ({
    ...d,
    label: d.month,
  }));

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Publications ({months} mois)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
        ) : formatted.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(v: unknown) => { const n = Number(v); return [`${n} publication${n !== 1 ? 's' : ''}`, '']; }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
