'use client';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import type { HealthScore } from '@/types/models';

interface Props {
  data: HealthScore;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Correct';
  return 'À améliorer';
}

export function HealthScoreGauge({ data }: Props) {
  const color = scoreColor(data.score);
  const chartData = [{ value: data.score, fill: color }];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Score de santé global</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart
              cx="50%"
              cy="85%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={14}
              data={chartData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
            <span className="text-3xl font-bold" style={{ color }}>{data.score}</span>
            <span className="text-xs font-medium" style={{ color }}>{scoreLabel(data.score)}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2 text-center">
          {[
            { label: 'Tâches à temps', value: data.on_time_rate },
            { label: 'Budget OK', value: data.budget_rate },
            { label: 'Publications', value: data.pub_rate },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-2">
              <p className={cn('text-lg font-bold', scoreColor(item.value) === '#10b981' ? 'text-emerald-600' : item.value >= 50 ? 'text-amber-500' : 'text-red-500')}>
                {item.value}%
              </p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
