'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivityHeatmap } from '@/lib/hooks/use-dashboard';
import { format, parseISO, eachDayOfInterval, subWeeks, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';

function intensityClass(count: number, max: number): string {
  if (count === 0) return 'bg-gray-100';
  const ratio = count / max;
  if (ratio < 0.25) return 'bg-blue-200';
  if (ratio < 0.5)  return 'bg-blue-400';
  if (ratio < 0.75) return 'bg-blue-500';
  return 'bg-blue-700';
}

export function ActivityHeatmap({ weeks = 12 }: { weeks?: number }) {
  const { data = [], isLoading } = useActivityHeatmap(weeks);

  const { grid, max } = useMemo(() => {
    const map = new Map(data.map((d) => [d.date, d.count]));
    const end = new Date();
    const start = startOfWeek(subWeeks(end, weeks - 1), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    const max = Math.max(1, ...data.map((d) => d.count));

    // Organise en colonnes (semaines)
    const cols: { date: Date; count: number }[][] = [];
    let col: { date: Date; count: number }[] = [];

    days.forEach((d, i) => {
      const dayOfWeek = (d.getDay() + 6) % 7; // 0=lun
      if (i === 0) {
        // Pad début
        for (let p = 0; p < dayOfWeek; p++) col.push({ date: d, count: -1 });
      }
      col.push({ date: d, count: map.get(format(d, 'yyyy-MM-dd')) ?? 0 });
      if (col.length === 7) { cols.push(col); col = []; }
    });
    if (col.length > 0) cols.push(col);

    return { grid: cols, max };
  }, [data, weeks]);

  const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Activité de l&apos;équipe ({weeks} semaines)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-28 flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-1">
                {DAY_LABELS.map((d, i) => (
                  <span key={i} className="h-3 w-3 text-[9px] text-muted-foreground leading-3">{d}</span>
                ))}
              </div>
              {/* Weeks */}
              {grid.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-1">
                  {col.map((cell, di) => (
                    cell.count === -1
                      ? <div key={di} className="h-3 w-3" />
                      : (
                        <div
                          key={di}
                          title={`${format(cell.date, 'EEE d MMM', { locale: fr })} — ${cell.count} action${cell.count !== 1 ? 's' : ''}`}
                          className={cn('h-3 w-3 rounded-sm', intensityClass(cell.count, max))}
                        />
                      )
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-muted-foreground">Moins</span>
              {['bg-gray-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600', 'bg-blue-800'].map((c, i) => (
                <div key={i} className={cn('h-3 w-3 rounded-sm', c)} />
              ))}
              <span className="text-[10px] text-muted-foreground">Plus</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
