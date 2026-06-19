<?php

namespace App\Services;

use App\Models\CustomRole;
use App\Models\User;
use App\Services\PermissionCatalogService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomRoleService
{
    /**
     * Retourne tous les rôles de l'admin avec le nombre
     * de permissions et d'utilisateurs pour chaque rôle.
     */
    public function getRolesForAdmin(User $admin): Collection
    {
        return CustomRole::query()
            ->where('admin_id', $admin->id)
            ->with('permissions')
            ->orderBy('is_system', 'desc')
            ->orderBy('name', 'asc')
            ->get();
    }

    /**
     * Retourne un rôle spécifique avec ses permissions complètes.
     * Vérifie que le rôle appartient à l'admin.
     */
    public function getRoleWithPermissions(User $admin, string $roleUuid): CustomRole
    {
        $role = CustomRole::where('uuid', $roleUuid)->firstOrFail();
        $this->ensureAccessible($admin, $role);
        return $role->load('permissions', 'users');
    }

    /**
     * Crée un nouveau rôle pour l'admin avec ses permissions initiales.
     * Valide que chaque permission_key est une permission système valide.
     * Interdit la création d'un rôle nommé "administrator".
     */
    public function createRole(User $admin, array $data): CustomRole
    {
        if (strtolower($data['name']) === 'administrator') {
            abort(422, 'Le nom "administrator" est réservé au système.');
        }

        return DB::transaction(function () use ($admin, $data) {
            $role = CustomRole::create([
                'admin_id' => $admin->id,
                'name' => $data['name'],
                'slug' => Str::slug($data['name']),
                'description' => $data['description'] ?? null,
                'color' => $data['color'] ?? '#6366F1',
                'is_system' => false,
                'users_count' => 0,
            ]);

            if (!empty($data['permissions'])) {
                $this->syncPermissions($admin, $role, $data['permissions']);
            }

            return $role->load('permissions');
        });
    }

    /**
     * Modifie un rôle existant (nom, couleur, description).
     * Interdit la modification d'un rôle système (is_system = true).
     * Vérifie ownership.
     */
    public function updateRole(User $admin, CustomRole $role, array $data): CustomRole
    {
        $this->ensureAccessible($admin, $role);

        if ($role->is_system) {
            abort(403, 'Le rôle système ne peut pas être modifié.');
        }

        if (isset($data['name']) && strtolower($data['name']) === 'administrator') {
            abort(422, 'Le nom "administrator" est réservé au système.');
        }

        $role->update(array_filter([
            'name' => $data['name'] ?? null,
            'color' => $data['color'] ?? null,
            'description' => $data['description'] ?? null,
        ]));

        if (isset($data['name'])) {
            $role->slug = Str::slug($data['name']);
            $role->save();
        }

        return $role->refresh();
    }

    /**
     * Remplace intégralement les permissions d'un rôle.
     * Supprime toutes les permissions existantes puis insère les nouvelles.
     * Utilise une transaction DB.
     * Valide chaque clé de permission.
     * Interdit la modification des permissions du rôle système.
     */
    public function syncPermissions(User $admin, CustomRole $role, array $permissionKeys): CustomRole
    {
        $this->ensureAccessible($admin, $role);

        if ($role->is_system) {
            abort(403, 'Les permissions du rôle système ne peuvent pas être modifiées.');
        }

        // Valider chaque clé
        foreach ($permissionKeys as $key) {
            if (!PermissionCatalogService::isValidPermission($key)) {
                abort(422, "La permission '{$key}' n'est pas valide.");
            }
        }

        DB::transaction(function () use ($role, $permissionKeys) {
            $role->permissions()->delete();

            $records = array_map(fn($key) => [
                'role_id' => $role->id,
                'permission_key' => $key,
            ], $permissionKeys);

            DB::table('custom_role_permissions')->insert($records);
        });

        return $role->load('permissions');
    }

    /**
     * Supprime un rôle.
     * Interdit si is_system = true.
     * Interdit si des utilisateurs ont encore ce rôle (ou propose un rôle
     * de remplacement obligatoire).
     */
    public function deleteRole(User $admin, CustomRole $role, ?string $replacementRoleUuid = null): void
    {
        $this->ensureAccessible($admin, $role);

        if ($role->is_system) {
            abort(403, 'Le rôle système ne peut pas être supprimé.');
        }

        $users = $role->users;

        if ($users->isNotEmpty()) {
            if (!$replacementRoleUuid) {
                abort(422, 'Ce rôle est assigné à des utilisateurs. Veuillez spécifier un rôle de remplacement.');
            }

            $replacementRole = CustomRole::where('uuid', $replacementRoleUuid)->firstOrFail();
            $this->ensureAccessible($admin, $replacementRole);

            DB::transaction(function () use ($role, $replacementRole, $users, $admin) {
                foreach ($users as $user) {
                    DB::table('user_custom_roles')
                        ->where('user_id', $user->id)
                        ->where('role_id', $role->id)
                        ->delete();

                    $exists = DB::table('user_custom_roles')
                        ->where('user_id', $user->id)
                        ->where('role_id', $replacementRole->id)
                        ->exists();

                    if (!$exists) {
                        DB::table('user_custom_roles')->insert([
                            'user_id' => $user->id,
                            'role_id' => $replacementRole->id,
                            'assigned_by' => $admin->id,
                            'assigned_at' => now(),
                        ]);
                    }
                }

                CustomRole::where('id', $replacementRole->id)->update([
                    'users_count' => $replacementRole->users()->count()
                ]);
            });
        }

        $role->delete();
    }

    /**
     * Assigne un rôle custom à un utilisateur du workspace de l'admin.
     * Retire l'ancien rôle si l'utilisateur en avait déjà un.
     * Vérifie que le rôle et l'utilisateur appartiennent au même admin.
     */
    public function assignRoleToUser(User $admin, User $targetUser, CustomRole $role): void
    {
        $this->ensureAccessible($admin, $role);

        if (!$targetUser->isManagedBy($admin->id) && $targetUser->id !== $admin->id) {
            abort(403, 'Vous ne pouvez attribuer des rôles qu\'aux utilisateurs de votre espace.');
        }

        DB::transaction(function () use ($admin, $targetUser, $role) {
            $adminRoleIds = CustomRole::where('admin_id', $admin->id)->pluck('id')->toArray();

            DB::table('user_custom_roles')
                ->where('user_id', $targetUser->id)
                ->whereIn('role_id', $adminRoleIds)
                ->delete();

            DB::table('user_custom_roles')->insert([
                'user_id' => $targetUser->id,
                'role_id' => $role->id,
                'assigned_by' => $admin->id,
                'assigned_at' => now(),
            ]);

            foreach ($adminRoleIds as $roleId) {
                $count = DB::table('user_custom_roles')->where('role_id', $roleId)->count();
                CustomRole::where('id', $roleId)->update(['users_count' => $count]);
            }
        });
    }

    /**
     * Retire le rôle custom d'un utilisateur.
     */
    public function removeRoleFromUser(User $admin, User $targetUser): void
    {
        if (!$targetUser->isManagedBy($admin->id) && $targetUser->id !== $admin->id) {
            abort(403, 'Vous ne pouvez modifier que les utilisateurs de votre espace.');
        }

        DB::transaction(function () use ($admin, $targetUser) {
            $adminRoleIds = CustomRole::where('admin_id', $admin->id)->pluck('id')->toArray();

            DB::table('user_custom_roles')
                ->where('user_id', $targetUser->id)
                ->whereIn('role_id', $adminRoleIds)
                ->delete();

            foreach ($adminRoleIds as $roleId) {
                $count = DB::table('user_custom_roles')->where('role_id', $roleId)->count();
                CustomRole::where('id', $roleId)->update(['users_count' => $count]);
            }
        });
    }

    /**
     * Vérifie si l'admin a accès à ce rôle.
     */
    protected function ensureAccessible(User $admin, CustomRole $role): void
    {
        if ($role->admin_id !== $admin->id && !$role->is_system) {
            abort(403, 'Vous n\'êtes pas autorisé à accéder à ce rôle.');
        }
    }
}
