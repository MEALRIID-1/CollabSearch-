'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import type { MilestoneEntry } from '@/types/models';
import { Flag } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

interface Props {
  data: MilestoneEntry[];
  isLoading?: boolean;
}

export function GanttMilestones({ data, isLoading }: Props) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Jalons à venir (30 jours)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">Chargement…</div>
        ) : data.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">Aucun jalon dans les 30 prochains jours</div>
        ) : (
          <div className="space-y-2">
            {data.map((m) => {
              const daysLeft = differenceInDays(parseISO(m.due), new Date());
              const urgent = daysLeft <= 7;
              return (
                <div key={m.id} className={cn('flex items-center gap-3 p-2.5 rounded-lg border', urgent ? 'border-red-200 bg-red-50' : 'bg-gray-50')}>
                  <Flag className={cn('h-4 w-4 shrink-0', urgent ? 'text-red-500' : 'text-blue-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    {m.project && <p className="text-xs text-muted-foreground truncate">{m.project}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">{formatDate(m.due)}</p>
                    <Badge className={cn('text-[10px]', urgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>
                      J-{daysLeft}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
