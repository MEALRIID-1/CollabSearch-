'use client';

import { cn } from '@/lib/utils/cn';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PermissionCheckboxProps {
  permissionKey: string;
  label: string;
  checked: boolean;
  onChange: (key: string, checked: boolean) => void;
  disabled?: boolean;
}

export function PermissionCheckbox({
  permissionKey,
  label,
  checked,
  onChange,
  disabled = false,
}: PermissionCheckboxProps) {
  const id = `perm-${permissionKey.replace(/\./g, '-')}`;

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 py-1.5 px-2 rounded-md transition-colors',
        !disabled && 'hover:bg-neutral-50 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onChange(permissionKey, !checked)}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(val) => !disabled && onChange(permissionKey, !!val)}
        className={cn(
          'transition-all duration-100',
          checked
            ? 'bg-blue-600 border-blue-600'
            : 'border-neutral-300 hover:border-blue-400'
        )}
        onClick={(e) => e.stopPropagation()}
      />
      <Label
        htmlFor={id}
        className={cn(
          'text-sm leading-none cursor-pointer select-none',
          checked ? 'text-neutral-800 font-medium' : 'text-neutral-500',
          disabled && 'cursor-not-allowed'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </Label>
    </div>
  );
}
