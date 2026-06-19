'use client';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface Props {
  streak: number;
}

export function PersonalStreak({ streak }: Props) {
  return (
    <Card className={cn('border-none shadow-sm', streak >= 7 ? 'bg-gradient-to-br from-orange-50 to-amber-50' : '')}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="text-4xl">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '💪'}</div>
        <div>
          <p className="text-2xl font-bold">
            {streak} <span className="text-base font-medium text-muted-foreground">jour{streak !== 1 ? 's' : ''}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {streak === 0
              ? 'Aucune tâche validée récemment'
              : streak === 1
              ? 'Tâche validée hier — continuez !'
              : `${streak} jours consécutifs avec tâche validée`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
