'use client';

import { Lock, Pencil, Trash2, Users, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { RoleBadge } from './RoleBadge';
import { Button } from '@/components/ui/button';
import type { CustomRole } from '@/types/models';

interface RoleCardProps {
  role: CustomRole;
  isSelected: boolean;
  onClick: (uuid: string) => void;
  onEdit: (role: CustomRole) => void;
  onDelete: (role: CustomRole) => void;
}

export function RoleCard({ role, isSelected, onClick, onEdit, onDelete }: RoleCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-white p-4 cursor-pointer transition-all duration-150',
        'hover:shadow-md',
        isSelected
          ? 'border-l-4 bg-blue-50 border-blue-600 shadow-sm'
          : 'border-neutral-200 hover:border-neutral-300'
      )}
      style={isSelected ? { borderLeftColor: role.color } : undefined}
      onClick={() => onClick(role.uuid)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(role.uuid)}
    >
      {/* En-tête : badge + label système */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <RoleBadge role={role} size="sm" />
        {role.isSystem && (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-400 font-medium shrink-0">
            <Lock className="h-3 w-3" />
            Système
          </span>
        )}
      </div>

      {/* Compteurs */}
      <p className="text-xs text-neutral-500 mt-1.5 flex items-center gap-2">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          {role.permissionsCount} permission{role.permissionsCount > 1 ? 's' : ''}
        </span>
        <span className="text-neutral-300">·</span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {role.usersCount} utilisateur{role.usersCount > 1 ? 's' : ''}
        </span>
      </p>

      {/* Description */}
      {role.description && (
        <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed">
          {role.description}
        </p>
      )}

      {/* Boutons d'action — visibles au hover si pas système */}
      {!role.isSystem && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neutral-400 hover:text-blue-600 hover:bg-blue-50"
            onClick={(e) => { e.stopPropagation(); onEdit(role); }}
            title="Modifier"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neutral-400 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); onDelete(role); }}
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
