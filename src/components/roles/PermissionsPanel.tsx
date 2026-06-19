'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Save, Loader2, Lock, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PermissionModuleSection } from './PermissionModuleSection';
import { RoleBadge } from './RoleBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CustomRoleDetail, PermissionCatalogModule, PermissionItem } from '@/types/models';

interface PermissionsPanelProps {
  role: CustomRoleDetail | null;
  catalog: PermissionCatalogModule[];
  onSave: (permissions: string[]) => void;
  isSaving: boolean;
  isReadOnly: boolean;
}

export function PermissionsPanel({
  role,
  catalog,
  onSave,
  isSaving,
  isReadOnly,
}: PermissionsPanelProps) {
  // État local des permissions cochées
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Catalogue effectif : utiliser catalog prop si disponible,
  // sinon dériver depuis role.permissionsByModule (toujours présent dans le détail)
  const effectiveCatalog = useMemo<PermissionCatalogModule[]>(() => {
    if (catalog.length > 0) return catalog;
    if (!role) return [];
    return role.permissionsByModule.map((mod) => ({
      module: mod.module,
      label: mod.label,
      icon: mod.icon,
      permissions: mod.permissions.map((p) => ({ key: p.key, label: p.label })),
    }));
  }, [catalog, role]);

  // Initialiser/réinitialiser à chaque changement de rôle
  useEffect(() => {
    if (!role) {
      setCheckedKeys(new Set());
      setIsDirty(false);
      return;
    }
    setCheckedKeys(new Set(role.permissionKeys));
    setIsDirty(false);
    // Ouvrir tous les modules par défaut
    setExpandedModules(new Set(effectiveCatalog.map((m) => m.module)));
  }, [role?.uuid, effectiveCatalog.length]);

  // Construire les modules avec le statut granted courant
  const modulesWithState = useMemo(() => {
    return effectiveCatalog.map((mod) => ({
      ...mod,
      permissions: mod.permissions.map((p) => ({
        ...p,
        granted: checkedKeys.has(p.key),
      } as PermissionItem)),
    }));
  }, [effectiveCatalog, checkedKeys]);

  // Filtrage par recherche
  const filteredModules = useMemo(() => {
    if (!search.trim()) return modulesWithState;
    const q = search.toLowerCase();
    return modulesWithState
      .map((mod) => ({
        ...mod,
        permissions: mod.permissions.filter((p) =>
          p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
        ),
      }))
      .filter((mod) => mod.permissions.length > 0);
  }, [modulesWithState, search]);

  const totalGranted = checkedKeys.size;
  const totalPerms = effectiveCatalog.reduce((acc, m) => acc + m.permissions.length, 0);

  function handleTogglePermission(key: string, checked: boolean) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
    setIsDirty(true);
  }

  function handleToggleModule(module: string, checked: boolean) {
    const mod = effectiveCatalog.find((m) => m.module === module);
    if (!mod) return;
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      mod.permissions.forEach((p) => {
        if (checked) next.add(p.key);
        else next.delete(p.key);
      });
      return next;
    });
    setIsDirty(true);
  }

  function handleCheckAll() {
    setCheckedKeys(new Set(effectiveCatalog.flatMap((m) => m.permissions.map((p) => p.key))));
    setIsDirty(true);
  }

  function handleUncheckAll() {
    setCheckedKeys(new Set());
    setIsDirty(true);
  }

  function handleToggleExpand(module: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }

  function handleSave() {
    onSave(Array.from(checkedKeys));
    setIsDirty(false);
  }

  // ── État vide (aucun rôle sélectionné) ──────────────────────────────────
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <svg
          className="w-24 h-24 text-neutral-200 mb-6"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 10C35 10 22 22 22 37c0 10 5.5 18.5 14 23.5V70h28v-9.5C72.5 55.5 78 47 78 37c0-15-13-27-28-27z"
            fill="currentColor"
          />
          <circle cx="50" cy="80" r="7" fill="currentColor" />
          <text x="50" y="44" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">?</text>
        </svg>
        <h3 className="text-base font-semibold text-neutral-500">Sélectionnez un rôle</h3>
        <p className="text-sm text-neutral-400 mt-1 max-w-xs">
          Cliquez sur un rôle à gauche pour voir et modifier ses permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Permissions de :
          </span>
          <RoleBadge role={role} size="sm" />
          {isReadOnly && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              <Lock className="h-3 w-3" />
              Rôle système — Non modifiable
            </span>
          )}
        </div>

        {/* Bouton Enregistrer */}
        {!isReadOnly && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              'gap-1.5 min-w-[140px]',
              !isDirty
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed hover:bg-neutral-100'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                {isDirty ? 'Enregistrer ●' : 'Enregistrer'}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Compteur global + actions globales + recherche */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-neutral-500 shrink-0">
          <strong className="text-neutral-700">{totalGranted}</strong> / {totalPerms} permissions activées
        </span>

        {!isReadOnly && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-neutral-500 hover:text-neutral-700"
              onClick={handleCheckAll}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Tout cocher
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-neutral-500 hover:text-neutral-700"
              onClick={handleUncheckAll}
            >
              <Square className="h-3.5 w-3.5" />
              Tout décocher
            </Button>
          </div>
        )}

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une permission…"
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Modules */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredModules.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">
            Aucune permission ne correspond à « {search} »
          </p>
        ) : (
          filteredModules.map((mod) => (
            <PermissionModuleSection
              key={mod.module}
              module={mod.module}
              label={mod.label}
              icon={mod.icon}
              permissions={mod.permissions}
              onTogglePermission={handleTogglePermission}
              onToggleModule={handleToggleModule}
              disabled={isReadOnly}
              isExpanded={expandedModules.has(mod.module)}
              onToggleExpand={() => handleToggleExpand(mod.module)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {!isReadOnly && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-neutral-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (role) setCheckedKeys(new Set(role.permissionKeys));
              setIsDirty(false);
            }}
            disabled={!isDirty || isSaving}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              !isDirty
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed hover:bg-neutral-100'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isSaving ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Enregistrement…</>
            ) : (
              <><Save className="h-3.5 w-3.5 mr-1.5" />Enregistrer</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
