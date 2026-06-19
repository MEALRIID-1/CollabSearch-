import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/lib/api/roles';
import type { CreateRolePayload, UpdateRolePayload } from '@/lib/api/roles';
import { toast } from 'sonner';

// ─── Catalogue des permissions (statique) ─────────────────────────────────

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: async () => {
      const res = await rolesApi.getPermissionsCatalog();
      return res.data.data;
    },
    staleTime: Infinity, // Le catalogue ne change jamais
  });
}

// ─── Liste des rôles ───────────────────────────────────────────────────────

export function useRoles() {
  return useQuery({
    queryKey: ['custom-roles'],
    queryFn: async () => {
      const res = await rolesApi.getRoles();
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ─── Détail d'un rôle ─────────────────────────────────────────────────────

export function useRole(uuid: string | null) {
  return useQuery({
    queryKey: ['custom-role', uuid],
    queryFn: async () => {
      const res = await rolesApi.getRole(uuid!);
      return res.data.data;
    },
    enabled: !!uuid,
  });
}

// ─── Créer un rôle ────────────────────────────────────────────────────────

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRolePayload) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      toast.success('Rôle créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du rôle');
    },
  });
}

// ─── Modifier un rôle ─────────────────────────────────────────────────────

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: UpdateRolePayload }) =>
      rolesApi.updateRole(uuid, data),
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      queryClient.invalidateQueries({ queryKey: ['custom-role', uuid] });
      toast.success('Rôle mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du rôle');
    },
  });
}

// ─── Synchroniser les permissions ─────────────────────────────────────────

export function useSyncPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, permissions }: { uuid: string; permissions: string[] }) =>
      rolesApi.syncPermissions(uuid, permissions),
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: ['custom-role', uuid] });
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      toast.success('Permissions enregistrées');
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde des permissions');
    },
  });
}

// ─── Supprimer un rôle ────────────────────────────────────────────────────

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, replacementUuid }: { uuid: string; replacementUuid?: string }) =>
      rolesApi.deleteRole(uuid, replacementUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      toast.success('Rôle supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du rôle');
    },
  });
}

// ─── Assigner un rôle ─────────────────────────────────────────────────────

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleUuid, userUuid }: { roleUuid: string; userUuid: string }) =>
      rolesApi.assignRole(roleUuid, userUuid),
    onSuccess: (_, { roleUuid }) => {
      queryClient.invalidateQueries({ queryKey: ['custom-role', roleUuid] });
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rôle assigné');
    },
    onError: () => {
      toast.error("Erreur lors de l'assignation du rôle");
    },
  });
}

// ─── Retirer un rôle d'un utilisateur ─────────────────────────────────────

export function useRemoveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userUuid, roleUuid }: { userUuid: string; roleUuid: string }) =>
      rolesApi.removeRole(userUuid),
    onSuccess: (_, { roleUuid }) => {
      queryClient.invalidateQueries({ queryKey: ['custom-role', roleUuid] });
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      toast.success('Rôle retiré');
    },
    onError: () => {
      toast.error('Erreur lors du retrait du rôle');
    },
  });
}
