<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\CustomRole;
use App\Models\CustomRolePermission;
use App\Enums\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class SystemPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer tous les administrateurs
        $admins = User::role('administrator')->get();

        foreach ($admins as $admin) {
            DB::transaction(function () use ($admin) {
                // Vérifier s'il a déjà le rôle système
                $existingRole = CustomRole::where('admin_id', $admin->id)
                    ->where('slug', 'administrator')
                    ->first();

                if (!$existingRole) {
                    $role = CustomRole::create([
                        'uuid' => (string) Str::uuid(),
                        'admin_id' => $admin->id,
                        'name' => 'Administrateur',
                        'slug' => 'administrator',
                        'color' => '#2563EB',
                        'description' => 'Accès complet à toutes les fonctionnalités.',
                        'is_system' => true,
                    ]);
                } else {
                    $role = $existingRole;
                }

                // Insérer toutes les permissions
                $allPermissions = Permission::allKeys();
                $existingPermissions = $role->permissions()->pluck('permission_key')->toArray();
                $newPermissions = array_diff($allPermissions, $existingPermissions);

                foreach ($newPermissions as $key) {
                    CustomRolePermission::create([
                        'role_id' => $role->id,
                        'permission_key' => $key,
                    ]);
                }

                // Assigner ce rôle à l'admin s'il ne l'a pas déjà dans user_custom_roles
                $roleExistsForAdmin = DB::table('user_custom_roles')
                    ->where('user_id', $admin->id)
                    ->where('role_id', $role->id)
                    ->exists();

                if (!$roleExistsForAdmin) {
                    DB::table('user_custom_roles')->insert([
                        'user_id' => $admin->id,
                        'role_id' => $role->id,
                        'assigned_by' => $admin->id,
                        'assigned_at' => now(),
                    ]);
                }

                // Mettre à jour le users_count du rôle
                $usersCount = DB::table('user_custom_roles')
                    ->where('role_id', $role->id)
                    ->count();

                $role->updateQuietly(['users_count' => $usersCount]);
            });
        }
    }
}
