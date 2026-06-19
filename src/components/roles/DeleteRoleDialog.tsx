'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { CustomRole } from '@/types/models';

interface DeleteRoleDialogProps {
  role: CustomRole | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (replacementUuid?: string) => void;
  availableRoles: CustomRole[];
  isLoading?: boolean;
}

export function DeleteRoleDialog({
  role,
  isOpen,
  onClose,
  onConfirm,
  availableRoles,
  isLoading = false,
}: DeleteRoleDialogProps) {
  const [replacementUuid, setReplacementUuid] = useState<string>('');

  if (!role) return null;

  const needsReplacement = role.usersCount > 0;
  const canConfirm = !needsReplacement || !!replacementUuid;

  const otherRoles = availableRoles.filter(
    (r) => r.uuid !== role.uuid && !r.isSystem
  );

  function handleConfirm() {
    onConfirm(needsReplacement ? replacementUuid : undefined);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Supprimer le rôle « {role.name} » ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {needsReplacement ? (
                <>
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                    <strong>{role.usersCount} utilisateur{role.usersCount > 1 ? 's ont' : ' a'}</strong> ce rôle.
                    Vous devez choisir un rôle de remplacement avant de supprimer.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700">
                      Rôle de remplacement <span className="text-red-500">*</span>
                    </label>
                    <Select value={replacementUuid} onValueChange={setReplacementUuid}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un rôle…" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherRoles.map((r) => (
                          <SelectItem key={r.uuid} value={r.uuid}>
                            <span className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: r.color }}
                              />
                              {r.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-600">
                  Cette action est irréversible. Le rôle et toutes ses permissions seront supprimés définitivement.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? 'Suppression…' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
