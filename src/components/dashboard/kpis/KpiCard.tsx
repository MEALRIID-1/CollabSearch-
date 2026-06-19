'use client';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number; // positive = hausse, negative = baisse
  iconColor?: string;
  iconBgColor?: string;
  alert?: boolean;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50',
  alert,
}: KpiCardProps) {
  return (
    <Card className={cn('border-none shadow-sm', alert && 'ring-2 ring-red-400')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', iconBgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          {trend !== undefined && (
            <span className={cn('flex items-center gap-0.5 text-xs font-medium', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1 opacity-70">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
