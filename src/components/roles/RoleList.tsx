'use client';

import { Plus, ShieldOff } from 'lucide-react';
import { RoleCard } from './RoleCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CustomRole } from '@/types/models';

interface RoleListProps {
  roles: CustomRole[];
  selectedRoleUuid: string | null;
  onSelectRole: (uuid: string) => void;
  onCreateRole: () => void;
  onEditRole: (role: CustomRole) => void;
  onDeleteRole: (role: CustomRole) => void;
  isLoading: boolean;
}

export function RoleList({
  roles,
  selectedRoleUuid,
  onSelectRole,
  onCreateRole,
  onEditRole,
  onDeleteRole,
  isLoading,
}: RoleListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Mes rôles
        </p>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onCreateRole}
        >
          <Plus className="h-3.5 w-3.5" />
          Créer
        </Button>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 p-4 space-y-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-neutral-100 p-4 mb-3">
              <ShieldOff className="h-8 w-8 text-neutral-300" />
            </div>
            <p className="text-sm font-medium text-neutral-600">Aucun rôle personnalisé</p>
            <p className="text-xs text-neutral-400 mt-1 mb-4">
              Créez votre premier rôle pour commencer.
            </p>
            <Button size="sm" onClick={onCreateRole} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Créer un rôle
            </Button>
          </div>
        ) : (
          roles.map((role) => (
            <RoleCard
              key={role.uuid}
              role={role}
              isSelected={selectedRoleUuid === role.uuid}
              onClick={onSelectRole}
              onEdit={onEditRole}
              onDelete={onDeleteRole}
            />
          ))
        )}
      </div>
    </div>
  );
}
