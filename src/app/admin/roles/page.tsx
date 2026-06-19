'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { RoleList } from '@/components/roles/RoleList';
import { PermissionsPanel } from '@/components/roles/PermissionsPanel';
import { RoleUsersPanel } from '@/components/roles/RoleUsersPanel';
import { RoleFormModal } from '@/components/roles/RoleFormModal';
import { DeleteRoleDialog } from '@/components/roles/DeleteRoleDialog';

import {
  useRoles, useRole, usePermissionsCatalog,
  useCreateRole, useUpdateRole, useSyncPermissions,
  useDeleteRole, useAssignRole, useRemoveRole,
} from '@/lib/hooks/use-roles';
import { adminUsersApi } from '@/lib/api/admin-users';
import { useQuery } from '@tanstack/react-query';
import type { CustomRole } from '@/types/models';
import type { CreateRoleFormData, UpdateRoleFormData } from '@/lib/validators/role.schema';

export default function AdminRolesPage() {
  // ── Données ────────────────────────────────────────────────────────────
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: catalog = [] } = usePermissionsCatalog();
  const { data: adminUsersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminUsersApi.list({ per_page: 200 } as any),
  });
  const availableUsers = adminUsersData?.data ?? [];

  // ── État local ─────────────────────────────────────────────────────────
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<CustomRole | null>(null);
  const [deleteRole, setDeleteRole] = useState<CustomRole | null>(null);
  // ── Rôle sélectionné ──────────────────────────────────────────────────
  const { data: selectedRole, isLoading: roleLoading } = useRole(selectedUuid);

  // Sélectionner automatiquement le premier rôle non-système au chargement
  useEffect(() => {
    if (roles.length > 0 && !selectedUuid) {
      const first = roles.find((r) => !r.isSystem) ?? roles[0];
      if (first) setSelectedUuid(first.uuid);
    }
  }, [roles]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();
  const { mutate: syncPerms, isPending: isSyncing } = useSyncPermissions();
  const { mutate: deleteRoleMut, isPending: isDeleting } = useDeleteRole();
  const { mutate: assignRole, isPending: isAssigning } = useAssignRole();
  const { mutate: removeRole, isPending: isRemoving } = useRemoveRole();

  // ── Handlers ───────────────────────────────────────────────────────────
  function handleSelectRole(uuid: string) {
    setSelectedUuid(uuid);
    setMobileView('detail');
  }

  function handleCreateSubmit(data: CreateRoleFormData) {
    createRole(data as any, {
      onSuccess: (res) => {
        setCreateOpen(false);
        setSelectedUuid(res.data.data.uuid);
      },
    });
  }

  function handleEditSubmit(data: UpdateRoleFormData) {
    if (!editRole) return;
    updateRole(
      { uuid: editRole.uuid, data },
      { onSuccess: () => setEditRole(null) }
    );
  }

  function handleSyncPerms(permissions: string[]) {
    if (!selectedUuid) return;
    syncPerms({ uuid: selectedUuid, permissions });
  }

  function handleDeleteConfirm(replacementUuid?: string) {
    if (!deleteRole) return;
    deleteRoleMut(
      { uuid: deleteRole.uuid, replacementUuid },
      {
        onSuccess: () => {
          setDeleteRole(null);
          if (selectedUuid === deleteRole.uuid) {
            const next = roles.find((r) => r.uuid !== deleteRole.uuid);
            setSelectedUuid(next?.uuid ?? null);
          }
        },
      }
    );
  }

  function handleAssign(userUuid: string) {
    if (!selectedUuid) return;
    assignRole({ roleUuid: selectedUuid, userUuid });
  }

  function handleRemove(userUuid: string) {
    if (!selectedUuid) return;
    removeRole({ userUuid, roleUuid: selectedUuid });
  }

  // ── Rendu ──────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-lg bg-blue-100 p-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Rôles &amp; Permissions</h1>
          <p className="text-sm text-neutral-500">
            Gérez les rôles de votre espace et leurs permissions.
          </p>
        </div>
      </div>

      {/* ── Layout Desktop (md+) ── */}
      <div className="hidden md:flex gap-0 bg-white rounded-xl border border-neutral-200 overflow-hidden"
           style={{ height: 'calc(100vh - 180px)' }}>

        {/* Colonne gauche */}
        <div className="w-[340px] shrink-0 border-r border-neutral-200 bg-neutral-50 p-6 overflow-y-auto">
          <RoleList
            roles={roles}
            selectedRoleUuid={selectedUuid}
            onSelectRole={handleSelectRole}
            onCreateRole={() => setCreateOpen(true)}
            onEditRole={setEditRole}
            onDeleteRole={setDeleteRole}
            isLoading={rolesLoading}
          />
        </div>

        {/* Colonne droite */}
        <div className="flex-1 p-8 overflow-y-auto">
          {roleLoading && selectedUuid ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="mt-6 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : selectedRole ? (
            <Tabs defaultValue="permissions" className="flex flex-col h-full">
              <TabsList className="self-start mb-4">
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="users">
                  Utilisateurs ({selectedRole.usersCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="permissions" className="flex-1 overflow-y-auto mt-0">
                <PermissionsPanel
                  role={selectedRole}
                  catalog={catalog}
                  onSave={handleSyncPerms}
                  isSaving={isSyncing}
                  isReadOnly={selectedRole.isSystem}
                />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <RoleUsersPanel
                  role={selectedRole}
                  availableUsers={availableUsers}
                  onAssign={handleAssign}
                  onRemove={handleRemove}
                  isAssigning={isAssigning}
                  isRemoving={isRemoving}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <PermissionsPanel
              role={null}
              catalog={catalog}
              onSave={() => {}}
              isSaving={false}
              isReadOnly={false}
            />
          )}
        </div>
      </div>

      {/* ── Layout Mobile ── */}
      <div className="md:hidden">
        {mobileView === 'list' ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-4"
               style={{ minHeight: '60vh' }}>
            <RoleList
              roles={roles}
              selectedRoleUuid={selectedUuid}
              onSelectRole={handleSelectRole}
              onCreateRole={() => setCreateOpen(true)}
              onEditRole={setEditRole}
              onDeleteRole={setDeleteRole}
              isLoading={rolesLoading}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 gap-1.5 text-neutral-500"
              onClick={() => setMobileView('list')}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux rôles
            </Button>

            {selectedRole ? (
              <Tabs defaultValue="permissions">
                <TabsList className="mb-4">
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="users">Utilisateurs ({selectedRole.usersCount})</TabsTrigger>
                </TabsList>
                <TabsContent value="permissions">
                  <PermissionsPanel
                    role={selectedRole}
                    catalog={catalog}
                    onSave={handleSyncPerms}
                    isSaving={isSyncing}
                    isReadOnly={selectedRole.isSystem}
                  />
                </TabsContent>
                <TabsContent value="users">
                  <RoleUsersPanel
                    role={selectedRole}
                    availableUsers={availableUsers}
                    onAssign={handleAssign}
                    onRemove={handleRemove}
                    isAssigning={isAssigning}
                    isRemoving={isRemoving}
                  />
                </TabsContent>
              </Tabs>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <RoleFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit as any}
        isLoading={isCreating}
      />

      <RoleFormModal
        isOpen={!!editRole}
        onClose={() => setEditRole(null)}
        role={editRole ?? undefined}
        onSubmit={handleEditSubmit as any}
        isLoading={isUpdating}
      />

      <DeleteRoleDialog
        role={deleteRole}
        isOpen={!!deleteRole}
        onClose={() => setDeleteRole(null)}
        onConfirm={handleDeleteConfirm}
        availableRoles={roles}
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
