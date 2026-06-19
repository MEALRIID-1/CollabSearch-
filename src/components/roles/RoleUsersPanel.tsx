'use client';

import { useState } from 'react';
import { UserPlus, X, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getInitials } from '@/lib/utils/format';
import type { CustomRoleDetail } from '@/types/models';
import type { User } from '@/types/models';

interface RoleUsersPanelProps {
  role: CustomRoleDetail;
  availableUsers: User[];
  onAssign: (userUuid: string) => void;
  onRemove: (userUuid: string) => void;
  isAssigning?: boolean;
  isRemoving?: boolean;
}

export function RoleUsersPanel({
  role,
  availableUsers,
  onAssign,
  onRemove,
  isAssigning = false,
  isRemoving = false,
}: RoleUsersPanelProps) {
  const [selectedUserUuid, setSelectedUserUuid] = useState('');

  // Filtrer les utilisateurs qui n'ont pas encore ce rôle
  const assignedUuids = new Set(role.users.map((u) => u.uuid).filter(Boolean));
  const unassignedUsers = availableUsers.filter(
    (u) => !assignedUuids.has(u.id?.toString() ?? '')
  );

  function handleAssign() {
    if (!selectedUserUuid) return;
    onAssign(selectedUserUuid);
    setSelectedUserUuid('');
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-neutral-400" />
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Utilisateurs avec ce rôle ({role.users.length})
        </p>
      </div>

      {/* Liste des utilisateurs assignés */}
      {role.users.length === 0 ? (
        <p className="text-sm text-neutral-400 italic py-2">
          Aucun utilisateur n'a ce rôle.
        </p>
      ) : (
        <div className="space-y-1">
          {role.users.map((u) => (
            <div
              key={u.uuid ?? u.email}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-100 bg-neutral-50 hover:bg-neutral-100 transition-colors"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={u.avatarPath ?? undefined} alt={u.name} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {getInitials(u.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">{u.name}</p>
                <p className="text-xs text-neutral-400 truncate">{u.email}</p>
              </div>
              {!role.isSystem && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-neutral-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                  onClick={() => u.uuid && onRemove(u.uuid)}
                  disabled={isRemoving}
                  title="Retirer ce rôle"
                >
                  {isRemoving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assigner un utilisateur */}
      {!role.isSystem && unassignedUsers.length > 0 && (
        <div className="pt-2 border-t border-neutral-100">
          <p className="text-xs font-medium text-neutral-500 mb-2">
            Assigner un utilisateur
          </p>
          <div className="flex items-center gap-2">
            <Select value={selectedUserUuid} onValueChange={setSelectedUserUuid}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Choisir un utilisateur…" />
              </SelectTrigger>
              <SelectContent>
                {unassignedUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id?.toString() ?? ''}>
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{u.full_name}</span>
                      <span className="text-xs text-neutral-400">{u.email}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={!selectedUserUuid || isAssigning}
              className="gap-1.5 shrink-0"
            >
              {isAssigning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              Assigner
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
