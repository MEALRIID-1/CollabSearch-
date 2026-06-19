'use client';
import { KpiCard } from './KpiCard';
import type { LucideIcon } from 'lucide-react';

export interface KpiItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  iconColor?: string;
  iconBgColor?: string;
  alert?: boolean;
}

interface KpiGridProps {
  items: KpiItem[];
  cols?: 2 | 3 | 4;
}

export function KpiGrid({ items, cols = 4 }: KpiGridProps) {
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[cols];

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}
