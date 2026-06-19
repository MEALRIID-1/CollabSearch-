'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface Props {
  allocated: number;
  spent: number;
}

export function BudgetAlertWidget({ allocated, spent }: Props) {
  const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
  const isAlert = pct >= 80;
  const isOver  = pct > 100;

  return (
    <Card className={cn('border-none shadow-sm', isOver ? 'ring-2 ring-red-400' : isAlert ? 'ring-2 ring-amber-400' : '')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {isOver ? <AlertTriangle className="h-4 w-4 text-red-500" /> : isAlert ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
          Budget global
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Consommé</span>
            <span className={cn('font-medium', isOver ? 'text-red-600' : isAlert ? 'text-amber-600' : 'text-emerald-600')}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', isOver ? 'bg-red-500' : isAlert ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-sm font-bold">{formatCurrency(allocated)}</p>
            <p className="text-[10px] text-muted-foreground">Alloué</p>
          </div>
          <div className={cn('rounded-lg p-2', isOver ? 'bg-red-50' : 'bg-gray-50')}>
            <p className={cn('text-sm font-bold', isOver ? 'text-red-600' : '')}>{formatCurrency(spent)}</p>
            <p className="text-[10px] text-muted-foreground">Dépensé</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
