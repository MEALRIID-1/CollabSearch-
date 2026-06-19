import apiClient from './client';
import type { CustomRole, CustomRoleDetail, PermissionCatalogModule } from '@/types/models';

export interface CreateRolePayload {
  name: string
  color: string
  description?: string | null
  permissions: string[]
}

export interface UpdateRolePayload {
  name?: string
  color?: string
  description?: string | null
}

interface ApiResponse<T> {
  data: T
  message?: string
}

export const rolesApi = {
  /** Catalogue des permissions groupées par module (statique, mis en cache côté serveur) */
  getPermissionsCatalog: () =>
    apiClient.get<ApiResponse<PermissionCatalogModule[]>>('/api/v1/roles/permissions/catalog'),

  /** Liste des rôles de l'admin */
  getRoles: () =>
    apiClient.get<ApiResponse<CustomRole[]>>('/api/v1/roles'),

  /** Détail d'un rôle avec permissions et utilisateurs */
  getRole: (uuid: string) =>
    apiClient.get<ApiResponse<CustomRoleDetail>>(`/api/v1/roles/${uuid}`),

  /** Créer un rôle avec ses permissions initiales */
  createRole: (data: CreateRolePayload) =>
    apiClient.post<ApiResponse<CustomRoleDetail>>('/api/v1/roles', data),

  /** Modifier nom / couleur / description */
  updateRole: (uuid: string, data: UpdateRolePayload) =>
    apiClient.put<ApiResponse<CustomRoleDetail>>(`/api/v1/roles/${uuid}`, data),

  /** Remplacer intégralement les permissions */
  syncPermissions: (uuid: string, permissions: string[]) =>
    apiClient.put<ApiResponse<CustomRoleDetail>>(
      `/api/v1/roles/${uuid}/permissions`,
      { permissions }
    ),

  /** Supprimer un rôle */
  deleteRole: (uuid: string, replacementUuid?: string) =>
    apiClient.delete<ApiResponse<null>>(
      `/api/v1/roles/${uuid}`,
      { params: replacementUuid ? { replacement_uuid: replacementUuid } : undefined }
    ),

  /** Assigner un rôle à un utilisateur */
  assignRole: (roleUuid: string, userUuid: string) =>
    apiClient.post<ApiResponse<null>>(
      `/api/v1/roles/${roleUuid}/assign`,
      { user_uuid: userUuid }
    ),

  /** Retirer le rôle d'un utilisateur */
  removeRole: (userUuid: string) =>
    apiClient.delete<ApiResponse<null>>(
      `/api/v1/roles/users/${userUuid}/unassign`
    ),
};
