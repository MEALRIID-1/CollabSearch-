'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PermissionCheckbox } from './PermissionCheckbox';
import { Checkbox } from '@/components/ui/checkbox';
import type { PermissionItem } from '@/types/models';

// Mapping icônes Lucide (on importe dynamiquement via un switch)
import {
  FolderKanban, ClipboardList, BookOpen, Calendar, Users,
  MessageSquare, Bell, Sparkles, ShieldCheck,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  FolderKanban, ClipboardList, BookOpen, Calendar, Users,
  MessageSquare, Bell, Sparkles, ShieldCheck,
};

interface PermissionModuleSectionProps {
  module: string;
  label: string;
  icon: string;
  permissions: PermissionItem[];
  onTogglePermission: (key: string, checked: boolean) => void;
  onToggleModule: (module: string, checked: boolean) => void;
  disabled?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function PermissionModuleSection({
  module,
  label,
  icon,
  permissions,
  onTogglePermission,
  onToggleModule,
  disabled = false,
  isExpanded,
  onToggleExpand,
}: PermissionModuleSectionProps) {
  const Icon = ICON_MAP[icon] ?? ShieldCheck;

  const grantedCount = permissions.filter((p) => p.granted).length;
  const totalCount = permissions.length;
  const allChecked = grantedCount === totalCount;
  const someChecked = grantedCount > 0 && grantedCount < totalCount;

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* En-tête de module */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 bg-neutral-50 cursor-pointer select-none',
          'hover:bg-neutral-100 transition-colors',
          someChecked && 'border-l-2 border-blue-400',
          allChecked && grantedCount > 0 && 'border-l-2 border-emerald-500'
        )}
        onClick={onToggleExpand}
      >
        {/* Icône expand */}
        <span className="text-neutral-400 shrink-0">
          {isExpanded
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />
          }
        </span>

        {/* Icône module */}
        <Icon className="h-4 w-4 text-neutral-500 shrink-0" />

        {/* Label */}
        <span className="flex-1 text-sm font-semibold text-neutral-700">{label}</span>

        {/* Compteur */}
        <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-medium border border-neutral-200 shrink-0">
          {grantedCount}/{totalCount}
        </span>

        {/* Checkbox "Tout sélectionner" */}
        <div
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={allChecked}
            ref={(el) => {
              if (el) (el as any).indeterminate = someChecked;
            }}
            disabled={disabled}
            onCheckedChange={(val) => onToggleModule(module, !!val)}
            className={cn(
              'transition-all duration-100',
              allChecked && 'bg-emerald-500 border-emerald-500',
              someChecked && 'bg-blue-100 border-blue-400'
            )}
          />
        </div>
      </div>

      {/* Liste des permissions (accordéon) */}
      {isExpanded && (
        <div className="px-3 py-2 space-y-0.5 bg-white">
          {permissions.map((perm) => (
            <PermissionCheckbox
              key={perm.key}
              permissionKey={perm.key}
              label={perm.label}
              checked={perm.granted}
              onChange={onTogglePermission}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
