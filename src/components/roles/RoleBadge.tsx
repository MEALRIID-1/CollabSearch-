'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { CustomRole } from '@/types/models';

interface RoleBadgeProps {
  role: Pick<CustomRole, 'name' | 'color' | 'isSystem'>;
  size?: 'sm' | 'md';
  className?: string;
}

export function RoleBadge({ role, size = 'md', className }: RoleBadgeProps) {
  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 gap-1'
      : 'text-sm px-3 py-1 gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        sizeClasses,
        className
      )}
      style={{
        backgroundColor: `${role.color}18`,
        borderColor: `${role.color}40`,
        color: role.color,
      }}
    >
      {/* Pastille de couleur */}
      <span
        className="rounded-full shrink-0"
        style={{
          backgroundColor: role.color,
          width: size === 'sm' ? 6 : 8,
          height: size === 'sm' ? 6 : 8,
        }}
      />
      {role.name}
      {role.isSystem && (
        <Lock
          className="shrink-0 opacity-70"
          style={{ width: size === 'sm' ? 10 : 12, height: size === 'sm' ? 10 : 12 }}
        />
      )}
    </span>
  );
}
