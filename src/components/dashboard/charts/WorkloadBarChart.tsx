'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkloadEntry } from '@/types/models';

interface Props {
  data: WorkloadEntry[];
  isLoading?: boolean;
}

export function WorkloadBarChart({ data, isLoading }: Props) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Charge par membre</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.split(' ')[0]}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }}
                formatter={(v) => v === 'assigned' ? 'Assignées' : 'Complétées'} />
              <Bar dataKey="assigned" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
