'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { RoleBadge } from './RoleBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  createRoleSchema, updateRoleSchema,
  type CreateRoleFormData, type UpdateRoleFormData,
} from '@/lib/validators/role.schema';
import type { CustomRole } from '@/types/models';

const PRESET_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#D97706', '#65A30D', '#0891B2',
  '#0F766E', '#4F46E5', '#9333EA', '#374151',
];

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: CustomRole;
  onSubmit: (data: CreateRoleFormData | UpdateRoleFormData) => void;
  isLoading?: boolean;
}

export function RoleFormModal({
  isOpen,
  onClose,
  role,
  onSubmit,
  isLoading = false,
}: RoleFormModalProps) {
  const isEdit = !!role;
  const schema = isEdit ? updateRoleSchema : createRoleSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: role?.name ?? '',
      color: role?.color ?? '#2563EB',
      description: role?.description ?? '',
      permissions: [],
    },
  });

  const watchedName = watch('name');
  const watchedColor = watch('color');
  const [customHex, setCustomHex] = useState(role?.color ?? '#2563EB');

  // Reset sur ouverture
  useEffect(() => {
    if (isOpen) {
      reset({
        name: role?.name ?? '',
        color: role?.color ?? '#2563EB',
        description: role?.description ?? '',
        permissions: [],
      });
      setCustomHex(role?.color ?? '#2563EB');
    }
  }, [isOpen, role?.uuid]);

  function handleColorSelect(color: string) {
    setValue('color', color);
    setCustomHex(color);
  }

  function handleHexChange(val: string) {
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setValue('color', val);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Modifier "${role.name}"` : 'Créer un rôle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5 mt-2">
          {/* Nom */}
          <div className="space-y-1.5">
            <Label htmlFor="role-name">
              Nom du rôle <span className="text-red-500">*</span>
            </Label>
            <Input
              id="role-name"
              placeholder="ex : Coordinateur"
              {...register('name')}
              className={cn(errors.name && 'border-red-400')}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Couleur */}
          <div className="space-y-2">
            <Label>
              Couleur <span className="text-red-500">*</span>
            </Label>
            {/* Swatches */}
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorSelect(c)}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                    watchedColor === c ? 'border-neutral-800 scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            {/* Input hex */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-md border border-neutral-200 shrink-0"
                style={{ backgroundColor: watchedColor }}
              />
              <Input
                value={customHex}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#2563EB"
                className="font-mono text-sm h-8 w-32"
                maxLength={7}
              />
              {errors.color && (
                <p className="text-xs text-red-500">{errors.color.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Description</Label>
            <textarea
              id="role-desc"
              {...register('description')}
              rows={3}
              placeholder="Description optionnelle du rôle…"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Aperçu */}
          {watchedName && (
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <span className="text-xs text-neutral-500">Aperçu :</span>
              <RoleBadge
                role={{ name: watchedName, color: watchedColor || '#6366F1', isSystem: false }}
                size="sm"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-1.5 min-w-[100px]">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
